import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import type { EndMeetingResponse } from "../types/meeting-response.types";
import { meetingApi } from "./meeting-api";

export const endMeeting = async (meetingId: string) =>
  meetingApi<EndMeetingResponse>(MEETING_ENDPOINTS.endMeeting(meetingId), {
    body: {},
    method: "POST",
  });
