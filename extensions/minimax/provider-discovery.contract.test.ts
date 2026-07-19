// Minimax tests cover provider discovery.contract plugin behavior.
import { describeMinimaxProviderDiscoveryContract } from "@gabrielvfonseca/operator/plugin-sdk/provider-test-contracts";

describeMinimaxProviderDiscoveryContract(() => import("./index.js"));
