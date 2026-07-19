import { ApprovalPage } from "./approval-page.ts";

if (!customElements.get("operator-approval-page")) {
  customElements.define("operator-approval-page", ApprovalPage);
}
