import type { Category, ImageFit, Leaderboard, Member, MemberSession, Order, OrderItem, OrderStatus, Product, Run, Settings } from "./types";

/*
  Client for the orders backend. In production that is a Google Apps Script web app
  (apps-script/orders-backend.gs in the site repo); in development it is
  scripts/mock-backend.mjs, which implements the same contract on localhost:8787.

  Requests are kept "simple" (GET with query params, POST with a text/plain JSON
  body) so the browser never sends a CORS preflight — Apps Script cannot answer one.
*/

declare global {
  interface Window {
    __ORDERS_CONFIG__?: { endpoint?: string };
  }
}

export const MOCK_ENDPOINT = "http://localhost:8787/exec";

export function endpoint(): string {
  if (typeof window === "undefined") return "";
  const configured = window.__ORDERS_CONFIG__?.endpoint?.trim();
  if (configured) return configured;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" ? MOCK_ENDPOINT : "";
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: "unconfigured" | "unauthorized" | "network" | "server" = "server",
  ) {
    super(message);
  }
}

type Ok<T> = { ok: true } & T;
type Fail = { ok: false; error: string; code?: string };

async function parse<T>(response: Response): Promise<T> {
  let body: Ok<T> | Fail;
  try {
    body = (await response.json()) as Ok<T> | Fail;
  } catch {
    throw new ApiError("The orders backend sent an unreadable reply.", "network");
  }
  if (!body.ok) {
    throw new ApiError(body.error || "Request failed.", body.code === "unauthorized" ? "unauthorized" : "server");
  }
  return body;
}

async function get<T>(params: Record<string, string>): Promise<T> {
  const base = endpoint();
  if (!base) throw new ApiError("The orders backend is not set up yet (config.js has no endpoint).", "unconfigured");
  let response: Response;
  try {
    response = await fetch(`${base}?${new URLSearchParams(params)}`, { method: "GET", redirect: "follow" });
  } catch {
    throw new ApiError("Could not reach the orders backend.", "network");
  }
  return parse<T>(response);
}

async function post<T>(payload: Record<string, unknown>): Promise<T> {
  const base = endpoint();
  if (!base) throw new ApiError("The orders backend is not set up yet (config.js has no endpoint).", "unconfigured");
  let response: Response;
  try {
    // No Content-Type header on purpose: text/plain keeps it a simple request.
    response = await fetch(base, { method: "POST", body: JSON.stringify(payload), redirect: "follow" });
  } catch {
    throw new ApiError("Could not reach the orders backend.", "network");
  }
  return parse<T>(response);
}

// ---- Member gate ------------------------------------------------------------------
// Brothers sign in with first name + last name + the shared access code. The backend
// hands back a signed token carrying the canonical name; the browser keeps it.

const MEMBER_KEY = "zr-member";

// Memoized on the raw string so useSyncExternalStore gets a stable snapshot object.
let memberCache: { raw: string | null; session: MemberSession | null } = { raw: null, session: null };

export function getMember(): MemberSession | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(MEMBER_KEY);
  } catch {
    return null;
  }
  if (raw === memberCache.raw) return memberCache.session;
  let session: MemberSession | null = null;
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<MemberSession>) : null;
    if (parsed?.token && parsed.firstName && parsed.lastName) {
      session = { token: parsed.token, firstName: parsed.firstName, lastName: parsed.lastName };
    }
  } catch {
    session = null;
  }
  memberCache = { raw, session };
  return session;
}

