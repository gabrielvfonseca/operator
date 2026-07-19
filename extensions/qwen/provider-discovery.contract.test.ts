// Qwen tests cover provider discovery.contract plugin behavior.
import { describeModelStudioProviderDiscoveryContract } from "@gabrielvfonseca/operator/plugin-sdk/provider-test-contracts";

describeModelStudioProviderDiscoveryContract(() => import("./index.js"));
