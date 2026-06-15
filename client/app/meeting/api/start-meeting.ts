import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import type { StartMeetingResponse } from "../types/meeting-response.types";
import { meetingApi } from "./meeting-api";

export const startMeeting = async (
  meetingId: string,
  options?: { title?: string },
) =>
  meetingApi<StartMeetingResponse>(MEETING_ENDPOINTS.startMeeting(meetingId), {
    body: options?.title ? { title: options.title } : {},
    method: "POST",
  });
