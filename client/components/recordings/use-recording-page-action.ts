"use client";

import { useEffect } from "react";
import {
  RECORDING_DROPZONE_UPLOAD_INPUT_ID,
  RECORDING_HUB_ID,
  RECORDING_UPLOAD_INPUT_ID,
} from "@/components/recordings/use-recording-uploader";

export type RecordingPageAction = "record" | "upload";

type UseRecordingPageActionOptions = {
  action: RecordingPageAction | null;
  ready?: boolean;
  onHandled: () => void;
};

export function useRecordingPageAction({
  action,
  ready = true,
  onHandled,
}: UseRecordingPageActionOptions) {
  useEffect(() => {
    if (!action || !ready) return;

    if (action === "record") {
      document.getElementById(RECORDING_HUB_ID)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      onHandled();
      return;
    }

    const uploadInput =
      document.getElementById(RECORDING_UPLOAD_INPUT_ID) ??
      document.getElementById(RECORDING_DROPZONE_UPLOAD_INPUT_ID);

    uploadInput?.click();
    onHandled();
  }, [action, ready, onHandled]);
}
