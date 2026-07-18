// STT live audio tests validate live speech-to-text audio fixtures.
import {
  expectOperatorLiveTranscriptMarker,
  normalizeTranscriptForMatch,
  OPERATOR_LIVE_TRANSCRIPT_MARKER_RE,
} from "@gabrielvfonseca/operator/plugin-sdk/provider-test-contracts";
import { describe, expect, it } from "vitest";

describe("normalizeTranscriptForMatch", () => {
  it("normalizes punctuation and common Operator live transcription variants", () => {
    expect(normalizeTranscriptForMatch("Open-Claw integration OK")).toBe("openclawintegrationok");
    expect(normalizeTranscriptForMatch("Testing OpenFlaw realtime transcription")).toMatch(
      /open(?:claw|flaw)/,
    );
    expect(normalizeTranscriptForMatch("OpenCore xAI realtime transcription")).toMatch(
      OPERATOR_LIVE_TRANSCRIPT_MARKER_RE,
    );
    expect(normalizeTranscriptForMatch("OpenCL xAI realtime transcription")).toMatch(
      OPERATOR_LIVE_TRANSCRIPT_MARKER_RE,
    );
    expectOperatorLiveTranscriptMarker("OpenClar integration OK");
  });
});
