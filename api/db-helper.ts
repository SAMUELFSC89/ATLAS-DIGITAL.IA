import fs from "fs";
import path from "path";
import crypto from "crypto";
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

const IV_LENGTH = 16;

// Esta chave já esteve escrita no código de um repositório público. Nunca mais é aceita.
const LEAKED_DEFAULT_KEY = "atlas_intelligence_secret_key_32c";

/**
 * Chave usada para criptografar os tokens da Meta. Não existe valor padrão:
 * sem ENCRYPTION_KEY o servidor se recusa a gravar ou ler tokens.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY não está definida. Configure essa variável de ambiente com um valor secreto e aleatório.");
  }
  if (secret === LEAKED_DEFAULT_KEY) {
    throw new Error("ENCRYPTION_KEY está com o valor antigo que ficou público no repositório. Gere uma chave nova.");
  }
  const key = Buffer.alloc(32);
  key.write(secret, "utf-8");
  return key;
}

/** Chamado na subida do servidor para falhar cedo quando a chave está ausente ou é a antiga. */
export function assertEncryptionKey(): void {
  getEncryptionKey();
}

export function encrypt(text: string): string {
  // Sem try/catch de propósito: se a criptografia falhar, o token não pode ser gravado em texto puro.
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * Devolve "" quando o texto não pode ser lido com a chave atual (por exemplo,
 * tokens gravados com a chave antiga). Quem chama trata isso como "reconecte".
 */
export function decrypt(text: string): string {
  if (!text || !text.includes(":")) return "";
  const key = getEncryptionKey();
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString();
  } catch {
    console.warn("[Crypto] Token salvo não pôde ser lido com a ENCRYPTION_KEY atual. A empresa precisa reconectar o WhatsApp.");
    return "";
  }
}

let firestoreDb: Firestore | null = null;

export function getFirestoreAdmin(): Firestore {
  if (!firestoreDb) {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    let projectId = process.env.FIREBASE_PROJECT_ID;
    let databaseId = "(default)";

    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        projectId = config.projectId;
        if (config.firestoreDatabaseId) {
          databaseId = config.firestoreDatabaseId;
        }
      } catch (e) {
        console.error("Error parsing firebase-applet-config.json", e);
      }
    }

    if (getApps().length === 0) {
      initializeApp({
        projectId: projectId || "gen-lang-client-0890994677"
      });
    }

    const app = getApp();
    if (databaseId && databaseId !== "(default)") {
      try {
        firestoreDb = getFirestore(app, databaseId);
      } catch (e) {
        console.error(`Failed to initialize Firestore with database ID ${databaseId}, falling back to default`, e);
        firestoreDb = getFirestore(app);
      }
    } else {
      firestoreDb = getFirestore(app);
    }
  }
  return firestoreDb!;
}

export async function readDb(): Promise<any> {
  try {
    const db = getFirestoreAdmin();
    const snapshot = await db.collection("companies").get();
    
    // If firestore is empty, check if we have data in local JSON to migrate
    if (snapshot.empty) {
      const dbPath = path.join(process.cwd(), "companies-db.json");
      if (fs.existsSync(dbPath)) {
        try {
          const localData = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
          if (localData && Object.keys(localData).length > 0) {
            console.log("[Firebase Migration] Migrating existing local company records to Firestore...");
            await writeDb(localData);
            return localData;
          }
        } catch (e) {
          console.error("Error during migration of local db-helper to Firestore", e);
        }
      }
      return {};
    }

    const dbMap: any = {};
    snapshot.forEach((doc) => {
      dbMap[doc.id] = doc.data();
    });
    return dbMap;
  } catch (error) {
    console.error("Firestore read error, falling back to local file:", error);
    // Fallback to local JSON in case Firestore is unreachable
    const dbPath = path.join(process.cwd(), "companies-db.json");
    if (fs.existsSync(dbPath)) {
      try {
        return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      } catch (e) {}
    }
    return {};
  }
}

export async function writeDb(data: any): Promise<void> {
  try {
    const db = getFirestoreAdmin();
    const batch = db.batch();
    
    for (const [empresaId, company] of Object.entries(data)) {
      const docRef = db.collection("companies").doc(empresaId);
      batch.set(docRef, company || {}, { merge: true });
    }
    
    await batch.commit();

    // Also write to local file as secondary backup/cache
    try {
      const dbPath = path.join(process.cwd(), "companies-db.json");
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {}
  } catch (error) {
    console.error("Firestore write error, falling back to local file:", error);
    // Fallback to local JSON
    try {
      const dbPath = path.join(process.cwd(), "companies-db.json");
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {}
  }
}
