import fs from "fs";
import path from "path";
import crypto from "crypto";

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

export const getDbPath = () => {
  const isVercel = !!process.env.VERCEL;
  if (isVercel) {
    return path.join("/tmp", "companies-db.json");
  }
  return path.join(process.cwd(), "companies-db.json");
};

export function readDb() {
  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) {
    return {};
  }
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

export function writeDb(data: any) {
  const dbPath = getDbPath();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing to database:", e);
  }
}
