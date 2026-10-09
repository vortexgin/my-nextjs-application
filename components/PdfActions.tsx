"use client";

import { useState } from "react";
import { postEncrypted } from "@/libraries/EncryptedFetch";

type PdfData = { filename: string; content_type: string; size: number; data_base64: string; output: "download" | "print"; generated_at: string };

function decodePdf(data: PdfData): Blob {
  if (data.content_type !== "application/pdf" || !data.data_base64 || data.size <= 0) throw new Error("Server returned an invalid PDF.");
  const binary = atob(data.data_base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: "application/pdf" });
}

export function PdfActions({ endpoint, payload = {} }: { endpoint: string; payload?: Record<string, unknown> }) {
  const [pending, setPending] = useState<"download" | "print" | null>(null);
  const [error, setError] = useState("");

  async function generate(output: "download" | "print") {
    if (pending) return;
    setPending(output);
    setError("");
    const printWindow = output === "print" ? window.open("", "_blank") : null;
    try {
      const response = await postEncrypted<PdfData>(endpoint, { ...payload, output });
      if (!response.success || !response.data) throw new Error(response.message || "Failed to generate PDF.");
      const blob = decodePdf(response.data);
      const url = URL.createObjectURL(blob);
      if (output === "download") {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = response.data.filename || "document.pdf";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        if (!printWindow) throw new Error("The browser blocked the PDF print window.");
        printWindow.location.href = url;
        printWindow.addEventListener("load", () => {
          try { printWindow.print(); } catch { /* PDF viewer remains open for manual printing. */ }
        }, { once: true });
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (caught) {
      printWindow?.close();
      setError(caught instanceof Error ? caught.message : "Failed to generate PDF.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => generate("download")} disabled={pending !== null} className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60">
        {pending === "download" ? "Generating..." : "Download PDF"}
      </button>
      <button type="button" onClick={() => generate("print")} disabled={pending !== null} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
        {pending === "print" ? "Generating..." : "Print PDF"}
      </button>
      {pending ? <span role="status" className="text-sm text-slate-500">Preparing PDF…</span> : null}
      {error ? <span role="alert" className="w-full text-sm text-red-700">{error}</span> : null}
    </div>
  );
}
