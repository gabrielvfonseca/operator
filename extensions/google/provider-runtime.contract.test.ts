// Google tests cover provider runtime.contract plugin behavior.
import { describeGoogleProviderRuntimeContract } from "@gabrielvfonseca/operator/plugin-sdk/provider-test-contracts";

describeGoogleProviderRuntimeContract(() => import("./index.js"));
