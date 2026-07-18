"use client";

import * as React from "react";

/**
 * Self-contained Gateway protocol client for the Operator Console.
 *
 * Implements the same WebSocket wire contract the legacy Control UI uses
 * (hello handshake + ping/pong, then `req`/`res` JSON-RPC-style frames) without
 * pulling in the Lit app's `@operator/gateway-client` module graph. The console
 * builds independently during the incremental migration; once the workspace
 * packages are wired into the Next build, this can be swapped for the shared
 * client. The method vocabulary matches `ui/src/pages/**` exactly.
 */

export interface GatewaySnapshot {
  connected: boolean;
  version: string | null;
}

interface HelloMessage {
  type: "hello";
  server?: { version?: string };
}

interface PongMessage {
  type: "pong";
  server?: { version?: string };
}

type GatewayMessage =
  | HelloMessage
  | PongMessage
  | { type: string; server?: { version?: string } };

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  timer?: ReturnType<typeof setTimeout>;
}

export class GatewayError extends Error {
  code: string;
  details?: unknown;
  retryable: boolean;
  constructor(info: { code?: string; message?: string; details?: unknown; retryable?: boolean }) {
    super(info.message ?? "gateway request failed");
    this.name = "GatewayError";
    this.code = info.code ?? "UNAVAILABLE";
    this.details = info.details;
    this.retryable = info.retryable === true;
  }
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function resolveGatewayWsUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const explicit = process.env.NEXT_PUBLIC_OPERATOR_GATEWAY_URL;
  const origin = explicit
    ? explicit.replace(/^http/, "ws")
    : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
  return origin.replace(/\/+$/, "");
}

const REQUEST_TIMEOUT_MS = 30_000;

// Gateway protocol handshake constants. Keep in sync with
// `packages/gateway-protocol/src/version.ts` and `client-info.ts`.
// The console intentionally does not import the workspace package so it builds
// independently during the incremental migration.
const PROTOCOL_VERSION = 4;
const MIN_CLIENT_PROTOCOL_VERSION = 4;
const CLIENT_ID = "openclaw-control-ui";
const CLIENT_MODE = "ui";

export class GatewayClient {
  private socket: WebSocket | null = null;
  private closedByUs = false;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly pending = new Map<string, PendingRequest>();
  private readonly listeners = new Set<(event: unknown) => void>();
  private readonly statusListeners = new Set<(connected: boolean) => void>();
  private readonly readyListeners = new Set<() => void>();
  private version: string | null = null;
  private connected = false;
  private handshakeDone = false;
  private connectRequestId: string | null = null;

  constructor(private url: string | null) {}