export function setMember(session: MemberSession | null) {
  try {
    if (session) window.localStorage.setItem(MEMBER_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(MEMBER_KEY);
  } catch {
    /* storage unavailable: they will be asked again next visit */
  }
}

export async function memberLogin(firstName: string, lastName: string, code: string): Promise<MemberSession> {
  const reply = await post<MemberSession>({ action: "memberLogin", firstName, lastName, code });
  const session: MemberSession = { token: reply.token, firstName: reply.firstName, lastName: reply.lastName };
  setMember(session);
  return session;
}

function requireMember(): string {
  const member = getMember();
  if (!member) throw new ApiError("Please sign in first.", "unauthorized");
  return member.token;
}

// ---- Storefront ---------------------------------------------------------------------

export interface Catalog {
  products: Product[];
  settings: Settings;
}

/** Needs a member token: the menu is not visible to anyone outside the gate. */
export function fetchCatalog(): Promise<Catalog> {
  return get<Catalog>({ action: "catalog", token: requireMember() });
}

/** All-time top drinkers, computed from paid orders. Brothers only. */
export function fetchLeaderboard(): Promise<Leaderboard> {
  return get<Leaderboard>({ action: "leaderboard", token: requireMember() });
}

/** The signed-in brother's own orders (no screenshots or admin notes). */
export function fetchMyOrders(): Promise<{ orders: Order[] }> {
  return get<{ orders: Order[] }>({ action: "myOrders", token: requireMember() });
}

export interface UploadPayload {
  name: string;
  type: string;
  /** Base64 without the data: prefix. */
  data: string;
}

export async function fileToUpload(file: File): Promise<UploadPayload> {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return { name: file.name, type: file.type || "application/octet-stream", data };
}

export interface SubmitOrderInput {
  note: string;
  items: { productId: string; quantity: number }[];
  screenshot: UploadPayload;
}

export interface SubmitOrderResult {
  orderNumber: number;
  totalCents: number;
  fullName: string;
  items: OrderItem[];
}

/** The name on the order comes from the member token, never from the form. */
export function submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  return post<SubmitOrderResult>({ action: "submitOrder", token: requireMember(), ...input });
}

// ---- Admin ----------------------------------------------------------------------

const TOKEN_KEY = "zr-admin-token";

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: the session just will not persist */
  }
}

function requireToken(): string {
  const token = getToken();
  if (!token) throw new ApiError("Please sign in again.", "unauthorized");
  return token;
}

export async function login(username: string, password: string): Promise<string> {
  const { token } = await post<{ token: string }>({ action: "login", username, password });
  setToken(token);
  return token;
}

export async function logout(): Promise<void> {
  const token = getToken();
  setToken(null);
  if (token) await post({ action: "logout", token }).catch(() => undefined);
}

export interface AdminData {
  products: Product[];
  settings: Settings;
  orders: Order[];
  members: Member[];
  runs: Run[];
}

export function fetchAdmin(): Promise<AdminData> {
  return get<AdminData>({ action: "admin", token: requireToken() });
}

export function fetchScreenshot(orderId: string): Promise<{ dataUrl: string }> {
  return get<{ dataUrl: string }>({ action: "screenshot", token: requireToken(), id: orderId });
}

export function setOrderStatus(id: string, status: OrderStatus) {
  return post({ action: "setOrderStatus", token: requireToken(), id, status });
}

export function setOrderAdminNote(id: string, adminNote: string) {
  return post({ action: "setOrderAdminNote", token: requireToken(), id, adminNote });
}

export function deleteOrder(id: string) {
  return post({ action: "deleteOrder", token: requireToken(), id });
}

export interface ProductInput {
  id?: string;
  name: string;
  category: Category;
  brand: string;
  tag: string;
  description: string;
  priceCents: number;
  image: string;
  imageFit: ImageFit;
  available: boolean;
}

export function saveProduct(product: ProductInput, imageUpload?: UploadPayload) {
  return post<{ product: Product }>({ action: "saveProduct", token: requireToken(), product, imageUpload });
}

export function deleteProduct(id: string) {
  return post({ action: "deleteProduct", token: requireToken(), id });
}

export function setProductAvailability(id: string, available: boolean) {
  return post({ action: "setProductAvailability", token: requireToken(), id, available });
}

export function moveProduct(id: string, direction: "up" | "down") {
  return post({ action: "moveProduct", token: requireToken(), id, direction });
}

export function moveBrand(brand: string, direction: "up" | "down") {
  return post({ action: "moveBrand", token: requireToken(), brand, direction });
}

export type SettingsInput = Pick<
  Settings,
  "storeName" | "chapterName" | "tagline" | "paymentInstructions" | "storeOpen" | "closedMessage" | "runName"
> & { accessCode: string };

export function updateSettings(settings: SettingsInput) {
  return post({ action: "updateSettings", token: requireToken(), settings });
}

/** Replaces the whole allowed-names list. */
export function saveMembers(members: Member[]) {
  return post<{ members: Member[] }>({ action: "saveMembers", token: requireToken(), members });
}
