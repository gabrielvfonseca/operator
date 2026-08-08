import { definePage } from "@operator/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "debug",
  path: "/debug",
  component: () =>
    import("./debug-page.ts").then(() => ({
      header: true,
      render: () => html`<operator-debug-page></operator-debug-page>`,
    })),
});
