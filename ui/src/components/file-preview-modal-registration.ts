import { OperatorFilePreviewModal } from "./file-preview-modal.ts";

if (!customElements.get("operator-file-preview-modal")) {
  customElements.define("operator-file-preview-modal", OperatorFilePreviewModal);
}
