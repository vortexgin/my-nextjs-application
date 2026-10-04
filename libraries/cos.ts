import { randomUUID } from "crypto";
import COS from "cos-nodejs-sdk-v5";

export type CosConfig = {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
  endpoint?: string;
  prefix: string;
  maxFileBytes: number;
};

export type UploadResult = {
  key: string;
  url: string;
  contentType: string;
  size: number;
  etag: string;
};

/** Reads COS settings from env. Throws when required keys are missing. */
export function getCosConfig(): CosConfig {
  const secretId = process.env.COS_SECRET_ID?.trim();
  const secretKey = process.env.COS_SECRET_KEY?.trim();
  const bucket = process.env.COS_BUCKET?.trim();
  const region = process.env.COS_REGION?.trim();

  if (!secretId || !secretKey || !bucket || !region) {
    throw new Error("Object storage is not configured. Set COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET and COS_REGION.");
  }

  return {
    secretId,
    secretKey,
    bucket,
    region,
    endpoint: process.env.COS_ENDPOINT?.trim().replace(/\/+$/, "") || undefined,
    prefix: process.env.COS_UPLOAD_PREFIX?.trim().replace(/^\/+|\/+$/g, "") || "uploads",
    maxFileBytes: Number(process.env.COS_MAX_FILE_BYTES ?? 10 * 1024 * 1024),
  };
}

/** Strips directories and unsafe characters. Returns empty when nothing usable remains. */
export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop()?.trim() ?? "";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

function objectUrl(config: CosConfig, key: string): string {
  if (config.endpoint) {
    return `${config.endpoint}/${key}`;
  }
  return `https://${config.bucket}.cos.${config.region}.myqcloud.com/${key}`;
}

/** Uploads one buffer to Tencent COS (S3-compatible). Key is generated server-side. */
export async function uploadToCos(
  buffer: Buffer,
  filename: string,
  contentType = "application/octet-stream",
): Promise<UploadResult> {
  const config = getCosConfig();
  const cos = new COS({ SecretId: config.secretId, SecretKey: config.secretKey });

  const day = new Date().toISOString().slice(0, 10);
  const key = `${config.prefix}/${day}/${randomUUID()}-${filename}`;

  const result = await new Promise<{ ETag: string }>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: config.bucket,
        Region: config.region,
        Key: key,
        Body: buffer,
        ContentLength: buffer.length,
        ContentType: contentType,
      },
      (error, data) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(data);
      },
    );
  });

  return {
    key,
    url: objectUrl(config, key),
    contentType,
    size: buffer.length,
    etag: result.ETag ?? "",
  };
}
