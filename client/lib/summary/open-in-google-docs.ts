const GOOGLE_DOCS_CREATE_URL = "https://docs.google.com/document/create";

export function openGoogleDocUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export { copyTextToClipboard } from "@/lib/copy-to-clipboard";

export async function openInGoogleDocs(content: string) {
  const { copyTextToClipboard } = await import("@/lib/copy-to-clipboard");
  const copied = await copyTextToClipboard(content);

  openGoogleDocUrl(GOOGLE_DOCS_CREATE_URL);

  if (!copied) {
    throw new Error("Clipboard copy failed");
  }
}
