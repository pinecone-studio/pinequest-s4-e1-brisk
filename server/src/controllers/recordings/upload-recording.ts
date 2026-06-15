import { Context } from "hono";
import { nanoid } from "nanoid";
import { useDB } from "../../lib/db/db";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import {
  buildRecordingKey,
  createStandaloneRecording,
} from "./recordings.service";
import type { Bindings, Variables } from "../../lib/common/types";
import { PUBLIC_ERRORS, toPublicApiError } from "../../lib/errors/public-error";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

const isAcceptedAudio = (file: File) => {
  if (file.type.startsWith("audio/")) return true;

  // MediaRecorder webm/ogg containers and some browsers report video/* for
  // audio-only blobs — accept the common ones rather than rejecting valid mics.
  return ["video/webm", "video/ogg", "application/octet-stream"].includes(
    file.type,
  );
};

const buildDefaultTitle = () =>
  `Recording - ${new Date().toLocaleDateString("en-CA")}`;

export const uploadRecording = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  const userId = await getAuthenticatedUserId(c);

  if (!userId) {
    return c.json({ error: PUBLIC_ERRORS.auth }, 401);
  }

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json({ error: PUBLIC_ERRORS.client }, 400);
  }

  const file = form.get("file");

  if (!(file instanceof File)) {
    return c.json({ error: PUBLIC_ERRORS.client }, 400);
  }

  if (file.size === 0) {
    return c.json({ error: PUBLIC_ERRORS.client }, 400);
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return c.json({ error: "File is too large. Maximum size is 20MB." }, 413);
  }

  if (!isAcceptedAudio(file)) {
    return c.json({ error: PUBLIC_ERRORS.client }, 415);
  }

  const recordingId = `rec_${nanoid(12)}`;
  const key = buildRecordingKey(userId, recordingId);
  const contentType = file.type || "audio/mpeg";

  const titleField = form.get("title");
  const title =
    typeof titleField === "string" && titleField.trim()
      ? titleField.trim()
      : buildDefaultTitle();

  const durationField = form.get("durationSeconds");
  const durationSeconds =
    typeof durationField === "string" && durationField.trim()
      ? Number.parseInt(durationField, 10)
      : undefined;

  try {
    await c.env.R2_BUCKET.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType },
    });

    const db = useDB(c);
    await createStandaloneRecording({
      db,
      id: recordingId,
      userId,
      title,
      audioUrl: key,
      fileSizeBytes: file.size,
      durationSeconds:
        durationSeconds != null && Number.isFinite(durationSeconds) && durationSeconds > 0
          ? durationSeconds
          : undefined,
    });

    await c.env.TRANSCRIPTION_QUEUE.send({
      type: "standalone",
      recordingId,
      userId,
    });

    return c.json({ status: "processing", recordingId }, 202);
  } catch (error) {
    console.error("[recordings] Upload failed", {
      error: (error as Error).message,
      recordingId,
    });

    return c.json({ error: toPublicApiError(500) }, 500);
  }
};
