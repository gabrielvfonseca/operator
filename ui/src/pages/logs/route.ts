import { definePage } from "@operator/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "logs",
  path: "/logs",
  component: () =>
    import("./logs-page.ts").then(() => ({
      header: true,
      render: () => html`<operator-logs-page></operator-logs-page>`,
    })),
});
