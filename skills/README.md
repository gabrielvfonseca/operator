# Repository Skills

Canonical skill library for this repository. Skills are procedural, agent-neutral instructions identified by a `SKILL.md` in each skill directory. Prefer reuse over new skills: follow `AGENTS.md` for policy and this library for procedure.

## Purpose

One versioned, validated source of skills that any Agent Skills-compatible consumer (Claude, OpenCode, Cursor, the `skills` CLI, and the Operator agent runtime) can load. Repository policy, routing, and commands live in the scoped `AGENTS.md` guides, not inside skills. Skills own workflows; `AGENTS.md` owns policy.

## Structure

Every skill is a directory under `skills/` with a `SKILL.md` file:

```text
skills/<skill-id>/
├── SKILL.md          # required; YAML frontmatter + prose procedure
├── references/       # optional, detailed supporting material
├── scripts/          # optional, validated shell/python helpers
└── examples/         # optional, sample inputs/outputs
```

- Skill ids are lowercase kebab-case (`code-review`, not `CodeReview`).
- `SKILL.md` frontmatter requires a `name` and a `description`. Descriptions say when to use the skill.
- Keep skills agent-neutral. Reference repository commands and files, not tool-specific call sites.
- Do not duplicate `AGENTS.md` inside skills. Skills hold one capability each.

## Adding or updating a skill

1. Check `skills/` for an existing skill that already covers the capability; extend it instead of adding a duplicate.
2. Create `skills/<skill-id>/SKILL.md` with frontmatter (`name`, `description`) and the procedure.
3. Add supporting files under `<skill-id>/references/`, `scripts/`, or `examples/` only when they carry real content.
4. Subject any Python helpers to repo validation (see below).
5. Review for security: no secrets/credentials, no network operations without explicit consent, no destructive commands without guardrails.
6. Document repo-agent-facing skills in `.agents/skills/` following the gitignore allowlist (see `.agents/skills` section).

New channels/plugins/app/doc surfaces get onboarding via `.github/labeler.yml` and the plugins stores; skill additions are routine and do not need labeler changes.

## Validation

- Python helpers are linted and tested with `skills/pyproject.toml` (`ruff` + `pytest`).
- Pre-commit and CI run these for any changed file under `skills/`:
  - `python -m ruff check --config skills/pyproject.toml skills`
  - `python -m pytest -q -c skills/pyproject.toml skills`
- Manual validation: run the two commands above before opening a PR that touches `skills/*`.

CI lane name: `skills-python`.

## Repository-owned vs project-agent skills

- `skills/` at the repo root — canonical, version-controlled library for agents working in this repository.
- `.agents/skills/` — repo-agent skills only; git-ignored except for an explicit allowlist of maintained entries. Do not add unrelated skills there.

## Agent compatibility

- `CLAUDE.md` is a sibling symlink to the canonical `AGENTS.md` per directory (`New AGENTS.md: add sibling CLAUDE.md symlink`).
- Skills under `skills/` are Agent Skills compatible (frontmatter `name` + `description` + `SKILL.md`).
- Other tools that emit project context point at the same single `AGENTS.md`; there is exactly one canonical instruction source, so edits in `AGENTS.md` are reviewed, not mirrored.

## External skill adoption (skills.sh / ClawHub)

Operator ships its own skill distribution hub (ClawHub) and respects the `skills` CLI ecosystem for external skill management. Before adopting an external skill:

1. Inspect the source `SKILL.md`, supporting files/scripts, dependencies, license, and file/network behavior.
2. Confirm it does not override repository rules or references repo-specific assumptions.
3. Record source/provenance in a project-adjacent install lock (`.gitignore` references `skills-lock.json`) and keep local state out of this tracked tree unless the skill is deliberately maintained here.

External skills are untrusted instruction input until reviewed; repository policy wins over external skill behavior.
