import { Hono } from "hono";
import { postGenerateNoteTitle } from "../../controllers/summary/post-generate-note-title";
import { postSendActionEmail } from "../../controllers/summary/post-send-action-email";
import type { Bindings, Variables } from "../../lib/common/types";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const summaryRouter = new Hono<HonoEnv>();

summaryRouter.post("/send-action-email", postSendActionEmail);
summaryRouter.post("/generate-note-title", postGenerateNoteTitle);

export default summaryRouter;
