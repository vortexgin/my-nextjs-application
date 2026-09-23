// Generates the RSA keypair used for API payload encryption.
// Usage: npm run keys:generate [-- --force]
// Writes keys/rsa-private.pem (0600) and keys/rsa-public.pem.
// Private key must never be committed (see .gitignore).
import { generateKeyPairSync } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const keysDir = join(root, "keys");
const privatePath = join(keysDir, "rsa-private.pem");
const publicPath = join(keysDir, "rsa-public.pem");
const force = process.argv.includes("--force");

if (!force && existsSync(privatePath) && existsSync(publicPath)) {
  console.log("Keys already exist. Pass --force to regenerate.");
  process.exit(0);
}

mkdirSync(keysDir, { recursive: true });

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

writeFileSync(privatePath, privateKey, { mode: 0o600 });
writeFileSync(publicPath, publicKey, { mode: 0o644 });

console.log(`Private key: ${privatePath}`);
console.log(`Public key:  ${publicPath}`);
