/** ACP runtime error exports wired to OpenClaw secret redaction. */
import { configureAcpErrorRedactor } from "@operator/acp-core";
import { redactSensitiveText } from "../../logging/redact.js";

// Ensure ACP-core runtime errors use OpenClaw's secret redaction before re-export.
configureAcpErrorRedactor(redactSensitiveText);

export * from "@operator/acp-core/runtime/errors";
