// Anthropic tests cover provider runtime.contract plugin behavior.
import { describeAnthropicProviderRuntimeContract } from "@gabrielvfonseca/operator/plugin-sdk/provider-test-contracts";

describeAnthropicProviderRuntimeContract(() => import("./index.js"));
