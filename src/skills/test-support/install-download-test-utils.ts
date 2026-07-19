// Install download test utilities provide isolated state and workspace paths.
import {
  createOperatorTestState,
  type OperatorTestState,
} from "../../test-utils/operator-test-state.js";

/** Creates isolated Operator state for install download tests. */
export async function createInstallDownloadTestState(): Promise<OperatorTestState> {
  return await createOperatorTestState({
    layout: "state-only",
    prefix: "operator-skills-install-",
  });
}
