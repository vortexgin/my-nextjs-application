import { NextRequest, NextResponse } from "next/server";
import { decryptEnvelope, decryptSessionKey, encryptEnvelope } from "@/libraries/Encryption";
import { fail } from "@/libraries/Http";
import { isTrue } from "./Boolean";

export const KEY_EXCHANGE_HEADER = "x-key-exchange";
export const ENCRYPTED_HEADER = "x-encrypted";
export const VERBOSE_HEADER = "x-app-verbose";

type RouteHandler<TContext> = (request: NextRequest, context: TContext) => Promise<Response>;

/**
 * Route-handler middleware for encrypted API payloads (hybrid RSA + AES-GCM).
 *
 * Client sends header `x-key-exchange: base64(RSA_OAEP(publicKey, aesKey))`.
 * JSON bodies then use envelope shape `{ iv, data }` instead of raw payload.
 * Handler responses are re-encrypted with the same AES key and returned
 * as envelopes with `x-encrypted: true`.
 *
 * Encryption enforced in every environment. Only escape hatch: header
 * `x-app-verbose: 1` passes payload + response through untouched (plaintext),
 * intended for debugging. Verbose wins over exchange header when both sent.
 */
export function withEncryption<TContext>(handler: RouteHandler<TContext>): RouteHandler<TContext> {
  return async (request: NextRequest, context: TContext) => {
    const verbose = request.headers.get(VERBOSE_HEADER);
    if (isTrue(verbose?.trim())) {
      return handler(request, context);
    }

    const exchange = request.headers.get(KEY_EXCHANGE_HEADER);
    if (!exchange) {
      return fail("Encrypted exchange required. Send x-key-exchange or x-app-verbose: 1.", 400);
    }

    let sessionKey: Buffer;
    try {
      sessionKey = decryptSessionKey(exchange);
    } catch {
      return fail("Invalid key exchange.", 400);
    }

    try {
      let innerRequest = request;
      const rawBody = await request.text();
      if (rawBody) {
        const payload = decryptEnvelope(sessionKey, JSON.parse(rawBody));
        // Forward auth headers: downstream handlers resolve the
        // session (activity log, session-aware logic) from these.
        const innerHeaders: Record<string, string> = { "content-type": "application/json" };
        const cookie = request.headers.get("cookie");
        if (cookie) {
          innerHeaders.cookie = cookie;
        }
        const authorization = request.headers.get("authorization");
        if (authorization) {
          innerHeaders.authorization = authorization;
        }
        innerRequest = new NextRequest(request.url, {
          method: request.method,
          headers: innerHeaders,
          body: JSON.stringify(payload),
        });
      }

      const response = await handler(innerRequest, context);
      const responseText = await response.text();
      let responseData: unknown = null;
      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }
      }

      const outHeaders = new Headers({
        [ENCRYPTED_HEADER]: "true",
        "content-type": "application/json",
      });
      const setCookies = (
        response.headers as Headers & { getSetCookie?: () => string[] }
      ).getSetCookie?.() ?? [];
      for (const cookie of setCookies) {
        outHeaders.append("set-cookie", cookie);
      }

      return new NextResponse(JSON.stringify(encryptEnvelope(sessionKey, responseData)), {
        status: response.status,
        headers: outHeaders,
      });
    } catch {
      return fail("Encrypted exchange failed.", 400);
    }
  };
}
