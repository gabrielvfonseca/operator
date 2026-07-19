// Policy tests cover register plugin behavior.
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  runDoctorLintChecks,
  type HealthCheck,
  type HealthCheckContext,
  type HealthFinding,
  type HealthRepairContext,
  type OperatorConfig,
} from "@gabrielvfonseca/operator/plugin-sdk/health";
import { clearHealthChecksForTest } from "@gabrielvfonseca/operator/plugin-sdk/plugin-test-runtime";
import { registerPolicyDoctorChecks } from "./register.js";

export let workspaceDir: string;

let originalOperatorHome: string | undefined;

let originalOperatorStateDir: string | undefined;

export function cfgWithPolicy(settings: Record<string, unknown> = {}): OperatorConfig {
  return {
    plugins: {
      entries: {
        policy: {
          enabled: true,
          config: { enabled: true, ...settings },
        },
      },
    },
  };
}

export function ctx(configPath: string, cfg: OperatorConfig = {}): HealthCheckContext {
  return {
    mode: "lint",
    runtime: {
      log() {},
      error() {},
      exit() {},
    },
    cfg,
    cwd: workspaceDir,
    configPath,
  };
}

export function repairCtx(configPath: string, cfg: OperatorConfig = {}): HealthRepairContext {
  return {
    ...ctx(configPath, cfg),
    mode: "fix",
  };
}

export function registerChecks(): readonly HealthCheck[] {
  const checks: HealthCheck[] = [];
  registerPolicyDoctorChecks({
    registerHealthCheck(check) {
      checks.push(check);
    },
  });
  return checks;
}

export async function runPolicyChecks(checkCtx: HealthCheckContext): Promise<{
  readonly findings: readonly HealthFinding[];
}> {
  const checks = registerChecks();
  const findings: HealthFinding[] = [];
  for (const check of checks) {
    findings.push(...(check.detect === undefined ? [] : await check.detect(checkCtx)));
  }
  return { findings };
}

export async function runPolicyDoctorLint(checkCtx: HealthCheckContext) {
  return runDoctorLintChecks(checkCtx, { checks: registerChecks() });
}

export async function runDeniedChannelRepair(repairCheckCtx: HealthRepairContext) {
  const check = registerChecks().find((entry) => entry.id === "policy/channels-denied-provider");
  if (check?.detect === undefined || check.repair === undefined) {
    throw new Error("policy channel repair check was not registered");
  }
  const findings = await check.detect(repairCheckCtx);
  const result = await check.repair(repairCheckCtx, findings);
  const config = result.config ?? repairCheckCtx.cfg;
  const remainingFindings = await check.detect({ ...repairCheckCtx, cfg: config });
  return { ...result, config, remainingFindings };
}

export async function runPolicyRepairCheck(checkId: string, repairCheckCtx: HealthRepairContext) {
  const check = registerChecks().find((entry) => entry.id === checkId);
  if (check?.detect === undefined || check.repair === undefined) {
    throw new Error(`${checkId} repair check was not registered`);
  }
  const findings = await check.detect(repairCheckCtx);
  const result = await check.repair(repairCheckCtx, findings);
  const config = result.config ?? repairCheckCtx.cfg;
  const remainingFindings =
    repairCheckCtx.dryRun === true ? [] : await check.detect({ ...repairCheckCtx, cfg: config });
  return { ...result, findings, config, remainingFindings };
}

export const describe0BeforeEach0 = async () => {
  clearHealthChecksForTest();
  originalOperatorHome = process.env.OPERATOR_HOME;
  originalOperatorStateDir = process.env.OPERATOR_STATE_DIR;
  workspaceDir = await fs.mkdtemp(join(tmpdir(), "policy-doctor-"));
  process.env.OPERATOR_HOME = workspaceDir;
  delete process.env.OPERATOR_STATE_DIR;
  await fs.mkdir(join(workspaceDir, ".operator"), { recursive: true });
  try {
    await fs.symlink(
      "../exec-approvals.json",
      join(workspaceDir, ".operator", "exec-approvals.json"),
    );
  } catch (err) {
    if (typeof err !== "object" || err === null || !("code" in err) || err.code !== "EPERM") {
      throw err;
    }
    await fs.rm(join(workspaceDir, ".operator"), { recursive: true, force: true });
    await fs.symlink(workspaceDir, join(workspaceDir, ".operator"), "junction");
  }
};

export const describe0AfterEach1 = async () => {
  if (originalOperatorHome === undefined) {
    delete process.env.OPERATOR_HOME;
  } else {
    process.env.OPERATOR_HOME = originalOperatorHome;
  }
  if (originalOperatorStateDir === undefined) {
    delete process.env.OPERATOR_STATE_DIR;
  } else {
    process.env.OPERATOR_STATE_DIR = originalOperatorStateDir;
  }
  await fs.rm(workspaceDir, { recursive: true, force: true });
  clearHealthChecksForTest();
};
