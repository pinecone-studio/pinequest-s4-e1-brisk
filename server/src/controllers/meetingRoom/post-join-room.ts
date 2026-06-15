import { Context } from "hono";
import { AccessToken } from "livekit-server-sdk";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import {
  buildParticipantMetadata,
  getAuthenticatedUserEmail,
} from "../../lib/auth/meeting-participant-metadata";
import type { Bindings, Variables } from "../../lib/common/types";
import { toPublicApiError } from "../../lib/errors/public-error";

const getLiveKitFrontendUrl = (env: Bindings) => {
  return env.LIVEKIT_WS_URL ?? env.LIVEKIT_URL;
};

export const postJoinRoom = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  try {
    const { roomName, participantName } = await c.req.json();

    if (!roomName) return c.json({ error: "roomName is required" }, 400);
    if (!participantName)
      return c.json({ error: "participantName is required" }, 400);

    const userId = await getAuthenticatedUserId(c);
    const email = await getAuthenticatedUserEmail(c, userId);
    const metadata = userId ? buildParticipantMetadata(userId, email) : undefined;

    const token = new AccessToken(
      c.env.LIVEKIT_API_KEY,
      c.env.LIVEKIT_API_SECRET,
      { identity: participantName, metadata },
    );

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();

    return c.json(
      {
        roomName,
        token: jwt,
        url: getLiveKitFrontendUrl(c.env),
      },
      200,
    );
  } catch (error) {
    return c.json({ error: toPublicApiError(500) }, 500);
  }
};
