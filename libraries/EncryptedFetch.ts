"use client";

export type ApiEnvelope<T = unknown> = {
  success: boolean;
  code: number;
  ts: number;
  message: string;
  data: T;
};

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function isEncryptedEnvelope(value: unknown): value is { iv: string; data: string } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.iv === "string" && typeof record.data === "string";
}

function isPlainApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.success === "boolean";
}

function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .split("\n")
    .filter((line) => !line.startsWith("-----"))
    .join("");
  return base64ToBytes(body).buffer as ArrayBuffer;
}

type SessionHandshake = {
  exchange: string;
  aesKey: CryptoKey;
};

async function startHandshake(): Promise<SessionHandshake> {
  const keyResponse = await fetch("/base/api/v1/public-key");
  const keyEnvelope = (await keyResponse.json()) as ApiEnvelope<{ publicKey: string }>;
  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    pemToDer(keyEnvelope.data.publicKey),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );

  const aesKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  const rawAes = new Uint8Array(await window.crypto.subtle.exportKey("raw", aesKey));
  const exchange = bytesToBase64(
    new Uint8Array(await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, rawAes)),
  );

  return { exchange, aesKey };
}

async function encryptPayload(aesKey: CryptoKey, payload: unknown): Promise<{ iv: string; data: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const cipherBytes = new Uint8Array(await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded));

  return { iv: bytesToBase64(iv), data: bytesToBase64(cipherBytes) };
}

async function decryptEnvelope<T>(aesKey: CryptoKey, envelope: { iv: string; data: string }): Promise<ApiEnvelope<T>> {
  const combined = base64ToBytes(envelope.data);
  const plainBytes = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(envelope.iv) },
    aesKey,
    combined,
  );
  const decrypted = JSON.parse(new TextDecoder().decode(plainBytes));

  return decrypted?.iv && decrypted?.data
    ? decryptEnvelope<T>(aesKey, decrypted)
    : decrypted as ApiEnvelope<T>;
}

/**
 * Reads a fetch response that is normally an encrypted `{iv, data}`
 * envelope. Auth-layer rejections (401/403 from withAuthorization) and
 * exchange failures are intentionally plaintext `fail()` responses, so
 * pass plain `{success, ...}` envelopes through untouched instead of
 * feeding them to `atob` (which threw the misleading
 * "Failed to execute 'atob'" error).
 */
async function unwrapResponse<T>(response: Response, aesKey: CryptoKey): Promise<ApiEnvelope<T>> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(`Request failed (HTTP ${response.status}). Please try again.`);
  }
  if (isEncryptedEnvelope(body)) {
    return decryptEnvelope<T>(aesKey, body);
  }
  if (isPlainApiEnvelope<T>(body)) {
    return body;
  }
  throw new Error(`Request failed (HTTP ${response.status}). Please try again.`);
}

/**
 * GETs through the hybrid RSA + AES-GCM exchange (mirrors libraries/Encryption.ts).
 * Returns the decrypted response envelope.
 */
export async function getEncrypted<T>(path: string): Promise<ApiEnvelope<T>> {
  const { exchange, aesKey } = await startHandshake();

  const response = await fetch(path, {
    method: "GET",
    headers: { "x-key-exchange": exchange },
  });
  return unwrapResponse<T>(response, aesKey);
}

async function sendEncrypted<T>(method: "POST" | "PUT" | "DELETE", path: string, payload?: unknown): Promise<ApiEnvelope<T>> {
  const { exchange, aesKey } = await startHandshake();

  const response = await fetch(path, {
    method,
    headers: { "content-type": "application/json", "x-key-exchange": exchange },
    body: JSON.stringify(await encryptPayload(aesKey, payload)),
  });
  return unwrapResponse<T>(response, aesKey);
}

/**
 * POSTs through the hybrid RSA + AES-GCM exchange (mirrors libraries/Encryption.ts).
 * Returns the decrypted response envelope.
 */
export async function postEncrypted<T>(path: string, payload: unknown): Promise<ApiEnvelope<T>> {
  return sendEncrypted<T>("POST", path, payload);
}

/**
 * PUTs through the hybrid RSA + AES-GCM exchange (mirrors libraries/Encryption.ts).
 * Returns the decrypted response envelope.
 */
export async function putEncrypted<T>(path: string, payload: unknown): Promise<ApiEnvelope<T>> {
  return sendEncrypted<T>("PUT", path, payload);
}

/**
 * DELETEs through the hybrid RSA + AES-GCM exchange. No request body;
 * only the key-exchange header is sent. Returns the decrypted envelope.
 */
export async function deleteEncrypted<T>(path: string): Promise<ApiEnvelope<T>> {
  const { exchange, aesKey } = await startHandshake();

  const response = await fetch(path, {
    method: "DELETE",
    headers: { "x-key-exchange": exchange },
  });
  return unwrapResponse<T>(response, aesKey);
}
