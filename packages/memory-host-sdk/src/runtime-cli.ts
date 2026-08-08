// Focused runtime contract for memory CLI/UI helpers.

export { formatErrorMessage, withManager } from "./host/operator-runtime-cli.js";
export { formatHelpExamples } from "./host/operator-runtime-cli.js";
export { resolveCommandSecretRefsViaGateway } from "./host/operator-runtime-cli.js";
export { withProgress, withProgressTotals } from "./host/operator-runtime-cli.js";
export { defaultRuntime } from "./host/operator-runtime-cli.js";
export { formatDocsLink } from "./host/operator-runtime-cli.js";
export { colorize, isRich, theme } from "./host/operator-runtime-cli.js";
export { isVerbose, setVerbose } from "./host/operator-runtime-cli.js";
export { shortenHomeInString, shortenHomePath } from "./host/operator-runtime-cli.js";
