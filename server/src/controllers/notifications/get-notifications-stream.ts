import { Context } from "hono";
import { streamSSE } from "hono/streaming";
import type { Bindings, Variables } from "../../lib/common/types";

const HEARTBEAT_MS = 25_000;

export const getNotificationsStream = (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      event: "connected",
      data: JSON.stringify({ ok: true, at: new Date().toISOString() }),
    });

    while (true) {
      await stream.sleep(HEARTBEAT_MS);
      await stream.writeSSE({
        event: "heartbeat",
        data: JSON.stringify({ at: new Date().toISOString() }),
      });
    }
  });
};
