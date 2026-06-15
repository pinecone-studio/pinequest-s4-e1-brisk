import type { StandaloneRecording } from "@/app/recordings/types";
import { TRANSCRIPTION_STATUS_STYLES } from "@/lib/meetings/transcription-status";
import { matchesSearchQuery } from "@/lib/search/matches-search-query";

export const filterRecordingsBySearch = (
  recordings: StandaloneRecording[],
  query: string,
) => {
  if (!query.trim()) return recordings;

  return recordings.filter((recording) => {
    const status = TRANSCRIPTION_STATUS_STYLES[recording.status];

    return matchesSearchQuery(
      query,
      recording.title,
      recording.transcript,
      status.label,
      ...(recording.keyPoints ?? []),
      ...(recording.scriptSegments?.flatMap((segment) => [
        segment.speakerLabel,
        segment.text,
      ]) ?? []),
    );
  });
};
