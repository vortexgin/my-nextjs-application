import {
  createCipheriv,
  createDecipheriv,
  generateKeyPairSync,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
  constants,
} from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const KEYS_DIR = join(process.cwd(), "keys");
const PRIVATE_KEY_PATH = join(KEYS_DIR, "rsa-private.pem");
const PUBLIC_KEY_PATH = join(KEYS_DIR, "rsa-public.pem");

const RSA_OAEP_HASH = "sha256";
const AES_ALGORITHM = "aes-256-gcm";
const AES_KEY_BYTES = 32;
const GCM_IV_BYTES = 12;
const GCM_TAG_BYTES = 16;

export type EncryptedEnvelope = {
  iv: string;
  data: string;
};

type KeyPair = {
  privateKey: string;
  publicKey: string;
};

let cachedKeys: KeyPair | null = null;

function generateKeyPair(): KeyPair {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  mkdirSync(KEYS_DIR, { recursive: true });
  writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
  writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 });

  return { privateKey, publicKey };
}

function loadKeys(): KeyPair {
  if (cachedKeys) {
    return cachedKeys;
  }

  if (existsSync(PRIVATE_KEY_PATH) && existsSync(PUBLIC_KEY_PATH)) {
    cachedKeys = {
      privateKey: readFileSync(PRIVATE_KEY_PATH, "utf8"),
      publicKey: readFileSync(PUBLIC_KEY_PATH, "utf8"),
    };
    return cachedKeys;
  }

  console.warn("[encryption] RSA keypair missing, generating ephemeral keys. Run `npm run keys:generate` for stable keys.");
  cachedKeys = generateKeyPair();
  return cachedKeys;
}

export function getServerPublicKey(): string {
  return loadKeys().publicKey;
}

/** RSA-OAEP-SHA256 decrypt of the client-sent AES session key (base64). */
export function decryptSessionKey(exchange: string): Buffer {
  const { privateKey } = loadKeys();
  const sessionKey = privateDecrypt(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: RSA_OAEP_HASH,
    },
    Buffer.from(exchange, "base64"),
  );

  if (sessionKey.length !== AES_KEY_BYTES) {
    throw new Error("Invalid session key length.");
  }

  return sessionKey;
}

/** AES-256-GCM encrypt of any JSON-serializable payload. */
export function encryptEnvelope(sessionKey: Buffer, payload: unknown): EncryptedEnvelope {
  const iv = randomBytes(GCM_IV_BYTES);
  const cipher = createCipheriv(AES_ALGORITHM, sessionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    data: Buffer.concat([ciphertext, tag]).toString("base64"),
  };
}

/** AES-256-GCM decrypt of an envelope. Throws on tamper / wrong key. */
export function decryptEnvelope<T = unknown>(sessionKey: Buffer, envelope: EncryptedEnvelope): T {
  if (typeof envelope?.iv !== "string" || typeof envelope?.data !== "string") {
    throw new Error("Malformed encrypted envelope.");
  }

  const combined = Buffer.from(envelope.data, "base64");
  if (combined.length < GCM_TAG_BYTES + 1) {
    throw new Error("Malformed encrypted envelope.");
  }

  const ciphertext = combined.subarray(0, combined.length - GCM_TAG_BYTES);
  const tag = combined.subarray(combined.length - GCM_TAG_BYTES);
  const decipher = createDecipheriv(AES_ALGORITHM, sessionKey, Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  return JSON.parse(plaintext) as T;
}

/** Client-side helper shape (documented for API consumers, also used in tests). */
export function encryptSessionKey(serverPublicKey: string, sessionKey: Buffer): string {
  return publicEncrypt(
    {
      key: serverPublicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: RSA_OAEP_HASH,
    },
    sessionKey,
  ).toString("base64");
}

export function generateSessionKey(): Buffer {
  return randomBytes(AES_KEY_BYTES);
}
