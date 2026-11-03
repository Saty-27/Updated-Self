import DOMPurify from "dompurify";

const options = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form", "input", "button"],
  FORBID_ATTR: ["style", "srcdoc"],
  ALLOW_UNKNOWN_PROTOCOLS: false
};

/** Sanitize all CMS rich text at the final DOM boundary. */
export const sanitizedHtml = (value) => ({
  __html: DOMPurify.sanitize(String(value || ""), options)
});
