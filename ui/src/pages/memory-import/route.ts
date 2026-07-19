import { definePage } from "@operator/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "memory-import",
  path: "/settings/memory-import",
  aliases: ["/memory-import"],
  component: () =>
    import("./memory-import-page.ts").then(() => ({
      header: true,
      render: () => html`<operator-memory-import-page></operator-memory-import-page>`,
    })),
});
