// Venice tests cover provider runtime.contract plugin behavior.
import { describeVeniceProviderRuntimeContract } from "@gabrielvfonseca/operator/plugin-sdk/provider-test-contracts";

describeVeniceProviderRuntimeContract(() => import("./index.js"));
