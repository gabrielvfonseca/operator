/** ACP runtime error exports wired to Operator secret redaction. */
import { configureAcpErrorRedactor } from "@gabrielvfonseca/acp-core";
import { redactSensitiveText } from "../../logging/redact.js";

// Ensure ACP-core runtime errors use Operator's secret redaction before re-export.
configureAcpErrorRedactor(redactSensitiveText);

export * from "@gabrielvfonseca/acp-core/runtime/errors";
