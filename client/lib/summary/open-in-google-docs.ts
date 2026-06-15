const GOOGLE_DOCS_CREATE_URL = "https://docs.google.com/document/create";

export async function openInGoogleDocs(content: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(content);
  }

  window.open(GOOGLE_DOCS_CREATE_URL, "_blank", "noopener,noreferrer");
}
