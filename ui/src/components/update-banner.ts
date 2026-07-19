// Control UI component renders update status and available-update actions.
import { html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { OperatorLightDomContentsElement } from "../lit/operator-element.ts";

type UpdateBannerProps = {
  statusBanner: { tone: "danger" | "warn" | "info"; text: string } | null;
};

class UpdateBanner extends OperatorLightDomContentsElement {
  @property({ attribute: false }) props?: UpdateBannerProps;

  override render() {
    const props = this.props;
    if (!props) {
      return nothing;
    }
    return html`
      ${props.statusBanner
        ? html`<div class="callout ${props.statusBanner.tone}" role="alert">
            ${props.statusBanner.text}
          </div>`
        : nothing}
    `;
  }
}

if (!customElements.get("operator-update-banner")) {
  customElements.define("operator-update-banner", UpdateBanner);
}
