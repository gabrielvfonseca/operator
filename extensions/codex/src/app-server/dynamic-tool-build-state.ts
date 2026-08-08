type OperatorCodingToolsFactory =
  typeof import("operator/plugin-sdk/agent-harness")["createOperatorCodingTools"];

/** Mutable dependency seam shared by dynamic-tool construction and its behavioral tests. */
export const dynamicToolBuildState: {
  openClawCodingToolsFactory?: OperatorCodingToolsFactory;
} = {};
