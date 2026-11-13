import crypto from "crypto";
import { getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestoreAdmin } from "../db-helper.ts";

/**
 * Confere o token de login do Firebase enviado no cabeçalho Authorization
 * e devolve o e-mail do usuário. Devolve null quando o token falta ou é inválido.
 */
export async function getAuthenticatedEmail(req: any): Promise<string | null> {
  const header: string = req.headers?.authorization || req.headers?.Authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;
  try {
    getFirestoreAdmin(); // garante que o app do Firebase Admin foi iniciado
    const decoded = await getAuth(getApp()).verifyIdToken(match[1]);
    return decoded.email || null;
  } catch (err) {
    console.warn("[Auth] Token de login inválido:", (err as Error).message);
    return null;
  }
}

export function applyCors(res: any): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/** Compara dois textos sem revelar, pelo tempo de resposta, onde eles diferem. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// ---------------------------------------------------------------------------
// Parâmetro `state` do login da Meta (Embedded Signup)
//
// O retorno em /api/meta-callback chega sem o token do Firebase, então a
// empresa é identificada por um `state` assinado pelo servidor, emitido só
// para quem está logado. Um cookie com o mesmo valor aleatório garante que o
// retorno acontece no mesmo navegador que iniciou a conexão.
// ---------------------------------------------------------------------------

const STATE_TTL_MS = 15 * 60 * 1000;
export const OAUTH_NONCE_COOKIE = "atlas_meta_oauth";

function stateSignature(payload: string): string | null {
  const secret = process.env.META_CLIENT_SECRET;
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update(`atlas-oauth-state:${payload}`).digest("base64url");
}

export function createOAuthState(email: string): { state: string; nonce: string } | null {
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = Buffer.from(JSON.stringify({ e: email, n: nonce, x: Date.now() + STATE_TTL_MS })).toString("base64url");
  const signature = stateSignature(payload);
  if (!signature) return null;
  return { state: `${payload}.${signature}`, nonce };
}

/** Devolve o e-mail da empresa quando o `state` é autêntico, está no prazo e casa com o cookie. */
export function verifyOAuthState(state: unknown, cookieNonce: string | null): string | null {
  if (typeof state !== "string" || !cookieNonce) return null;
  const [payload, signature, ...rest] = state.split(".");
  if (!payload || !signature || rest.length > 0) return null;
  const expected = stateSignature(payload);
  if (!expected || !safeEqual(signature, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (typeof data.e !== "string" || typeof data.n !== "string" || typeof data.x !== "number") return null;
    if (Date.now() > data.x) return null;
    if (!safeEqual(data.n, cookieNonce)) return null;
    return data.e;
  } catch {
    return null;
  }
}

export function readCookie(req: any, name: string): string | null {
  const header: string = req.headers?.cookie || "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index > 0 && part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

export function oauthNonceCookie(nonce: string, secure: boolean): string {
  const maxAge = nonce ? STATE_TTL_MS / 1000 : 0;
  return `${OAUTH_NONCE_COOKIE}=${nonce}; Path=/api; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/** Endereço público do app, usado no redirect da Meta. */
export function getBaseUrl(req: any): string {
  const appUrl = (process.env.APP_URL || "").trim();
  if (appUrl && appUrl !== "MY_APP_URL") return appUrl.replace(/\/$/, "");
  const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
  return `${protocol}://${req.headers.host}`;
}
