const contentFromMeta = (raw, expectedName) => {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (!value.includes("<")) return value.slice(0, 512);
  const documentFragment = new DOMParser().parseFromString(value, "text/html");
  const meta = Array.from(documentFragment.querySelectorAll("meta")).find(
    (node) => node.getAttribute("name")?.toLowerCase() === expectedName.toLowerCase()
  );
  return String(meta?.getAttribute("content") || "").trim().slice(0, 512);
};

export const applyTrustedHeadSettings = (settings = {}) => {
  const content = contentFromMeta(settings.googleSearchConsoleTag, "google-site-verification");
  const selector = 'meta[name="google-site-verification"]';
  const existing = document.head.querySelector(selector);
  if (!content) {
    existing?.remove();
    return;
  }
  const meta = existing || document.createElement("meta");
  meta.setAttribute("name", "google-site-verification");
  meta.setAttribute("content", content);
  if (!existing) document.head.appendChild(meta);
};
