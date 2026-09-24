"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ROLE_LIST_PATH } from "@/app/base/views/roles/paths";
import type { Action } from "@/app/base/models/ActionModel";
import type { Role } from "@/app/base/models/RoleModel";
import { getEncrypted, postEncrypted, putEncrypted } from "@/libraries/EncryptedFetch";

const API_PATH = "/base/api/v1/roles";
const ACTION_API_PATH = "/base/api/v1/actions";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

type ActionOption = {
  uuid: string;
  code: string;
};

type EntityGroup = {
  title: string;
  options: { uuid: string; label: string }[];
};

type DomainGroup = {
  domain: string;
  entities: EntityGroup[];
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Nests `domain:entity:scope:operation` codes as
 * Domain tab > Entity header > short `scope:operation` list.
 */
function groupByDomain(options: ActionOption[]): DomainGroup[] {
  const domains = new Map<string, Map<string, { uuid: string; label: string }[]>>();
  for (const option of options) {
    const parts = option.code.split(":");
    const domain = parts.length >= 3 ? capitalize(parts[0]) : "Other";
    const entity = parts.length >= 3 ? capitalize(parts[1]) : "Other";
    const label = parts.length >= 3 ? parts.slice(2).join(":") : option.code;
    let entities = domains.get(domain);
    if (!entities) {
      entities = new Map();
      domains.set(domain, entities);
    }
    const list = entities.get(entity);
    if (list) {
      list.push({ uuid: option.uuid, label });
    } else {
      entities.set(entity, [{ uuid: option.uuid, label }]);
    }
  }
  return [...domains.entries()].map(([domain, entities]) => ({
    domain,
    entities: [...entities.entries()].map(([title, entityOptions]) => ({
      title,
      options: entityOptions,
    })),
  }));
}

export function RoleForm({
  mode,
  uuid,
  initial,
}: {
  mode: "create" | "edit";
  uuid?: string;
  initial?: Pick<Role, "name" | "slug" | "status"> & { action_ids?: string[] };
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [actionOptions, setActionOptions] = useState<ActionOption[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>(initial?.action_ids ?? []);
  const [activeDomain, setActiveDomain] = useState("");
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const envelope = await getEncrypted<Action[]>(
          `${ACTION_API_PATH}?sortProperty=action&sortDirection=asc&limit=100`,
        );
        if (!active) {
          return;
        }
        if (!envelope.success) {
          setOptionsError(envelope.message || "Failed to load actions.");
          return;
        }
        setActionOptions(
          (envelope.data ?? []).map((action) => ({ uuid: action.uuid, code: action.action })),
        );
      } catch {
        if (active) {
          setOptionsError("Failed to load actions. Please try again.");
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
  }, []);

  function toggleAction(uuid: string) {
    setSelectedActions((current) =>
      current.includes(uuid) ? current.filter((id) => id !== uuid) : [...current, uuid],
    );
  }

  const domainGroups = groupByDomain(actionOptions);
  const activeTab = domainGroups.some((group) => group.domain === activeDomain)
    ? activeDomain
    : (domainGroups[0]?.domain ?? "");
  const activeEntities =
    domainGroups.find((group) => group.domain === activeTab)?.entities ?? [];

  function selectedInDomain(domain: string): number {
    const uuids = new Set(
      domainGroups
        .find((group) => group.domain === domain)
        ?.entities.flatMap((entity) => entity.options.map((option) => option.uuid)) ?? [],
    );
    return selectedActions.filter((id) => uuids.has(id)).length;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        status: String(formData.get("status") ?? "active"),
        action_ids: selectedActions,
      };

      const envelope =
        mode === "create"
          ? await postEncrypted<Role>(API_PATH, payload)
          : await putEncrypted<Role>(`${API_PATH}/${uuid}`, payload);

      if (!envelope.success) {
        setError(envelope.message || `Failed to ${mode === "create" ? "create" : "update"} role.`);
        return;
      }

      router.push(ROLE_LIST_PATH);
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
          {mode === "create" ? "New role" : "Edit role"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {mode === "create" ? "Create role." : "Update role."}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
            <input
              type="text"
              name="name"
              required
              minLength={2}
              maxLength={120}
              defaultValue={initial?.name ?? ""}
              placeholder="e.g. Administrator"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Slug</span>
            <input
              type="text"
              name="slug"
              required
              minLength={2}
              maxLength={160}
              defaultValue={initial?.slug ?? ""}
              placeholder="e.g. administrator"
              className={inputClass}
            />
            <span className="mt-2 block text-xs text-slate-500">
              Lowercase letters, numbers, dashes, underscores only.
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
            <select name="status" defaultValue={initial?.status ?? "active"} className={inputClass}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>

          <fieldset className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Permissions ({selectedActions.length} selected)
            </span>
            {optionsLoading ? (
              <p className="text-sm text-slate-500">Loading actions...</p>
            ) : optionsError ? (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {optionsError}
              </p>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Permission domains">
                  {domainGroups.map((group) => {
                    const count = selectedInDomain(group.domain);
                    const selected = group.domain === activeTab;
                    return (
                      <button
                        key={group.domain}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => setActiveDomain(group.domain)}
                        className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition ${
                          selected
                            ? "bg-slate-950 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {group.domain}
                        {count > 0 ? ` (${count})` : ""}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 max-h-64 space-y-4 overflow-y-auto">
                  {activeEntities.map((entity) => (
                    <div key={entity.title}>
                      <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {entity.title}
                      </p>
                      {entity.options.map((option) => (
                        <label
                          key={option.uuid}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 pl-4 text-sm text-slate-700 transition hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            checked={selectedActions.includes(option.uuid)}
                            onChange={() => toggleAction(option.uuid)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-mono text-[13px]">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </fieldset>

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
              {isPending ? "Saving..." : mode === "create" ? "Create role" : "Save changes"}
            </button>
            <Link
              href={ROLE_LIST_PATH}
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
