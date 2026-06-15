import { Hono } from "hono";
import { getNotificationsStream } from "../../controllers/notifications/get-notifications-stream";
import type { Bindings, Variables } from "../../lib/common/types";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const notificationsRouter = new Hono<HonoEnv>();

notificationsRouter.get("/stream", getNotificationsStream);

export default notificationsRouter;
