import { describe, expect, it, vi } from "vitest";
import { stopWorkspace } from "../../../src/pages/plugin/workspace-controller.ts";
import type { GatewayBrowserClient } from "../../api/gateway.ts";
import { getWorkspaceState, subscribeToWorkspaceEvents } from "../../lib/workspace/index.ts";

describe("workspace controller", () => {
  it("stops the live-update subscription for its host", () => {
    const host = {};
    const state = getWorkspaceState(host);
    const unsubscribe = vi.fn();
    const client = {
      request: vi.fn(),
      addEventListener: vi.fn(() => unsubscribe),
    } as unknown as GatewayBrowserClient;
    subscribeToWorkspaceEvents(host, state, client);
    stopWorkspace(host);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("is a no-op for a host that never subscribed", () => {
    expect(() => stopWorkspace({})).not.toThrow();
  });
});
