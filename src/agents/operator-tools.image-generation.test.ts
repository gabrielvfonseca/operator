// Verifies image-generation tool registration through the shared generation harness.
import { describeOperatorGenerationToolRegistration } from "./operator-tools.generation.test-support.js";

describeOperatorGenerationToolRegistration({
  suiteName: "operator tools image generation registration",
  toolName: "image_generate",
  toolLabel: "an image-generation tool",
});
