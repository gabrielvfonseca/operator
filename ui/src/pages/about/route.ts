import { definePage } from "@operator/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "about",
  path: "/settings/about",
  component: () =>
    import("./about-page.ts").then(() => ({
      header: true,
      render: () => html`<operator-about-page></operator-about-page>`,
    })),
});
