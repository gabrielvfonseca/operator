import { describe, expect, it, vi } from "vitest";
import {
  resolveOperatorNpmResumeRun,
  validateOperatorNpmResumeRun,
} from "../../scripts/operator-npm-resume-run.mjs";
import type { OperatorNpmResumeValidationInput } from "../../scripts/operator-npm-resume-run.mjs";

const SHA = "a".repeat(40);
const TAG_OBJECT_SHA = "b".repeat(40);
const BRANCH = `release-publish/${SHA.slice(0, 12)}-123`;
const URL = "https://github.com/operator/operator/actions/runs/456";

function fixture(
  overrides: Partial<OperatorNpmResumeValidationInput> = {},
): OperatorNpmResumeValidationInput {
  return {
    canonicalWorkflowId: 101,
    compareStatus: "identical",
    jobs: [{ conclusion: "success", name: "validate_publish_request" }],
    run: {
      conclusion: "success",
      event: "workflow_dispatch",
      head_branch: BRANCH,
      head_sha: SHA,
      html_url: URL,
      path: `.github/workflows/operator-npm-release.yml@refs/tags/${BRANCH}`,
      workflow_id: 101,
    },
    tag: {
      object: { sha: SHA, type: "commit" },
      verification: { verified: true },
    },
    tagRef: { object: { sha: TAG_OBJECT_SHA, type: "tag" } },
    ...overrides,
  };
}

describe("operator npm resume run identity", () => {
  it("accepts a successful run bound to a signed main-reachable tooling tag", () => {
    expect(validateOperatorNpmResumeRun(fixture())).toEqual({
      tagObjectSha: TAG_OBJECT_SHA,
      url: URL,
      workflowRef: `refs/tags/${BRANCH}`,
      workflowSha: SHA,
    });
  });

  it.each([
    ["branch", { run: { ...fixture().run, head_branch: "main" } }, "untrusted workflow ref"],
    ["workflow", { run: { ...fixture().run, workflow_id: 999 } }, "untrusted workflow identity"],
    ["event", { run: { ...fixture().run, event: "push" } }, "untrusted workflow identity"],
    [
      "conclusion",
      { run: { ...fixture().run, conclusion: "failure" } },
      "untrusted workflow identity",
    ],
    [
      "path",
      { run: { ...fixture().run, path: ".github/workflows/ci.yml" } },
      "untrusted workflow identity",
    ],
    [
      "tag kind",
      { tagRef: { object: { sha: TAG_OBJECT_SHA, type: "commit" } } },
      "not a signed annotated tag",
    ],
    [
      "tag target",
      { tag: { ...fixture().tag, object: { sha: "c".repeat(40), type: "commit" } } },
      "not bound to a real",
    ],
    [
      "signature",
      { tag: { ...fixture().tag, verification: { verified: false } } },
      "not bound to a real",
    ],
    ["main ancestry", { compareStatus: "diverged" }, "not bound to a real"],
    [
      "approval",
      { jobs: [{ conclusion: "failure", name: "validate_publish_request" }] },
      "lacks successful parent release approval",
    ],
  ])("rejects an untrusted %s", (_label, overrides, message) => {
    expect(() => validateOperatorNpmResumeRun(fixture(overrides))).toThrow(message);
  });

  it("loads the exact run, workflow, signed tag, ancestry, and approval job", () => {
    const responses = new Map<string, unknown>([
      [`api repos/operator/operator/actions/runs/456 --method GET`, fixture().run],
      [
        `api repos/operator/operator/actions/workflows/operator-npm-release.yml --method GET`,
        { id: 101 },
      ],
      [`api repos/operator/operator/git/ref/tags/${BRANCH} --method GET`, fixture().tagRef],
      [`api repos/operator/operator/git/tags/${TAG_OBJECT_SHA} --method GET`, fixture().tag],
      [`api repos/operator/operator/compare/${SHA}...main --method GET`, { status: "identical" }],
      [`run view 456 --repo operator/operator --json jobs --jq .jobs`, fixture().jobs],
    ]);
    const runGh = vi.fn((args: string[]) => {
      const response = responses.get(args.join(" "));
      if (!response) {
        throw new Error(`Unexpected gh invocation: ${args.join(" ")}`);
      }
      return JSON.stringify(response);
    });

    expect(
      resolveOperatorNpmResumeRun({ repo: "operator/operator", runGh, runId: "456" }),
    ).toMatchObject({ workflowRef: `refs/tags/${BRANCH}`, workflowSha: SHA });
    expect(runGh).toHaveBeenCalledTimes(6);
  });
});
