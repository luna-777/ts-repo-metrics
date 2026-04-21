/**
 * AES-256-GCM encrypt/decrypt for GitHub OAuth access tokens at rest.
 * Key: GITHUB_OAUTH_ENCRYPTION_KEY (any string; hashed to 32 bytes with SHA-256).
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const raw = process.env.GITHUB_OAUTH_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("Missing GITHUB_OAUTH_ENCRYPTION_KEY");
  }
  return createHash("sha256").update(raw, "utf8").digest();
}

export function encryptGitHubAccessToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptGitHubAccessToken(blob: string): string {
  const key = getKey();
  const buf = Buffer.from(blob, "base64url");
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("Invalid encrypted token payload");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

export function isGitHubTokenEncryptionConfigured(): boolean {
  return Boolean(process.env.GITHUB_OAUTH_ENCRYPTION_KEY?.trim());
}
