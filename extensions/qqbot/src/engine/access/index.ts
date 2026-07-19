// Qqbot plugin entrypoint registers its Operator integration.
export { createQQBotSenderMatcher, normalizeQQBotAllowFrom } from "./sender-match.js";
export { type QQBotDmPolicy, type QQBotGroupPolicy } from "./types.js";
