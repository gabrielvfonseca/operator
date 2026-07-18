/** ACP protocol helpers and OpenClaw agent identity metadata. */
export { normalizeAcpProvenanceMode } from "@operator/acp-core/types";
import { VERSION } from "../version.js";

/** ACP agent identity advertised during protocol initialization. */
export const ACP_AGENT_INFO = {
  name: "operator-acp",
  title: "OpenClaw ACP Gateway",
  version: VERSION,
};
