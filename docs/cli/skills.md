---
summary: "CLI reference for `operator skills` (search/install/update/verify/list/info/check/workshop)"
read_when:
  - You want to see which skills are available and ready to run
  - You want to search ClawHub or install skills from ClawHub, Git, or local directories
  - You want to verify a ClawHub skill with ClawHub
  - You want to debug missing binaries/env/config for skills
title: "Skills"
---

# `operator skills`

Inspect local skills, search ClawHub, install skills from ClawHub/Git/local
directories, verify ClawHub skills, and update ClawHub-tracked installs.

Related:

- Skills system: [Skills](/tools/skills)
- Skill Workshop: [Skill Workshop](/tools/skill-workshop)
- Skills config: [Skills config](/tools/skills-config)
- ClawHub installs: [ClawHub](/clawhub/cli)

## Commands

```bash
operator skills search "calendar"
operator skills search --limit 20 --json
operator skills install @owner/<slug>
operator skills install @owner/<slug> --version <version>
operator skills install git:owner/repo
operator skills install git:owner/repo@main
operator skills install ./path/to/skill --as custom-name
operator skills install @owner/<slug> --force
operator skills install @owner/<slug> --force-install
operator skills install @owner/<slug> --acknowledge-clawhub-risk
operator skills install @owner/<slug> --agent <id>
operator skills install @owner/<slug> --global
operator skills update @owner/<slug>
operator skills update @owner/<slug> --force-install
operator skills update @owner/<slug> --acknowledge-clawhub-risk
operator skills update @owner/<slug> --global
operator skills update --all
operator skills update --all --agent <id>
operator skills update --all --global
operator skills verify @owner/<slug>
operator skills verify @owner/<slug> --version <version>
operator skills verify @owner/<slug> --tag <tag>
operator skills verify @owner/<slug> --card
operator skills verify @owner/<slug> --global
operator skills list
operator skills list --eligible
operator skills list --json
operator skills list --verbose
operator skills list --agent <id>
operator skills info <name>
operator skills info <name> --json
operator skills info <name> --agent <id>
operator skills check
operator skills check --agent <id>
operator skills check --json
operator skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
operator skills workshop propose-update qa-check --proposal ./PROPOSAL.md
operator skills workshop list
operator skills workshop inspect <proposal-id>
operator skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
operator skills workshop apply <proposal-id>
operator skills workshop reject <proposal-id> --reason "Not reusable"
operator skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update`, and `verify` use ClawHub directly. `install @owner/<slug>`
installs a ClawHub skill, `install git:owner/repo[@ref]` clones a Git skill,
and `install ./path` copies a local skill directory. By default, `install`,
`update`, and `verify` target the active workspace `skills/` directory; with
`--global`, they target the shared managed skills directory. `list`/`info`/`check`
still inspect the local skills visible to the current workspace and config.
Workspace-backed commands resolve the target workspace from `--agent <id>`,
then the current working directory when it is inside a configured agent
workspace, then the default agent.

Git and local directory installs expect `SKILL.md` at the source root. The
install slug comes from `SKILL.md` frontmatter `name` when it is valid, then
the source directory or repository name; use `--as <slug>` to override it.
`--version` is ClawHub-only. Skill installs do not support npm package specs
or zip/archive paths, and `operator skills update` updates ClawHub-tracked
installs only.

Gateway-backed skill dependency installs triggered from onboarding or Skills
settings use the separate `skills.install` request path instead.

Notes:

