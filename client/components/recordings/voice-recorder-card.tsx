"use client";

import { Button } from "@/components/ui/button";
import { NoiseCancellationControl } from "@/components/recordings/noise-cancellation-control";
import {
  formatElapsed,
  RECORDING_HUB_ID,
  RECORDING_UPLOAD_INPUT_ID,
  useRecordingUploader,
} from "@/components/recordings/use-recording-uploader";
import { displayUserError } from "@/lib/errors/format-user-error";
import { cn } from "@/lib/utils";
import { Loader2, Mic, Square, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type VoiceRecorderCardProps = {
  onUploaded: (recordingId: string) => void;
  openRecordSetup?: boolean;
};

export function VoiceRecorderCard({ onUploaded, openRecordSetup = false }: VoiceRecorderCardProps) {
  const {
    isRecording,
    elapsed,
    error,
    noiseCleanup,
    setNoiseCleanup,
    busy,
    startRecording,
    stopRecording,
    uploadFile,
  } = useRecordingUploader(onUploaded);

  const [recordSetupOpen, setRecordSetupOpen] = useState(false);
  const wasRecordingOrBusyRef = useRef(false);

  useEffect(() => {
    if (openRecordSetup && !isRecording && !busy) {
      setRecordSetupOpen(true);
    }
  }, [openRecordSetup, isRecording, busy]);

  useEffect(() => {
    if (isRecording || busy) {
      wasRecordingOrBusyRef.current = true;
      return;
    }

    if (wasRecordingOrBusyRef.current) {
      wasRecordingOrBusyRef.current = false;
      setRecordSetupOpen(false);
    }
  }, [isRecording, busy]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void uploadFile(file, file.name);
  };

  const handleRecordClick = () => {
    if (isRecording || busy) return;

    if (!recordSetupOpen) {
      setRecordSetupOpen(true);
      return;
    }

    void startRecording();
  };

  return (
    <div
      id={RECORDING_HUB_ID}
      className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex flex-col gap-4">
        {recordSetupOpen && !isRecording ? (
          <NoiseCancellationControl
            id="voice-recorder-noise-cleanup"
            checked={noiseCleanup}
            onCheckedChange={setNoiseCleanup}
            disabled={busy}
          />
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-2xl",
                isRecording
                  ? "bg-destructive/15 text-destructive"
                  : "bg-primary/10 text-primary",
              )}
            >
              {isRecording ? (
                <span className="size-3 animate-pulse rounded-full bg-destructive" />
              ) : (
                <Mic className="size-5" />
              )}
            </span>
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                New voice recording
              </h2>
              <p className="text-sm text-muted-foreground">
                {isRecording
                  ? `Recording… ${formatElapsed(elapsed)}`
                  : busy
                    ? "Uploading…"
                    : recordSetupOpen
                      ? "Adjust noise cancellation, then start recording."
                      : "Record from your mic or upload an audio file."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isRecording ? (
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                disabled={busy}
              >
                <Square className="size-4" />
                Stop & process
              </Button>
            ) : recordSetupOpen ? (
              <>
                <Button size="lg" onClick={() => void startRecording()} disabled={busy}>
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Mic className="size-4" />
                  )}
                  Start recording
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => setRecordSetupOpen(false)}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="lg" onClick={handleRecordClick} disabled={busy}>
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mic className="size-4" />
                )}
                Record
              </Button>
            )}

            <Button
              size="lg"
              variant="outline"
              render={<label htmlFor="recording-upload" />}
              disabled={busy || isRecording || recordSetupOpen}
            >
              <Upload className="size-4" />
              Upload
            </Button>
            <input
              id={RECORDING_UPLOAD_INPUT_ID}
              type="file"
              accept="audio/*,video/*,.m4a,.webm"
              className="hidden"
              onChange={handleFileChange}
              disabled={busy || isRecording}
            />
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {displayUserError(error)}
        </p>
      ) : null}
    </div>
  );
}
