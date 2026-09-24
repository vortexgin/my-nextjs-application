"use client";

import { useEffect, useState } from "react";
import type { ActivityLog } from "@/app/base/models/ActivityLogModel";
import { getEncrypted } from "@/libraries/EncryptedFetch";

const API_PATH = "/base/api/v1/activity-logs";

const DOT_TONE: Record<string, string> = {
  create: "bg-green-500",
  update: "bg-blue-500",
  delete: "bg-red-500",
};

const BADGE_TONE: Record<string, string> = {
  create: "bg-green-50 text-green-700 ring-green-200",
  update: "bg-blue-50 text-blue-700 ring-blue-200",
  delete: "bg-red-50 text-red-700 ring-red-200",
};

function actorLabel(actor: ActivityLog["actor"]): string {
  if (!actor || typeof actor !== "object") {
    return "System";
  }
  const record = actor as Record<string, unknown>;
  if (typeof record.name === "string" && record.name.trim()) {
    return record.name;
  }
  if (typeof record.email === "string" && record.email.trim()) {
    return record.email;
  }
  return "Unknown user";
}

function DataBlock({ title, data }: { title: string; data: Record<string, unknown> | null }) {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }
  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer font-medium text-slate-500 hover:text-slate-700">
        {title}
      </summary>
      <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-slate-950 p-2 font-mono text-[11px] leading-5 text-slate-200">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

export function ActivityTimeline({
  entity,
  entityUuid,
}: {
  entity: string;
  entityUuid: string;
}) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams({
          "filter[entity]": entity,
          "filter[entity_uuid]": entityUuid,
          sortProperty: "created_at",
          sortDirection: "desc",
          limit: "50",
        });
        const envelope = await getEncrypted<ActivityLog[]>(`${API_PATH}?${params.toString()}`);
        if (!active) {
          return;
        }
        if (!envelope.success) {
          setError(envelope.message || "Failed to load activity.");
          return;
        }
        setLogs(envelope.data ?? []);
      } catch {
        if (active) {
          setError("Failed to load activity. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [entity, entityUuid]);

  return (
    <div className="mt-6 rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">Activity</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Timeline.</h2>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading activity...</p>
      ) : error ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : logs.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No activity recorded yet.</p>
      ) : (
        <ol className="mt-6 space-y-0 border-l-2 border-slate-200">
          {logs.map((log) => (
            <li key={log.uuid} className="relative pb-6 pl-6 last:pb-0">
              <span
                aria-hidden
                className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${DOT_TONE[log.operation] ?? "bg-slate-400"}`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE_TONE[log.operation] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}
                >
                  {log.operation}
                </span>
                <span className="text-sm font-medium text-slate-900">{actorLabel(log.actor)}</span>
                <span className="text-xs text-slate-500">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
              <DataBlock title="Origin data" data={log.origin} />
              <DataBlock title="Updated data" data={log.updated} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
