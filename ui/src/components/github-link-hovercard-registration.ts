import { GitHubLinkHovercardProvider } from "./github-link-hovercard.ts";

if (!customElements.get("operator-github-link-hovercard-provider")) {
  customElements.define("operator-github-link-hovercard-provider", GitHubLinkHovercardProvider);
}
