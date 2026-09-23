"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { MENU_LIST_PATH } from "@/app/base/views/menus/paths";
import type { Action } from "@/app/base/models/ActionModel";
import type { Menu } from "@/app/base/models/MenuModel";
import { getEncrypted, postEncrypted, putEncrypted } from "@/libraries/EncryptedFetch";

const API_PATH = "/base/api/v1/menus";
const ACTION_API_PATH = "/base/api/v1/actions";

type Option = {
  uuid: string;
  label: string;
};

/** UUIDs of the menu itself plus all its descendants (can't parent to them). */
function excludedUuids(menus: Menu[], uuid?: string): Set<string> {
  const excluded = new Set<string>();
  if (!uuid) {
    return excluded;
  }
  excluded.add(uuid);
  let frontier = [uuid];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const menu of menus) {
      if (menu.parent && frontier.includes(menu.parent) && !excluded.has(menu.uuid)) {
        excluded.add(menu.uuid);
        next.push(menu.uuid);
      }
    }
    frontier = next;
  }
  return excluded;
}

/** Roots first by weight, children nested after parents, prefixed per depth. */
function orderParentOptions(menus: Menu[], uuid?: string): Option[] {
  const excluded = excludedUuids(menus, uuid);
  const live = menus.filter((menu) => !excluded.has(menu.uuid));
  const childrenOf = (parent: string | null) =>
    live
      .filter((menu) => (menu.parent ?? null) === parent)
      .sort((a, b) => a.weight - b.weight);

  const ordered: Option[] = [];
  const seen = new Set<string>();
  const visit = (parent: string | null, depth: number) => {
    for (const child of childrenOf(parent)) {
      if (seen.has(child.uuid)) {
        continue;
      }
      seen.add(child.uuid);
      ordered.push({ uuid: child.uuid, label: `${"— ".repeat(depth)}${child.menu}` });
      visit(child.uuid, depth + 1);
    }
  };
  visit(null, 0);

  // Orphans (parent missing): append flat so none lost.
  for (const menu of live) {
    if (!seen.has(menu.uuid)) {
      ordered.push({ uuid: menu.uuid, label: menu.menu });
    }
  }
  return ordered;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export function MenuForm({
  mode,
  uuid,
  initial,
}: {
  mode: "create" | "edit";
  uuid?: string;
  initial?: Pick<
    Menu,
    "icon" | "parent" | "menu" | "action_id" | "description" | "redirection" | "weight" | "status"
  >;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [actionOptions, setActionOptions] = useState<Option[]>([]);
  const [parentOptions, setParentOptions] = useState<Option[]>([]);
  const [actionId, setActionId] = useState(initial?.action_id ?? "");
  const [parentId, setParentId] = useState(initial?.parent ?? "");

  // Keep current values selectable even when missing from fetched lists.
  const actionItems =
    initial?.action_id && !actionOptions.some((option) => option.uuid === initial.action_id)
      ? [{ uuid: initial.action_id, label: initial.action_id }, ...actionOptions]
      : actionOptions;
  const parentItems =
    initial?.parent && !parentOptions.some((option) => option.uuid === initial.parent)
      ? [{ uuid: initial.parent as string, label: initial.parent as string }, ...parentOptions]
      : parentOptions;
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [actionsEnvelope, menusEnvelope] = await Promise.all([
          getEncrypted<Action[]>(`${ACTION_API_PATH}?sortProperty=action&sortDirection=asc&limit=100`),
          getEncrypted<Menu[]>(`${API_PATH}?sortProperty=weight&sortDirection=asc&limit=100`),
        ]);
        if (!active) {
          return;
        }
        if (!actionsEnvelope.success) {
          setOptionsError(actionsEnvelope.message || "Failed to load actions.");
          return;
        }
        if (!menusEnvelope.success) {
          setOptionsError(menusEnvelope.message || "Failed to load menus.");
          return;
        }
        setActionOptions(
          (actionsEnvelope.data ?? []).map((action) => ({ uuid: action.uuid, label: action.action })),
        );
        setParentOptions(orderParentOptions(menusEnvelope.data ?? [], uuid));
      } catch {
        if (active) {
          setOptionsError("Failed to load dropdown options. Please try again.");
        }
      } finally {
        if (active) {
          setOptionsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [uuid]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const weightRaw = String(formData.get("weight") ?? "").trim();
      const payload: Record<string, unknown> = {
        icon: String(formData.get("icon") ?? ""),
        parent: parentId || null,
        menu: String(formData.get("menu") ?? ""),
        action_id: actionId,
        description: String(formData.get("description") ?? "") || null,
        redirection: String(formData.get("redirection") ?? ""),
        status: String(formData.get("status") ?? "active"),
      };
      if (weightRaw) {
        payload.weight = Number(weightRaw);
      }

      const envelope =
        mode === "create"
          ? await postEncrypted<Menu>(API_PATH, payload)
          : await putEncrypted<Menu>(`${API_PATH}/${uuid}`, payload);

      if (!envelope.success) {
        setError(envelope.message || `Failed to ${mode === "create" ? "create" : "update"} menu.`);
        return;
      }

      router.push(MENU_LIST_PATH);
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
          {mode === "create" ? "New menu" : "Edit menu"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {mode === "create" ? "Create menu." : "Update menu."}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Menu name</span>
            <input
              type="text"
              name="menu"
              required
              minLength={2}
              maxLength={120}
              defaultValue={initial?.menu ?? ""}
              placeholder="e.g. User Management"
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Icon</span>
              <input
                type="text"
                name="icon"
                required
                maxLength={255}
                defaultValue={initial?.icon ?? ""}
                placeholder="e.g. ○"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Weight</span>
              <input
                type="number"
                name="weight"
                min={0}
                step={1}
                defaultValue={initial?.weight ?? 0}
                placeholder="0"
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Redirection</span>
            <input
              type="text"
              name="redirection"
              required
              maxLength={500}
              defaultValue={initial?.redirection ?? ""}
              placeholder="e.g. /base/views/users"
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Action</span>
              <select
                name="action_id"
                required
                value={actionId}
                onChange={(event) => setActionId(event.target.value)}
                disabled={optionsLoading}
                className={inputClass}
              >
                <option value="">
                  {optionsLoading ? "Loading actions..." : "Select gating action"}
                </option>
                {actionItems.map((option) => (
                  <option key={option.uuid} value={option.uuid}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-xs text-slate-500">
                Permission code required to see this menu.
              </span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Parent</span>
              <select
                name="parent"
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                disabled={optionsLoading}
                className={inputClass}
              >
                <option value="">— Root menu —</option>
                {parentItems.map((option) => (
                  <option key={option.uuid} value={option.uuid}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-xs text-slate-500">
                Root menu when empty.
              </span>
            </label>
          </div>

          {optionsError ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {optionsError}
            </p>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
            <textarea
              name="description"
              rows={3}
              maxLength={255}
              defaultValue={initial?.description ?? ""}
              placeholder="What this menu is for."
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
              {isPending ? "Saving..." : mode === "create" ? "Create menu" : "Save changes"}
            </button>
            <Link
              href={MENU_LIST_PATH}
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
