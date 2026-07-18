# Plan: Make OpenRouter the Default AI Provider

## Goal

Change Operator's system-wide default AI provider from OpenAI to OpenRouter.

## Decisions

1. `src/agents/defaults.ts`: set `DEFAULT_PROVIDER = "openrouter"` and `DEFAULT_MODEL = "openrouter/auto"`.
2. `src/plugins/provider-auth-choice-order.ts`: put OpenRouter first in the featured provider order.
3. `src/commands/onboard-inference.ts`: add `OPENROUTER_API_KEY` detection with `OPENROUTER_API_DEFAULT_MODEL_REF = "openrouter/auto"` and insert it into the inference ladder.
4. Update all tests/docs that hardcode the old OpenAI defaults.

## Important Edge Case

OpenRouter is OpenAI-compatible at the transport layer, but model IDs are provider-scoped. Changing `DEFAULT_PROVIDER` mainly affects bare-model fallback and onboarding defaults. Existing explicit `openai/...` refs remain valid; only implicit fallback behavior changes.

## Tasks

1. Update `src/agents/defaults.ts`.
2. Update `src/plugins/provider-auth-choice-order.ts`.
3. Update `src/commands/onboard-inference.ts`.
4. Update tests asserting old defaults.
5. Update docs stating OpenAI is the default.
6. Run focused build/tests.

## Validation

- `pnpm build`
- Focused vitest for changed paths
