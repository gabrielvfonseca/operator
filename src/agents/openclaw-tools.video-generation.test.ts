// Verifies video-generation tool registration through the shared generation harness.
import { describeOperatorGenerationToolRegistration } from "./openclaw-tools.generation.test-support.js";

describeOperatorGenerationToolRegistration({
  suiteName: "openclaw tools video generation registration",
  toolName: "video_generate",
  toolLabel: "a video-generation tool",
});
