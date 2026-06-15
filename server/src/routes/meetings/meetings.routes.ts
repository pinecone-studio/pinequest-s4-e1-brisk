import { Hono } from "hono";
import { getMeetingDetails } from "../../controllers/meetings/get-meeting-details";
import { getMeetings } from "../../controllers/meetings/get-meetings";
import { postStreamTranscript } from "../../controllers/meetings/post-stream-transcript";
import { postMeetingAttendee } from "../../controllers/meetings/post-meeting-attendee";
import { postEndMeeting } from "../../controllers/meetings/post-end-meeting";

const meetingsRouter = new Hono();

meetingsRouter.get("/", getMeetings);
meetingsRouter.get("/:id/details", getMeetingDetails);
meetingsRouter.post("/:id/stream-transcript", postStreamTranscript);
meetingsRouter.post("/:id/attendees", postMeetingAttendee);
meetingsRouter.post("/:id/end", postEndMeeting);

export default meetingsRouter;
