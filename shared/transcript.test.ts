import { describe, expect, it } from "vitest";
import { formatTranscript, type TranscriptSegment } from "./transcript";

const segments: TranscriptSegment[] = [
  { id: 1, time: "00:00:04", start: 4, speaker: "SPEAKER 01", text: "大家好。", confidence: 98, tone: "bg-cyan-400" },
  { id: 2, time: "00:00:16", start: 16, speaker: "SPEAKER 02", text: "很高兴来到这里。", confidence: 96, tone: "bg-amber-300" },
];

describe("formatTranscript", () => {
  it("formats a readable TXT transcript with timestamps and speakers", () => {
    expect(formatTranscript("txt", "demo", segments)).toContain("[00:00:04] SPEAKER 01\n大家好。");
    expect(formatTranscript("txt", "demo", segments)).toContain("[00:00:16] SPEAKER 02");
  });

  it("formats valid SRT sequence blocks", () => {
    const srt = formatTranscript("srt", "demo", segments);
    expect(srt).toContain("1\n00:00:04,000 --> 00:00:12,000\n大家好。");
    expect(srt).toContain("2\n00:00:16,000 --> 00:00:24,000\n很高兴来到这里。");
  });

  it("keeps project metadata and segments in JSON exports", () => {
    const parsed = JSON.parse(formatTranscript("json", "demo", segments));
    expect(parsed).toMatchObject({ project: "demo", language: "zh-CN" });
    expect(parsed.segments).toHaveLength(2);
  });
});
