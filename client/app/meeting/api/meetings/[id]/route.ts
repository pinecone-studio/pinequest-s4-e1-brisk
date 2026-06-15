import { BACKEND_MEETING_ENDPOINTS } from "../../meeting-endpoints";
import { proxyMeetingPatchRequest } from "../../meeting-proxy";

type MeetingUpdateRouteContext = {
  params: Promise<{ id: string }>;
};

export const PATCH = async (
  request: Request,
  { params }: MeetingUpdateRouteContext,
) => {
  const { id } = await params;

  return proxyMeetingPatchRequest(
    request,
    BACKEND_MEETING_ENDPOINTS.updateMeeting(id),
  );
};
