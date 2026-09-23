"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ACTION_LIST_PATH } from "@/app/base/views/actions/paths";
import type { Action } from "@/app/base/models/ActionModel";
import { postEncrypted, putEncrypted } from "@/libraries/EncryptedFetch";

const API_PATH = "/base/api/v1/actions";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export function ActionForm({
  mode,
  uuid,
  initial,
}: {
  mode: "create" | "edit";
  uuid?: string;
  initial?: Pick<Action, "action" | "description" | "status">;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        action: String(formData.get("action") ?? ""),
        description: String(formData.get("description") ?? "") || null,
        status: String(formData.get("status") ?? "active"),
      };

      const envelope =
        mode === "create"
          ? await postEncrypted<Action>(API_PATH, payload)
          : await putEncrypted<Action>(`${API_PATH}/${uuid}`, payload);

      if (!envelope.success) {
        setError(envelope.message || `Failed to ${mode === "create" ? "create" : "update"} action.`);
        return;
      }

      router.push(ACTION_LIST_PATH);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          {mode === "create" ? "New action" : "Edit action"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {mode === "create" ? "Create action." : "Update action."}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Action code</span>
            <input
              type="text"
              name="action"
              required
              minLength={2}
              maxLength={120}
              defaultValue={initial?.action ?? ""}
              placeholder="e.g. base:user:create"
              className={inputClass}
            />
            <span className="mt-2 block text-xs text-slate-500">
              Lowercase letters, numbers, dots, underscores, colons, dashes only.
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
            <textarea
              name="description"
              rows={3}
              maxLength={255}
              defaultValue={initial?.description ?? ""}
              placeholder="What this action grants."
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
            <select name="status" defaultValue={initial?.status ?? "active"} className={inputClass}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>

          {error ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isPending ? "Saving..." : mode === "create" ? "Create action" : "Save changes"}
            </button>
            <Link
              href={ACTION_LIST_PATH}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
