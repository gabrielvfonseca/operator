// Openai tests cover provider runtime.contract plugin behavior.
import { describeOpenAIProviderRuntimeContract } from "@gabrielvfonseca/operator/plugin-sdk/provider-test-contracts";

describeOpenAIProviderRuntimeContract(() => import("./index.js"));
