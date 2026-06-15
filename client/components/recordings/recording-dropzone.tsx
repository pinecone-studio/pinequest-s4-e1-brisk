"use client";

import { Button } from "@/components/ui/button";
import { NoiseCancellationControl } from "@/components/recordings/noise-cancellation-control";
import {
  formatElapsed,
  RECORDING_DROPZONE_UPLOAD_INPUT_ID,
  RECORDING_HUB_ID,
  useRecordingUploader,
} from "@/components/recordings/use-recording-uploader";
import { displayUserError } from "@/lib/errors/format-user-error";
import { cn } from "@/lib/utils";
import { Loader2, Mic, Square, Upload, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";

type RecordingDropzoneProps = {
  onUploaded: (recordingId: string) => void;
};

export function RecordingDropzone({ onUploaded }: RecordingDropzoneProps) {
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

  const [isDragging, setIsDragging] = useState(false);
  const [recordSetupOpen, setRecordSetupOpen] = useState(false);

  useEffect(() => {
    if (!isRecording && !busy) {
      setRecordSetupOpen(false);
    }
  }, [isRecording, busy]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void uploadFile(file, file.name);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (busy || isRecording) return;
    const file = event.dataTransfer.files?.[0];
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
      className="flex flex-col items-center justify-start scroll-mt-24 pt-6 lg:pt-10"
    >
      <h2 className="max-w-md text-center font-heading text-xl font-semibold text-foreground">
        Upload an audio file to generate a transcription
      </h2>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy && !isRecording) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "mt-5 flex min-h-72 w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-card/40",
        )}
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          {busy ? (
            <Loader2 className="size-7 animate-spin" />
          ) : isRecording ? (
            <span className="size-4 animate-pulse rounded-full bg-destructive" />
          ) : (
            <UploadCloud className="size-7" />
          )}
        </span>

        <p className="text-sm text-muted-foreground">
          {isRecording
            ? `Recording… ${formatElapsed(elapsed)}`
            : busy
              ? "Uploading your file…"
              : recordSetupOpen
                ? "Adjust noise cancellation, then start recording."
                : "Drag and drop MP3 or WAV files here or select a file to upload"}
        </p>

        {recordSetupOpen && !isRecording ? (
          <NoiseCancellationControl
            id="dropzone-noise-cleanup"
            checked={noiseCleanup}
            onCheckedChange={setNoiseCleanup}
            disabled={busy}
            className="max-w-md text-left"
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {isRecording ? (
            <Button variant="destructive" onClick={stopRecording} disabled={busy}>
              <Square className="size-4" />
              Stop &amp; process
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                render={<label htmlFor="recording-dropzone-upload" />}
                disabled={busy || recordSetupOpen}
              >
                <Upload className="size-4" />
                Upload
              </Button>
              <input
                id={RECORDING_DROPZONE_UPLOAD_INPUT_ID}
                type="file"
                accept="audio/*,.m4a,.webm"
                className="hidden"
                onChange={handleFileChange}
                disabled={busy}
              />
              {recordSetupOpen ? (
                <>
                  <Button onClick={() => void startRecording()} disabled={busy}>
                    <Mic className="size-4" />
                    Start recording
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setRecordSetupOpen(false)}
                    disabled={busy}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={handleRecordClick} disabled={busy}>
                  <Mic className="size-4" />
                  Record
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-4 w-full max-w-2xl rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
          {displayUserError(error)}
        </p>
      ) : null}
    </div>
  );
}
