const text = (value, max = 1000) => String(value ?? "").trim().slice(0, max);
const safeUrl = (value) => {
  const candidate = text(value, 1000);
  if (!candidate || candidate.startsWith("/")) return candidate;
  try {
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol) ? candidate : "";
  } catch {
    return "";
  }
};

const safeColor = (value) => /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : undefined;
const safeStatus = (value) => value === "inactive" ? "inactive" : "active";

export const siteSettingsUpdateInput = (body = {}) => ({
  logo: safeUrl(body.logo),
  favicon: safeUrl(body.favicon),
  siteName: text(body.siteName, 120),
  primaryColor: safeColor(body.primaryColor),
  loginButtonText: text(body.loginButtonText, 60),
  registerButtonText: text(body.registerButtonText, 60),
  defaultSeoTitle: text(body.defaultSeoTitle, 180),
  defaultSeoDescription: text(body.defaultSeoDescription, 500),
  googleSearchConsoleTag: text(body.googleSearchConsoleTag, 1000),
  headerLinks: Array.isArray(body.headerLinks) ? body.headerLinks.slice(0, 30).map((link, index) => ({
    label: text(link?.label, 80),
    url: safeUrl(link?.url),
    sortOrder: Number.isFinite(Number(link?.sortOrder)) ? Number(link.sortOrder) : index,
    status: safeStatus(link?.status)
  })).filter((link) => link.label && link.url) : [],
  socialLinks: {
    facebook: safeUrl(body.socialLinks?.facebook),
    instagram: safeUrl(body.socialLinks?.instagram),
    youtube: safeUrl(body.socialLinks?.youtube),
    linkedin: safeUrl(body.socialLinks?.linkedin),
    website: safeUrl(body.socialLinks?.website)
  },
  aboutStats: {
    courses: text(body.aboutStats?.courses, 40),
    teachers: text(body.aboutStats?.teachers, 40),
    lessons: text(body.aboutStats?.lessons, 40),
    sundayClasses: text(body.aboutStats?.sundayClasses, 80)
  }
});

export const publicSiteSettings = (settings = {}) => ({
  logo: settings.logo,
  favicon: settings.favicon,
  siteName: settings.siteName,
  primaryColor: settings.primaryColor,
  headerLinks: settings.headerLinks,
  loginButtonText: settings.loginButtonText,
  registerButtonText: settings.registerButtonText,
  socialLinks: settings.socialLinks,
  defaultSeoTitle: settings.defaultSeoTitle,
  defaultSeoDescription: settings.defaultSeoDescription,
  googleSearchConsoleTag: settings.googleSearchConsoleTag,
  aboutStats: settings.aboutStats
});
