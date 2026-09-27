export type TranscriptSegment = {
  id: number;
  time: string;
  start: number;
  speaker: string;
  text: string;
  confidence: number;
  tone: string;
};

export type TranscriptExport = "txt" | "srt" | "json";

export function formatTranscript(
  extension: TranscriptExport,
  project: string,
  segments: TranscriptSegment[],
) {
  if (extension === "json") {
    return JSON.stringify({ project, language: "zh-CN", segments }, null, 2);
  }

  if (extension === "srt") {
    return segments
      .map(
        (segment, index) =>
          `${index + 1}\n00:00:${String(segment.start).padStart(2, "0")},000 --> 00:00:${String(segment.start + 8).padStart(2, "0")},000\n${segment.text}\n`,
      )
      .join("\n");
  }

  return segments
    .map((segment) => `[${segment.time}] ${segment.speaker}\n${segment.text}`)
    .join("\n\n");
}
