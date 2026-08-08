// Operator live rescue channel tests cover live-channel rescue message delivery.
import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { CommandContext } from "../../src/auto-reply/reply/commands-types.js";
import { clearConfigCache } from "../../src/config/config.js";
import type { OperatorConfig } from "../../src/config/types.operator.js";
import { withTempDir } from "../../src/test-helpers/temp-dir.js";
import { deleteTestEnvValue, setTestEnvValue } from "../../src/test-utils/env.js";
import { runSystemAgentRescueMessage } from "../../src/system-agent/rescue-message.js";

const originalStateDir = process.env.OPERATOR_STATE_DIR;
const originalConfigPath = process.env.OPERATOR_CONFIG_PATH;

function truthy(value: string | undefined): boolean {
  return /^(1|true|yes|on)$/i.test(value?.trim() ?? "");
}

const runLive =
  truthy(process.env.OPERATOR_LIVE_TEST) &&
  truthy(process.env.OPERATOR_LIVE_SYSTEM_AGENT_RESCUE_CHANNEL);
const describeLive = runLive ? describe : describe.skip;

function commandContext(channel = process.env.OPERATOR_LIVE_SYSTEM_AGENT_CHANNEL ?? "whatsapp") {
  return {
    surface: channel,
    channel,
    channelId: channel,
    ownerList: ["user:owner"],
    senderIsOwner: true,
    isAuthorizedSender: true,
    senderId: "user:owner",
    rawBodyNormalized: "/operator status",
    commandBodyNormalized: "/operator status",
    from: "user:owner",
    to: "account:default",
  } satisfies CommandContext;
}

async function runRescue(params: {
  commandBody: string;
  cfg: OperatorConfig;
  ctx?: CommandContext;
}) {
  const ctx = params.ctx ?? commandContext();
  return await runSystemAgentRescueMessage({
    cfg: params.cfg,
    command: { ...ctx, commandBodyNormalized: params.commandBody },
    commandBody: params.commandBody,
    isGroup: false,
  });
}

describeLive("Operator live rescue channel smoke", () => {
  afterEach(() => {
    clearConfigCache();
    if (originalStateDir === undefined) {
      deleteTestEnvValue("OPERATOR_STATE_DIR");
    } else {
      setTestEnvValue("OPERATOR_STATE_DIR", originalStateDir);
    }
    if (originalConfigPath === undefined) {
      deleteTestEnvValue("OPERATOR_CONFIG_PATH");
    } else {
      setTestEnvValue("OPERATOR_CONFIG_PATH", originalConfigPath);
    }
  });

  it("handles /operator status and a persistent approval roundtrip", async () => {
    await withTempDir({ prefix: "operator-live-rescue-" }, async (tempDir) => {
      const configPath = path.join(tempDir, "operator.json");
      setTestEnvValue("OPERATOR_STATE_DIR", tempDir);
      setTestEnvValue("OPERATOR_CONFIG_PATH", configPath);
      await fs.writeFile(
        configPath,
        JSON.stringify(
          {
            meta: { lastTouchedVersion: "live-test", lastTouchedAt: new Date(0).toISOString() },
            agents: { defaults: {} },
            tools: { exec: { security: "full", ask: "off" } },
          },
          null,
          2,
        ),
      );

      const cfg: OperatorConfig = {
        systemAgent: { rescue: { enabled: true } },
        tools: { exec: { security: "full", ask: "off" } },
      };

      await expect(runRescue({ commandBody: "/operator status", cfg })).resolves.toContain(
        "[operator] done: status.check",
      );
      await expect(
        runRescue({ commandBody: "/operator set default model openai/gpt-5.5", cfg }),
      ).resolves.toContain("Reply /operator yes to apply");
      await expect(runRescue({ commandBody: "/operator yes", cfg })).resolves.toContain(
        "Default model: openai/gpt-5.5",
      );

      const config = JSON.parse(await fs.readFile(configPath, "utf8")) as OperatorConfig;
      const defaultModel = config.agents?.defaults?.model;
      if (!defaultModel || typeof defaultModel !== "object") {
        throw new Error("expected default model object");
      }
      expect(defaultModel.primary).toBe("openai/gpt-5.5");
      const auditPath = path.join(tempDir, "audit", "system-agent.jsonl");
      const auditLines = (await fs.readFile(auditPath, "utf8")).trim().split("\n");
      expect(auditLines.some((line) => line.includes('"operation":"config.setDefaultModel"'))).toBe(
        true,
      );
    });
  });
});
