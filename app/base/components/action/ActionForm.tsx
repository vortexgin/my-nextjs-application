"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ACTION_LIST_PATH } from "@/app/base/views/actions/paths";
import type { Action } from "@/app/base/models/ActionModel";
import { postEncrypted, putEncrypted } from "@/libraries/EncryptedFetch";
import { SelectField, TextAreaField, TextField } from "@/components/FormField";

const API_PATH = "/base/api/v1/actions";

export function ActionForm({
  mode,
  uuid,
  initial,
}: {
  mode: "create" | "edit";
  uuid?: string;
  initial?: Pick<Action, "action" | "description" | "status" | "is_transactions">;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) {
      setError("A save is already in progress.");
      return;
    }
    setError("");
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        action: String(formData.get("action") ?? ""),
        description: String(formData.get("description") ?? "") || null,
        status: String(formData.get("status") ?? "active"),
        is_transactions: formData.get("is_transactions") === "on",
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
          <TextField
            label="Action code"
            type="text"
            name="action"
            required
            minLength={2}
            maxLength={120}
            pattern="[a-z0-9._:-]{2,120}"
            title="Lowercase letters, numbers, dots, underscores, colons, dashes only."
            defaultValue={initial?.action ?? ""}
            placeholder="e.g. base:user:create"
            hint="Lowercase letters, numbers, dots, underscores, colons, dashes only."
          />

          <TextAreaField
            label="Description"
            name="description"
            rows={3}
            maxLength={255}
            defaultValue={initial?.description ?? ""}
            placeholder="What this action grants."
          />

          <SelectField
            label="Status"
            name="status"
            defaultValue={initial?.status ?? "active"}
            options={[
              { value: "active", label: "active" },
              { value: "inactive", label: "inactive" },
            ]}
          />

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_transactions"
              defaultChecked={initial?.is_transactions ?? false}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">Transaction action</span>
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
