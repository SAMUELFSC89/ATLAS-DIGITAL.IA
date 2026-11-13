import fs from "fs";
import path from "path";
import crypto from "crypto";
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "atlas_intelligence_secret_key_32c";
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  try {
    const key = Buffer.alloc(32);
    key.write(ENCRYPTION_KEY, "utf-8");
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (error) {
    console.error("Encryption error:", error);
    return text;
  }
}

export function decrypt(text: string): string {
  try {
    if (!text || !text.includes(":")) return text;
    const key = Buffer.alloc(32);
    key.write(ENCRYPTION_KEY, "utf-8");
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Decryption error:", error);
    return text;
  }
}

/**
 * Fora do Google Cloud (na Vercel, por exemplo) o servidor só consegue ler e
 * gravar no Firestore com a chave de uma conta de serviço. Ela vem da variável
 * FIREBASE_SERVICE_ACCOUNT, com o JSON da conta em texto ou em base64.
 */
function readServiceAccount(): any | null {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || "").trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
    const account = JSON.parse(json);
    if (typeof account.private_key === "string") {
      account.private_key = account.private_key.replace(/\\n/g, "\n");
    }
    return account;
  } catch (e) {
    console.error("FIREBASE_SERVICE_ACCOUNT inválida: não é um JSON de conta de serviço.", (e as Error).message);
    return null;
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
      const serviceAccount = readServiceAccount();
      if (serviceAccount) {
        initializeApp({
          credential: cert(serviceAccount),
          projectId: projectId || serviceAccount.project_id
        });
      } else {
        initializeApp({
          projectId: projectId || "gen-lang-client-0890994677"
        });
      }
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
