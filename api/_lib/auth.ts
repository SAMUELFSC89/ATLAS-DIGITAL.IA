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
