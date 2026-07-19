// Github Copilot tests cover provider auth.contract plugin behavior.
import { describeGithubCopilotProviderAuthContract } from "@gabrielvfonseca/operator/plugin-sdk/provider-test-contracts";

describeGithubCopilotProviderAuthContract(() => import("./index.js"));
