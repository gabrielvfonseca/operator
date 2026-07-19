import { definePage } from "@operator/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "worktrees",
  path: "/settings/worktrees",
  aliases: ["/worktrees"],
  component: () =>
    import("./worktrees-page.ts").then(() => ({
      header: true,
      render: () => html`<operator-worktrees-page></operator-worktrees-page>`,
    })),
});
