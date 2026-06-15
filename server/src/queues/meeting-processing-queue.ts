import type { MessageBatch } from "@cloudflare/workers-types";
import { useDB } from "../lib/db/db";
import { processMeetingForCompletion } from "../controllers/meetings/meeting-processing.service";
import type { Bindings, MeetingProcessingJob } from "../lib/common/types";

const MAX_ATTEMPTS = 3;

const getRuntimeLogContext = (env: Bindings) => ({
  database: env.D1_DATABASE_NAME ?? "unknown",
  environment: env.ENVIRONMENT ?? "unknown",
});

// Consumer for `meeting-processing-queue`. Runs the Google Doc + attendee
// email pipeline for meetings marked `completed` by POST
// /api/meetings/:id/end. Kept off the request path so a slow Google Docs or
// email API call never blocks the user-facing "end meeting" response.
export const handleMeetingProcessingQueue = async (
  batch: MessageBatch<MeetingProcessingJob>,
  env: Bindings,
) => {
  const db = useDB({ env });

  for (const message of batch.messages) {
    const { meetingId } = message.body;

    try {
      await processMeetingForCompletion({ db, env, meetingId });
      message.ack();
    } catch (error) {
      console.error("[meetingProcessingQueue] Queue job failed", {
        ...getRuntimeLogContext(env),
        meetingId,
        attempts: message.attempts,
        error: (error as Error).message,
      });

      if (message.attempts < MAX_ATTEMPTS) {
        message.retry();
      } else {
        message.ack();
      }
    }
  }
};
