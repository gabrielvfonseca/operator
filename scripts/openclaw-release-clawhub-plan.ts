#!/usr/bin/env -S node --import tsx
// Operator release ClawHub plan CLI emits release workflow routing as JSON.

import { pathToFileURL } from "node:url";
import {
  buildOperatorReleaseClawHubPlan,
  parseOperatorReleaseClawHubPlanArgs,
} from "./lib/operator-release-clawhub-plan.ts";

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = parseOperatorReleaseClawHubPlanArgs(process.argv.slice(2));
  const plan = await buildOperatorReleaseClawHubPlan(args);
  console.log(JSON.stringify(plan, null, 2));
}
