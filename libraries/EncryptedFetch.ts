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

function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .split("\n")
    .filter((line) => !line.startsWith("-----"))
    .join("");
  return base64ToBytes(body).buffer as ArrayBuffer;
}

/**
 * POSTs through the hybrid RSA + AES-GCM exchange (mirrors libraries/Encryption.ts).
 * Returns the decrypted response envelope.
 */
export async function postEncrypted<T>(path: string, payload: unknown): Promise<ApiEnvelope<T>> {
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

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const cipherBytes = new Uint8Array(await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded));

  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", "x-key-exchange": exchange },
    body: JSON.stringify({ iv: bytesToBase64(iv), data: bytesToBase64(cipherBytes) }),
  });
  const envelope = (await response.json()) as { iv: string; data: string };

  const combined = base64ToBytes(envelope.data);
  const plainBytes = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(envelope.iv) },
    aesKey,
    combined,
  );
  return JSON.parse(new TextDecoder().decode(plainBytes)) as ApiEnvelope<T>;
}
