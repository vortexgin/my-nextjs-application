import { NextResponse } from "next/server";

type CodedError = {
  code?: unknown;
};

export type ApiEnvelope<T = unknown> = {
  success: boolean;
  code: number;
  ts: number;
  message: string;
  data: T | null;
};

function unixTs(): number {
  return Math.floor(Date.now() / 1000);
}

/** Success envelope. `code` mirrors HTTP status. `message` stays empty. */
export function ok<T>(data: T, status = 200): NextResponse {
  const body: ApiEnvelope<T> = { success: true, code: status, ts: unixTs(), message: "", data };
  return NextResponse.json(body, { status });
}

/** Error envelope. `data` stays null unless extra detail passed. */
export function fail(message: string, status: number, data: unknown = null): NextResponse {
  const body: ApiEnvelope = { success: false, code: status, ts: unixTs(), message, data };
  return NextResponse.json(body, { status });
}

export function getErrorStatus<TFallback extends number>(error: unknown, fallback: TFallback): number {
  const code = (error as CodedError | null | undefined)?.code;
  return typeof code === "number" && Number.isInteger(code) && code >= 400 && code < 600
    ? code
    : fallback;
}

export function queryParam(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key);
  return value === null || value.trim() === "" ? undefined : value;
}

/** Public app origin used for outbound links (password reset, invites). No trailing slash. */
export function appBaseUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
