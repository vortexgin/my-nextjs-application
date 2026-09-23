import { getServerPublicKey } from "@/libraries/Encryption";
import { fail, ok } from "@/libraries/Http";

export const runtime = "nodejs";

/** Serves the RSA public key clients use for the encrypted API exchange. Stays plaintext by design. */
export async function GET() {
  try {
    return ok({ publicKey: getServerPublicKey() });
  } catch {
    return fail("Public key unavailable.", 500);
  }
}
