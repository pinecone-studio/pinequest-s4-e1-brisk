import { BACKEND_MEETING_ENDPOINTS } from "../../../meeting-endpoints";
import { proxyMeetingPostRequest } from "../../../meeting-proxy";

type MeetingStartRouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = async (
  request: Request,
  { params }: MeetingStartRouteContext,
) => {
  const { id } = await params;

  return proxyMeetingPostRequest(
    request,
    BACKEND_MEETING_ENDPOINTS.startMeeting(id),
  );
};
