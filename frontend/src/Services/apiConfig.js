export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const toApiPath = (endpoint) => {
  if (!endpoint) return endpoint;

  try {
    const url = new URL(endpoint);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return endpoint;
  }
};

export const makeWebSocketUrl = (path) => {
  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = path.startsWith("/") ? path : `/${path}`;
  url.search = "";
  url.hash = "";
  return url.toString();
};
