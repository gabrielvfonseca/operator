import { definePage } from "@operator/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "tasks",
  path: "/tasks",
  component: () =>
    import("./tasks-page.ts").then(() => ({
      header: true,
      render: () => html`<operator-tasks-page></operator-tasks-page>`,
    })),
});
