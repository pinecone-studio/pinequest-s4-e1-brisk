import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import { meetingApi } from "./meeting-api";

export type UpdateMeetingInput = {
  title?: string;
  assignedTeammateId?: string;
};

export type UpdateMeetingResponse = {
  id: string;
  title: string;
  assignedTeammateId: string | null;
};

export const updateMeeting = async (
  meetingId: string,
  input: UpdateMeetingInput,
) =>
  meetingApi<UpdateMeetingResponse>(MEETING_ENDPOINTS.updateMeeting(meetingId), {
    body: input,
    method: "PATCH",
  });
