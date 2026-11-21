// read valude from env, and if none or null, use default value
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
// helpdesk_token is the key used to store the JWT token in localStorage
const TOKEN_KEY = "helpdesk_token";

// LS for token, for persistence across reloads
export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};



// one error type for every failed request, so pages handle errors the same way as backend
export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors; // e.g. { email: "value is not a valid email address" }
  }
}

// turns the backend's error body into a readable message.
// our errors: {"detail": "text"}. Validation (422): {"detail": [{loc, msg}, ...]}
// 2 shapes
function parseError(status, body) {
  const detail = body?.detail;
  if (Array.isArray(detail)) { // if backend sends a list, go through each
    const fieldErrors = {};
    for (const err of detail) {
      const field = err.loc?.[err.loc.length - 1]; // get the last element of loc, which is email/full name
      fieldErrors[field] = err.msg.replace(/^Value error, /, ""); // remove "Value error from our own validators
    }
    return new ApiError(status, "Please check the highlighted fields.", fieldErrors);
  }
  return new ApiError(status, detail || "Something went wrong. Please try again."); // if backend sends an error message, use it. Otherwise, generic message
}

// function where every call goes through
// path endpoint, method default is get, body is the data to send, params is the query parameters
// all optional since {}
export async function request(path, { method = "GET", body, params } = {}) {
  const url = new URL(path, API_URL); // buil url from base url and path
  
  // add query parameters from url if any
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json"; // added only when we send data, telling backend body is JSON
  const token = tokenStorage.get();
  if (token) headers["Authorization"] = `Bearer ${token}`; // if we have a token, add it to the headers for auth... on backend side bearer_scheme is reading this header

  let response;
  try {
    response = await fetch(url, {
      method, // GET, POST, PUT, DELETE
      headers, // headers we built above
      body: body !== undefined ? JSON.stringify(body) : undefined, // if we have a body, stringify it to JSON, otherwise undefined
    });
  } catch { // only happens if server is down
    throw new ApiError(0, "Cannot reach the server. Is the backend running?");
  }

  if (response.status === 204) return null; // no content, so return null
  const data = await response.json().catch(() => null); // if response is not JSON, return null
  if (!response.ok) throw parseError(response.status, data); // if response is not ok, throw an error with the status and message from backend
  return data;
}