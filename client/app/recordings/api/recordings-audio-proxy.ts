import { getBackendBaseUrls } from "@/app/meeting/api/meeting-proxy";
import {
  formatHttpError,
  formatUserError,
  USER_ERRORS,
} from "@/lib/errors/format-user-error";

const getTargetUrl = (baseUrl: string, path: string) =>
  new URL(path, `${baseUrl}/`).toString();

// Streams a recording's audio back from the Worker without JSON-encoding it.
// The Clerk Authorization header is forwarded so the backend can authorize the
// owner, and the binary body + content-type are passed through verbatim so the
// browser can play it in an <audio> element.
export const proxyRecordingAudio = async (request: Request, path: string) => {
  const targetUrls = getBackendBaseUrls().map((baseUrl) =>
    getTargetUrl(baseUrl, path),
  );

  if (!targetUrls.length) {
    return Response.json(
      { error: USER_ERRORS.server },
      { status: 500 },
    );
  }

  const headers: Record<string, string> = {};
  const authorization = request.headers.get("Authorization");
  if (authorization) headers["Authorization"] = authorization;

  let lastError: unknown = null;

  for (const targetUrl of targetUrls) {
    try {
      const response = await fetch(targetUrl, { method: "GET", headers });

      if (!response.ok) {
        const text = await response.text();
        return Response.json(
          { error: formatHttpError(response.status, text || undefined) },
          { status: response.status },
        );
      }

      const responseHeaders = new Headers();
      const contentType = response.headers.get("Content-Type");
      const contentLength = response.headers.get("Content-Length");
      if (contentType) responseHeaders.set("Content-Type", contentType);
      if (contentLength) responseHeaders.set("Content-Length", contentLength);

      return new Response(response.body, {
        status: 200,
        headers: responseHeaders,
      });
    } catch (error) {
      lastError = error;
      console.error("[recordings] Audio proxy failed", { error, targetUrl });
    }
  }

  return Response.json(
    {
      error: lastError ? formatUserError(lastError) : USER_ERRORS.server,
    },
    { status: 500 },
  );
};
