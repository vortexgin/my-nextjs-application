"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { postEncrypted } from "@/libraries/EncryptedFetch";

const DEFAULT_UPLOAD_API = "/base/api/v1/tools/upload-file";
const DEFAULT_MAX_FILE_BYTES = 10 * 1024 * 1024;

const uploadButtonClass =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

export type UploadButtonProps = {
  onUploaded: (url: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  label?: string;
  apiPath?: string;
  maxBytes?: number;
};

/**
 * File picker + base64-inside-JSON uploader for `TextField`'s `action` slot:
 * `action={<UploadButton onUploaded={...} onError={...} />}`.
 * Permission gating stays outside (AuthComponent / conditional render).
 */
export function UploadButton({
  onUploaded,
  onError,
  disabled,
  label = "File",
  apiPath = DEFAULT_UPLOAD_API,
  maxBytes = DEFAULT_MAX_FILE_BYTES,
}: UploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFilePicked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so picking the same file twice still fires onChange.
    event.target.value = "";
    if (!file) {
      return;
    }
    if (file.size > maxBytes) {
      onError?.(`File exceeds the ${maxBytes} byte limit.`);
      return;
    }
    setUploading(true);
    try {
      const data = await readAsBase64(file);
      const envelope = await postEncrypted<{ key: string; url: string }>(apiPath, {
        filename: file.name,
        content_type: file.type || "application/octet-stream",
        data,
      });
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to upload file.");
      }
      onUploaded(envelope.data.url);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className={uploadButtonClass}
      >
        {uploading ? "Uploading..." : label}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={handleFilePicked}
      />
    </>
  );
}
