import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const hex = process.env.CONFIG_ENCRYPTION_KEY;
  if (!hex) throw new Error("CONFIG_ENCRYPTION_KEY não configurada");
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) throw new Error("CONFIG_ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes)");
  return key;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return PREFIX + [iv, authTag, ciphertext].map((b) => b.toString("base64")).join(":");
}

/**
 * Values saved before encryption was introduced are plain text (no `enc:v1:` prefix)
 * and are returned as-is — they get re-encrypted next time they're saved via salvarWhatsapp.
 */
export function decryptSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith(PREFIX)) return value;
  const [ivB64, tagB64, dataB64] = value.slice(PREFIX.length).split(":");
  if (!ivB64 || !tagB64 || !dataB64) return null;
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return plaintext.toString("utf8");
}
