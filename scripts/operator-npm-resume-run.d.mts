export interface operatorNpmResumeRunRecord {
  conclusion?: unknown;
  event?: unknown;
  head_branch?: unknown;
  head_sha?: unknown;
  html_url?: unknown;
  path?: unknown;
  workflow_id?: unknown;
}

export interface operatorNpmResumeTagRecord {
  object?: {
    sha?: unknown;
    type?: unknown;
  };
  verification?: {
    verified?: unknown;
  };
}

export interface operatorNpmResumeJobRecord {
  conclusion?: unknown;
  name?: unknown;
}

export interface operatorNpmResumeValidationInput {
  canonicalWorkflowId: unknown;
  compareStatus: unknown;
  jobs: operatorNpmResumeJobRecord[];
  run: operatorNpmResumeRunRecord;
  tag: operatorNpmResumeTagRecord;
  tagRef: operatorNpmResumeTagRecord;
}

export interface operatorNpmResumeIdentity {
  tagObjectSha: string;
  url: string;
  workflowRef: string;
  workflowSha: string;
}

export function validateoperatorNpmResumeRun(
  input: operatorNpmResumeValidationInput,
): operatorNpmResumeIdentity;

export function resolveoperatorNpmResumeRun(options: {
  repo: string;
  runId: string;
  runGh?: (args: string[]) => string;
}): operatorNpmResumeIdentity;

export function main(argv?: string[]): void;