| Flag/behavior                    | Description                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Optional query; omit it to browse the default ClawHub search feed.                                                                                                                                                                                                                |
| `search --limit <n>`             | Caps returned results.                                                                                                                                                                                                                                                            |
| `install git:owner/repo[@ref]`   | Installs a Git skill. Branch refs may contain slashes, such as `git:owner/repo@feature/foo`.                                                                                                                                                                                      |
| `install ./path/to/skill`        | Installs a local directory whose root contains `SKILL.md`.                                                                                                                                                                                                                        |
| `install --as <slug>`            | Overrides the inferred slug for Git and local directory installs.                                                                                                                                                                                                                 |
| `install --version <version>`    | Applies only to ClawHub skill refs.                                                                                                                                                                                                                                               |
| `install --force`                | Overwrites an existing workspace skill folder for the same slug.                                                                                                                                                                                                                  |
| `install/update --force-install` | Installs a pending GitHub-backed ClawHub skill before ClawHub's scan completes.                                                                                                                                                                                                   |
| `--global`                       | Targets the shared managed skills directory; cannot combine with `--agent <id>`.                                                                                                                                                                                                  |
| `--agent <id>`                   | Targets one configured agent workspace; overrides current working directory inference.                                                                                                                                                                                            |
| `update @owner/<slug>`           | Updates a single tracked skill. Add `--global` to target the shared managed skills directory instead of the workspace.                                                                                                                                                            |
| `update --all`                   | Updates tracked ClawHub installs in the selected workspace, or the shared managed skills directory with `--global`.                                                                                                                                                               |
| `verify @owner/<slug>`           | Prints ClawHub's `clawhub.skill.verify.v1` JSON envelope by default. There is no `--json` flag because JSON is already the default. Bare slugs are accepted for compatibility when the skill is already installed or unambiguous; owner-qualified refs avoid publisher ambiguity. |
| `verify` provenance              | When ClawHub returns server-resolved source provenance, verify JSON also includes a commit-pinned `operator.verifiedSourceUrl`. Unavailable or self-declared source URLs stay only in the raw provenance envelope and are not promoted.                                           |
| `verify` version selector        | `verify` uses `.clawhub/origin.json` for installed ClawHub skills, so it verifies the installed version against the registry it came from. `--version` and `--tag` override the version selector but keep that installed registry when origin metadata exists.                    |
| `verify --card`                  | Prints the generated Skill Card Markdown instead of JSON. Exits non-zero when ClawHub returns `ok: false` or `decision: "fail"`; unsigned signatures are informational unless ClawHub policy changes.                                                                             |
| Skill Card fingerprint           | Installed ClawHub bundles can include a generated `skill-card.md`. Operator treats verification as a ClawHub server decision and does not reject an installed skill just because that generated card changes the bundle fingerprint.                                              |
| `check --agent <id>`             | Checks the selected agent's workspace and reports which ready skills are actually visible to that agent's prompt or command surface.                                                                                                                                              |
| `list`                           | Default action when no subcommand is provided.                                                                                                                                                                                                                                    |
| `list`/`info`/`check` output     | Rendered output goes to stdout. With `--json`, the machine-readable payload stays on stdout for pipes and scripts.                                                                                                                                                                |

Community ClawHub skill installs and updates check trust before downloading.
Versioned community archive releases use exact-release trust metadata.
Resolver-backed GitHub skills rely on ClawHub's install resolver to enforce
scan and force-install policy before it returns a pinned commit; use
`--force-install` to install a pending GitHub-backed skill before that scan
completes. Malicious or blocked community releases are refused. Risky
community releases require review and `--acknowledge-clawhub-risk` when a
non-interactive command should continue after that review. Official ClawHub
skill publishers and bundled Operator skill sources bypass this release-trust
prompt.

## Skill Workshop

`operator skills workshop` manages pending skill proposals in the selected
workspace. Proposals are not active skills until applied. For proposal
storage, support-file safeguards, Gateway methods, and approval policy, see
[Skill Workshop](/tools/skill-workshop).

```bash
operator skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
operator skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
operator skills workshop propose-update qa-check --proposal ./PROPOSAL.md
operator skills workshop list
operator skills workshop inspect <proposal-id>
operator skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
operator skills workshop apply <proposal-id>
operator skills workshop reject <proposal-id> --reason "Duplicate"
operator skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`propose-create`, `propose-update`, and `revise` also accept `--goal <text>`
and `--evidence <text>` to record the proposal's motivation and supporting
notes alongside the `--proposal`/`--proposal-dir` content.

## Related

- [CLI reference](/cli)
- [Skills](/tools/skills)
