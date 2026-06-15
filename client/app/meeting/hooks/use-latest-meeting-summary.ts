"use client";

import { useEffect, useState } from "react";
import { formatUserError } from "@/lib/errors/format-user-error";
import {
  getLatestMeetingTranscript,
  type GetMeetingTranscriptResponse,
} from "../index";

export const useLatestMeetingSummary = () => {
  const [transcript, setTranscript] =
    useState<GetMeetingTranscriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadLatestSummary = async () => {
      setError("");
      setIsLoading(true);

      try {
        const latestTranscript = await getLatestMeetingTranscript();

        if (isActive) {
          setTranscript(latestTranscript);
        }
      } catch (caughtError) {
        if (isActive) {
          setTranscript(null);
          setError(formatUserError(caughtError));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadLatestSummary();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    error,
    isLoading,
    transcript,
  };
};
