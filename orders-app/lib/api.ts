import type { Category, ImageFit, Order, OrderItem, OrderStatus, Product, Settings } from "./types";

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

// ---- Public ---------------------------------------------------------------------

export interface Catalog {
  products: Product[];
  settings: Settings;
}

export function fetchCatalog(): Promise<Catalog> {
  return get<Catalog>({ action: "catalog" });
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
  firstName: string;
  lastName: string;
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

export function submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  return post<SubmitOrderResult>({ action: "submitOrder", ...input });
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
  "storeName" | "chapterName" | "tagline" | "paymentInstructions" | "storeOpen" | "closedMessage"
>;

export function updateSettings(settings: SettingsInput) {
  return post({ action: "updateSettings", token: requireToken(), settings });
}
