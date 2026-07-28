// Session binding registry contract tests cover channel session binding across registry fixtures.
import { getSessionBindingContractRegistry } from "../../../../src/channels/plugins/contracts/test-helpers/registry-session-binding.js";
import { describeSessionBindingRegistryBackedContract } from "../../../../src/channels/plugins/contracts/test-helpers/session-binding-registry-backed-contract.js";

for (const entry of getSessionBindingContractRegistry()) {
  describeSessionBindingRegistryBackedContract(entry.id);
}
