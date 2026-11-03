const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  
  if (isLocalhost) {
    return envUrl || `http://localhost:5055/api`;
  }
  
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }
  
  return `${window.location.origin}/api`;
};

export const API_URL = getApiUrl();

export const assetUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("/logo") || url.startsWith("/favicon")) return url;
  return `${API_URL.replace(/\/api$/, "")}${url}`;
};

/* Authentication is held in a Secure, HttpOnly cookie. JavaScript never
   receives the credential, limiting the impact of an XSS defect. */
export const getToken = () => null;

export const apiFetch = async (path, options = {}) => {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      if (
        typeof window !== "undefined" && 
        !window.location.pathname.includes("/login") && 
        !window.location.pathname.includes("/admin") && 
        !window.location.pathname.includes("/teacher")
      ) {
        window.location.href = "/login";
      }
    }
    const err = new Error(data.message || "Request failed");
    err.status = response.status;
    err.notFound = Boolean(data.notFound || response.status === 404);
    err.data = data;
    throw err;
  }
  return data;
};

export const uploadFile = async (file, folder = "general") => {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_URL}/upload?folder=${folder}`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Upload failed");
  return data.file;
};

export const trackPage = (pageUrl) => {
  apiFetch("/traffic/track", {
    method: "POST",
    body: {
      pageUrl,
      referrer: document.referrer,
      deviceType: window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop"
    }
  }).catch(() => {});
};
