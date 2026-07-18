"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@operator/design-system";
import { CONSOLE_BUILD_INFO } from "@/env.ts";
import { useGatewayStatus } from "@/lib/gateway-client.tsx";

type CopyState = "idle" | "copying" | "copied" | "error";

const COPY_RESULT_VISIBLE_MS = 1800;

export default function AboutPage() {
  const gateway = useGatewayStatus();
  const [copyState, setCopyState] = React.useState<CopyState>("idle");
  const [waving, setWaving] = React.useState(false);
  const waveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (waveTimer.current) clearTimeout(waveTimer.current);
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const pokeClawd = () => {
    if (waving) {
      return;
    }
    setWaving(true);
    waveTimer.current = setTimeout(() => setWaving(false), 1400);
  };

  const copyCommit = async () => {
    const commit = CONSOLE_BUILD_INFO.commit;
    if (!commit || copyState === "copying") {
      return;
    }
    setCopyState("copying");
    let copied = false;
    try {
      await navigator.clipboard?.writeText(commit);
      copied = true;
    } catch {
      copied = false;
    }
    setCopyState(copied ? "copied" : "error");
    copyTimer.current = setTimeout(() => setCopyState("idle"), COPY_RESULT_VISIBLE_MS);
  };

  const copyLabel =
    copyState === "copied"
      ? "Copied"
      : copyState === "error"
        ? "Copy failed"
        : "Copy commit";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="page-title text-2xl font-semibold">About</div>
      <Card>
        <CardHeader>
          <CardTitle>Operator Console</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <Row label="Console version" value={CONSOLE_BUILD_INFO.version} />
          <Row label="Gateway version" value={gateway.version ?? "—"} />
          <Row label="Build channel" value={CONSOLE_BUILD_INFO.channel} />
          <Row label="Build hash" value={CONSOLE_BUILD_INFO.buildHash || "—"} />
          <div className="flex items-center gap-2">
            <span className="w-36 shrink-0 text-muted-foreground">Commit</span>
            <code className="flex-1 rounded bg-muted px-2 py-1 text-xs">
              {CONSOLE_BUILD_INFO.commit || "—"}
            </code>
            <Button size="sm" variant="outline" onClick={() => void copyCommit()}>
              {copyLabel}
            </Button>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={pokeClawd}
              className="text-3xl transition-transform"
              aria-label="Poke Clawd"
            >
              <span className={waving ? "inline-block animate-wiggle" : "inline-block"}>🦅</span>
            </button>
            <span className="text-xs text-muted-foreground">
              Poke Clawd for a wave.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      <span className="flex-1 truncate">{value}</span>
    </div>
  );
}
