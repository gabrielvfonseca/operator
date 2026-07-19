// Verifies image-generation tool registration through the shared generation harness.
import { describeOperatorGenerationToolRegistration } from "./openclaw-tools.generation.test-support.js";

describeOperatorGenerationToolRegistration({
  suiteName: "openclaw tools image generation registration",
  toolName: "image_generate",
  toolLabel: "an image-generation tool",
});
