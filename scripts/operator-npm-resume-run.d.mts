export interface OperatorNpmResumeRunRecord {
  conclusion?: unknown;
  event?: unknown;
  head_branch?: unknown;
  head_sha?: unknown;
  html_url?: unknown;
  path?: unknown;
  workflow_id?: unknown;
}

export interface OperatorNpmResumeTagRecord {
  object?: {
    sha?: unknown;
    type?: unknown;
  };
  verification?: {
    verified?: unknown;
  };
}

export interface OperatorNpmResumeJobRecord {
  conclusion?: unknown;
  name?: unknown;
}

export interface OperatorNpmResumeValidationInput {
  canonicalWorkflowId: unknown;
  compareStatus: unknown;
  jobs: OperatorNpmResumeJobRecord[];
  run: OperatorNpmResumeRunRecord;
  tag: OperatorNpmResumeTagRecord;
  tagRef: OperatorNpmResumeTagRecord;
}

export interface OperatorNpmResumeIdentity {
  tagObjectSha: string;
  url: string;
  workflowRef: string;
  workflowSha: string;
}

export function validateOperatorNpmResumeRun(
  input: OperatorNpmResumeValidationInput,
): OperatorNpmResumeIdentity;

export function resolveOperatorNpmResumeRun(options: {
  repo: string;
  runId: string;
  runGh?: (args: string[]) => string;
}): OperatorNpmResumeIdentity;

export function main(argv?: string[]): void;
