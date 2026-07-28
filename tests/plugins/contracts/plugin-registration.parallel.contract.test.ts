import { pluginRegistrationContractCases } from "@gabrielvfonseca/operator/plugin-sdk/plugin-test-contracts";
import { describePluginRegistrationContract } from "@gabrielvfonseca/operator/plugin-sdk/plugin-test-contracts";

describePluginRegistrationContract(pluginRegistrationContractCases.parallel);
