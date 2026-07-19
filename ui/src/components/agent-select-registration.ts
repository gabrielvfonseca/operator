import { AgentSelect } from "./agent-select.ts";

if (!customElements.get("operator-agent-select")) {
  customElements.define("operator-agent-select", AgentSelect);
}