  onStatus(listener: (connected: boolean) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.connected);
    return () => this.statusListeners.delete(listener);
  }

  onEvent(listener: (event: unknown) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Fires once when the handshake completes (and again after each reconnect). */
  onReady(listener: () => void): () => void {
    this.readyListeners.add(listener);
    if (this.handshakeDone) {
      listener();
    }
    return () => this.readyListeners.delete(listener);
  }

  getVersion(): string | null {
    return this.version;
  }

  isConnected(): boolean {
    return this.connected;
  }

  connect(): void {
    const url = this.url;
    if (!url || typeof window === "undefined") {
      return;
    }
    this.closedByUs = false;
    this.open();
  }

  private open(): void {
    const url = this.url;
    if (!url) {
      return;
    }
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch (error) {
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;
    this.handshakeDone = false;

    socket.onopen = () => {
      this.connected = true;
      this.emitStatus();
      this.pingTimer = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, 15_000);
      this.sendConnect();
    };

    socket.onmessage = (event) => {
      let message: GatewayMessage | null = null;
      try {
        message = JSON.parse(event.data as string) as GatewayMessage;
      } catch {
        return;
      }
      if (!message) {
        return;
      }
      if (message.type === "hello" || message.type === "pong") {
        this.version = message.server?.version?.trim() || this.version;
        this.emitStatus();
      } else if (message.type === "res") {
        const frame = message as unknown as ResponseFrame;
        if (this.connectRequestId && frame.id === this.connectRequestId) {
          this.connectRequestId = null;
          if (frame.ok) {
            this.handshakeDone = true;
            const payload = frame.payload as { server?: { version?: string } } | null;
            if (payload?.server?.version) {
              this.version = payload.server.version.trim();
            }
            this.emitStatus();
            this.emitReady();
          } else {
            this.scheduleReconnect();
          }
          return;
        }
        this.handleResponse(frame);
      } else if (message.type === "event") {
        for (const listener of this.listeners) {
          listener(message);
        }
      }
    };

    socket.onclose = () => {
      if (this.pingTimer) {
        clearInterval(this.pingTimer);
        this.pingTimer = null;
      }
      this.connected = false;
      this.handshakeDone = false;
      this.version = null;
      this.emitStatus();
      if (!this.closedByUs) {
        this.scheduleReconnect();
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  /**
   * Sends the gateway `connect` handshake (the first frame the server requires
   * before serving `req` frames). Minimal valid ConnectParams: protocol bounds
   * plus a client identity. Auth is deferred; the gateway returns operator
   * scopes it permits for an unauthenticated loopback browser client.
   */
  private sendConnect(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    const id = randomId();
    this.connectRequestId = id;
    const params = {
      minProtocol: MIN_CLIENT_PROTOCOL_VERSION,
      maxProtocol: PROTOCOL_VERSION,
      client: {
        id: CLIENT_ID,
        version: "console",
        platform: typeof navigator !== "undefined" ? navigator.platform || "web" : "web",
        mode: CLIENT_MODE,
      },
      role: "operator",
      scopes: ["operator.read", "operator.write"],
    };
    try {
      this.socket.send(JSON.stringify({ type: "req", id, method: "connect", params }));
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.closedByUs) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.open();
    }, 2000);
  }

  private emitStatus(): void {
    for (const listener of this.statusListeners) {
      listener(this.connected);
    }
  }

  private emitReady(): void {
    for (const listener of this.readyListeners) {
      listener();
    }
  }

  private handleResponse(frame: ResponseFrame): void {
    const pending = this.pending.get(frame.id);
    if (!pending) {
      return;
    }
    this.pending.delete(frame.id);
    if (pending.timer) {
      clearTimeout(pending.timer);
    }
    if (frame.ok) {
      pending.resolve(frame.payload ?? null);
    } else {
      pending.reject(
        new GatewayError({
          code: frame.error?.code,
          message: frame.error?.message,
          details: frame.error?.details,
          retryable: frame.error?.retryable,
        }),
      );
    }
  }

  request<T = unknown>(method: string, params?: unknown): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const socket = this.socket;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        reject(new GatewayError({ code: "UNAVAILABLE", message: "gateway not connected" }));
        return;
      }
      if (!this.handshakeDone) {
        reject(new GatewayError({ code: "UNAVAILABLE", message: "gateway handshake not complete" }));
        return;
      }
      const id = randomId();
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(
          new GatewayError({
            code: "TIMEOUT",
            message: `gateway request timed out after ${REQUEST_TIMEOUT_MS}ms: ${method}`,
          }),
        );
      }, REQUEST_TIMEOUT_MS);
      this.pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });
      try {
        socket.send(JSON.stringify({ type: "req", id, method, params }));
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  disconnect(): void {
    this.closedByUs = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.handshakeDone = false;
    this.connectRequestId = null;
    this.socket?.close();
    this.socket = null;
    this.pending.clear();
  }
}

interface ResponseFrame {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: { code?: string; message?: string; details?: unknown; retryable?: boolean };
}

const clientContext = React.createContext<GatewayClient | null>(null);

export function GatewayClientProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => new GatewayClient(resolveGatewayWsUrl()));
  React.useEffect(() => {
    client.connect();
    return () => client.disconnect();
  }, [client]);
  return <clientContext.Provider value={client}>{children}</clientContext.Provider>;
}

export function useGatewayClient(): GatewayClient | null {
  return React.useContext(clientContext);
}

export function useGatewayStatus(): GatewaySnapshot {
  const client = useGatewayClient();
  const [snapshot, setSnapshot] = React.useState<GatewaySnapshot>({
    connected: false,
    version: null,
  });
  React.useEffect(() => {
    if (!client) {
      return;
    }
    const offStatus = client.onStatus((connected) => {
      setSnapshot({ connected, version: client.getVersion() });
    });
    return offStatus;
  }, [client]);
  return snapshot;
}

/**
 * Fetches a gateway resource once on mount and re-fetches when `method` changes.
 * Returns `{ data, error, loading }` so pages stay simple and resilient while
 * the legacy Control UI is still the source of truth behind the proxy.
 */
export function useGatewayRequest<T = unknown>(
  method: string | null,
  params?: unknown,
): { data: T | null; error: string | null; loading: boolean } {
  const client = useGatewayClient();
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(Boolean(method));
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!client) {
      setReady(false);
      return;
    }
    return client.onReady(() => setReady(true));
  }, [client]);

  React.useEffect(() => {
    if (!client || !method || !ready) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    client
      .request<T>(method, params)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client, method, ready, JSON.stringify(params ?? null)]);

  return { data, error, loading };
}
