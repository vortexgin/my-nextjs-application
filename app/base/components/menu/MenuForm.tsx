"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { MENU_LIST_PATH } from "@/app/base/views/menus/paths";
import type { Action } from "@/app/base/models/ActionModel";
import type { Menu } from "@/app/base/models/MenuModel";
import { getEncrypted, postEncrypted, putEncrypted } from "@/libraries/EncryptedFetch";
import { SelectField, TextAreaField, TextField } from "@/components/FormField";

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
  const initialParent: string | null = initial?.parent ?? null;
  const [parentId, setParentId] = useState(initialParent ?? "");

  // Keep current values selectable even when missing from fetched lists.
  const actionItems =
    initial?.action_id && !actionOptions.some((option) => option.uuid === initial.action_id)
      ? [{ uuid: initial.action_id, label: initial.action_id }, ...actionOptions]
      : actionOptions;
  const parentItems =
    initialParent && !parentOptions.some((option) => option.uuid === initialParent)
      ? [{ uuid: initialParent, label: initialParent }, ...parentOptions]
      : parentOptions;
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [menuError, setMenuError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [actionsResult, menusResult] = await Promise.allSettled([
          getEncrypted<Action[]>(`${ACTION_API_PATH}?sortProperty=action&sortDirection=asc&limit=100`),
          getEncrypted<Menu[]>(`${API_PATH}?sortProperty=weight&sortDirection=asc&limit=100`),
        ]);
        if (!active) {
          return;
        }
        if (actionsResult.status === "rejected" || !actionsResult.value.success) {
          setActionError(
            actionsResult.status === "rejected"
              ? "Failed to load actions. Please try again."
              : actionsResult.value.message || "Failed to load actions.",
          );
        } else {
          setActionError("");
          setActionOptions(
            (actionsResult.value.data ?? []).map((action) => ({ uuid: action.uuid, label: action.action })),
          );
        }
        if (menusResult.status === "rejected" || !menusResult.value.success) {
          setMenuError(
            menusResult.status === "rejected"
              ? "Failed to load menus. Please try again."
              : menusResult.value.message || "Failed to load menus.",
          );
        } else {
          setMenuError("");
          setParentOptions(orderParentOptions(menusResult.value.data ?? [], uuid));
        }
      } catch {
        if (active) {
          setActionError((current) => current || "Failed to load dropdown options. Please try again.");
          setMenuError((current) => current || "Failed to load dropdown options. Please try again.");
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
    if (isPending || optionsLoading) {
      setError(
        isPending ? "A save is already in progress." : "Dropdown options are still loading. Please wait.",
      );
      return;
    }
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
          <TextField
            label="Menu name"
            type="text"
            name="menu"
            required
            minLength={2}
            maxLength={120}
            defaultValue={initial?.menu ?? ""}
            placeholder="e.g. User Management"
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField
              label="Icon"
              type="text"
              name="icon"
              required
              maxLength={255}
              defaultValue={initial?.icon ?? ""}
              placeholder="e.g. ○"
            />
            <TextField
              label="Weight"
              type="number"
              name="weight"
              min={0}
              step={1}
              defaultValue={initial?.weight ?? 0}
              placeholder="0"
            />
          </div>

          <TextField
            label="Redirection"
            type="text"
            name="redirection"
            required
            maxLength={500}
            defaultValue={initial?.redirection ?? ""}
            placeholder="e.g. /base/views/users"
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <SelectField
                label="Action"
                name="action_id"
                required
                value={actionId}
                onChange={(event) => setActionId(event.target.value)}
                disabled={optionsLoading}
                placeholder={optionsLoading ? "Loading actions..." : "Select gating action"}
                options={actionItems.map((option) => ({ value: option.uuid, label: option.label }))}
                hint="Permission code required to see this menu."
              />
              {actionError ? (
                <p role="alert" className="mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {actionError}
                </p>
              ) : null}
            </div>
            <div>
              <SelectField
                label="Parent"
                name="parent"
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                disabled={optionsLoading}
                placeholder="— Root menu —"
                options={parentItems.map((option) => ({ value: option.uuid, label: option.label }))}
                hint="Root menu when empty."
              />
              {menuError ? (
                <p role="alert" className="mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {menuError}
                </p>
              ) : null}
            </div>
          </div>

          <TextAreaField
            label="Description"
            name="description"
            rows={3}
            maxLength={255}
            defaultValue={initial?.description ?? ""}
            placeholder="What this menu is for."
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

          {error ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending || optionsLoading}
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
