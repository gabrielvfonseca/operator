/** ACP protocol helpers and Operator agent identity metadata. */
export { normalizeAcpProvenanceMode } from "@gabrielvfonseca/acp-core/types";
import { VERSION } from "../version.js";

/** ACP agent identity advertised during protocol initialization. */
export const ACP_AGENT_INFO = {
  name: "operator-acp",
  title: "Operator ACP Gateway",
  version: VERSION,
};
