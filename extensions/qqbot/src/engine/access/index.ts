// Qqbot plugin entrypoint registers its Operator integration.
export { createQQBotSenderMatcher, normalizeQQBotAllowFrom } from "./sender-match.js";
export type { QQBotDmPolicy, QQBotGroupPolicy } from "./types.js";
