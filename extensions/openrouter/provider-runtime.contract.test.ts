// Openrouter tests cover provider runtime.contract plugin behavior.
import { describeOpenRouterProviderRuntimeContract } from "@gabrielvfonseca/operator/plugin-sdk/provider-test-contracts";

describeOpenRouterProviderRuntimeContract(() => import("./index.js"));
