// Verifies video-generation tool registration through the shared generation harness.
import { describeOperatorGenerationToolRegistration } from "./operator-tools.generation.test-support.js";

describeOperatorGenerationToolRegistration({
  suiteName: "operator tools video generation registration",
  toolName: "video_generate",
  toolLabel: "a video-generation tool",
});
