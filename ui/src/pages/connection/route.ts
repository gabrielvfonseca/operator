import { definePage } from "@operator/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "connection",
  path: "/settings/connection",
  component: () =>
    import("./connection-page.ts").then(() => ({
      header: true,
      render: () => html`<operator-connection-page></operator-connection-page>`,
    })),
});
