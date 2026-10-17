/**
 * Client of the OneMap server (https://.../api). The engineer signs in with the platform account; the app then
 * keeps a session token in the device's secure store and sends it as a bearer token with every call.
 * @module
 */
import * as SecureStore from "expo-secure-store";

/** The server. Set EXPO_PUBLIC_ONEMAP_URL to point a build at another one (staging, a local server). */
export const ONEMAP_URL = (process.env.EXPO_PUBLIC_ONEMAP_URL || "https://platform.onemap8.com").replace(/\/+$/, "");

const TOKEN_KEY = "onemap_session_token";
/** How long a sign-in lasts before the engineer is asked again. */
const TOKEN_DAYS = 30;

/** The platform user as the app needs it. */
export interface OneMapUser {
  id: number;
  name: string;
  email: string;
  administrator?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  attributes?: Record<string, any>;
}

/** A refusal from the server. `message` is what to show: the server answers with a plain-text reason. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * The server's text for a refused call is an exception line followed by its stack trace
 * ("java.lang.IllegalArgumentException: A ticket cannot move ...\n\tat ..."): the message is the first line,
 * without the exception class.
 */
export function errorMessage(body: string): string {
  const first = body.split(/\r?\n/)[0].trim();
  return first.replace(/^(?:[\w$]+\.)+[\w$]*(?:Exception|Error):\s*/, "") || first;
}

let token: string | null = null;
let currentUser: OneMapUser | null = null;
let onUnauthorized: (() => void) | undefined;

/** Called when the server says the token is no longer good, so the app can send the engineer back to sign in. */
export const setUnauthorizedHandler = (handler?: () => void) => {
  onUnauthorized = handler;
};

/** The Authorization header of the signed-in engineer, for calls made outside `request` (file uploads, images). */
export const authHeaders = (): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});

/** True for an address the OneMap server serves (it needs the session token), false for any other (an old file). */
export const isServerFile = (uri: string) => uri.startsWith("/api/") || uri.startsWith(`${ONEMAP_URL}/api/`);

/**
 * What an image component needs to show `uri`: files of the server need the session token, any other address
 * (the Firebase files of older work orders) is public and used as it is.
 */
export function imageSource(uri: string): { uri: string; headers?: Record<string, string> } {
  if (!isServerFile(uri)) return { uri };
  return { uri: uri.startsWith("/") ? `${ONEMAP_URL}${uri}` : uri, headers: authHeaders() };
}

/** The signed-in user, for the code that is not a component (query options, location posts). */
export const getCurrentUser = () => currentUser;

export async function loadToken(): Promise<string | null> {
  token = (await SecureStore.getItemAsync(TOKEN_KEY)) || null;
  return token;
}

async function saveToken(value: string | null) {
  token = value;
  if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

type Params = Record<string, string | number | boolean | null | undefined>;

const query = (params?: Params) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
};

const form = (fields: Record<string, string>) => new URLSearchParams(fields).toString();

async function fail(response: Response): Promise<never> {
  const text = (await response.text().catch(() => "")).trim();
  throw new ApiError(errorMessage(text) || `${response.status} ${response.statusText}`, response.status);
}

/** A call to /api{path} with the session token. A 401 clears the token and tells the app. */
export async function request<T>(method: string, path: string, options: { params?: Params; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${ONEMAP_URL}/api${path}${query(options.params)}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (response.status === 401 && token) {
    currentUser = null;
    await saveToken(null);
    onUnauthorized?.();
  }
  if (!response.ok) await fail(response);
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const utf8Basic = (email: string, password: string) => {
  const raw = unescape(encodeURIComponent(`${email}:${password}`));
  return `Basic ${btoa(raw)}`;
};

/**
 * Signs in with the platform account and keeps a session token. The password is only sent here, over HTTPS; it
 * is not stored.
 */
export async function login(email: string, password: string): Promise<OneMapUser> {
  const response = await fetch(`${ONEMAP_URL}/api/session`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: form({ email, password }),
  });
  if (!response.ok) await fail(response);
  const user = (await response.json()) as OneMapUser;

  // The token call proves who is asking with the credentials themselves, so it does not depend on a cookie.
  const expiration = new Date(Date.now() + TOKEN_DAYS * 86_400_000).toISOString();
  const tokenResponse = await fetch(`${ONEMAP_URL}/api/session/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: utf8Basic(email, password) },
    body: form({ expiration }),
  });
  if (!tokenResponse.ok) await fail(tokenResponse);
  await saveToken((await tokenResponse.text()).trim());
  currentUser = user;
  return user;
}

/** The user of the stored token, or null when there is none or it is no longer good. */
export async function restoreSession(): Promise<OneMapUser | null> {
  if (!(await loadToken())) return null;
  try {
    currentUser = await request<OneMapUser>("GET", "/session");
    return currentUser;
  } catch {
    await saveToken(null);
    return null;
  }
}

/** Revokes the token on the server (best effort) and forgets it. */
export async function logout(): Promise<void> {
  const current = token;
  currentUser = null;
  await saveToken(null);
  if (current) {
    await fetch(`${ONEMAP_URL}/api/session/token/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Bearer ${current}` },
      body: form({ token: current }),
    }).catch(() => undefined);
  }
}

/** Changes the engineer's own password: the user is read again and saved with the new one. */
export async function changePassword(user: OneMapUser, newPassword: string): Promise<void> {
  const fresh = await request<OneMapUser>("GET", `/users/${user.id}`);
  await request("PUT", `/users/${user.id}`, { body: { ...fresh, password: newPassword } });
}
