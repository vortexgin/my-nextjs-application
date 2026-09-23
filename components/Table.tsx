"use client";

import { SessionInfo } from "@/libraries/Auth";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AuthComponent, hasPermission } from "./AuthComponent";
import { Pagination } from "./Pagination";

export type TableColumn = {
  /** Sort key sent as sortProperty. */
  key: string;
  /** Header label. */
  label: string;
  /** Row field rendered in this column. */
  field: string;
};

export type TableRow = Record<string, unknown> & {
  uuid: string;
};

export type TableSortDir = "asc" | "desc";

export type TableQuery = {
  sort: string;
  dir: TableSortDir;
  offset: number;
};

/**
 * Row fetcher. Receives sortProperty, sortDirection, offset, limit
 * plus any extraParams merged in. Returns raw rows; Table trims
 * to pageSize and derives hasNext from the extra limit+1 row.
 * Throws Error with message on failure.
 */
export type FetchRows = (params: URLSearchParams) => Promise<TableRow[]>;

/**
 * Deletes one row by uuid. Returns error message, empty on success.
 */
export type DeleteRow = (uuid: string) => Promise<string>;

function buildParams(
  query: TableQuery,
  extra: Record<string, string> | undefined,
  pageSize: number,
): URLSearchParams {
  const params = new URLSearchParams(extra);
  params.set("sortProperty", query.sort);
  params.set("sortDirection", query.dir);
  params.set("offset", String(query.offset));
  // One extra row tells whether a next page exists.
  params.set("limit", String(pageSize + 1));
  return params;
}

export function Table({
  session,
  columns,
  fetchRows,
  basePath,
  extraParams,
  actionUpdate = [],
  actionDelete = [],
  pageSize = 10,
  defaultSort,
  labelField,
  renderCell,
  onDelete,
}: {
  session: SessionInfo,
  columns: TableColumn[];
  fetchRows: FetchRows;
  actionUpdate: string[];
  actionDelete: string[];
  /** Link prefix: detail `${basePath}/${uuid}`, edit `${basePath}/${uuid}/edit`. */
  basePath: string;
  /** Filter params merged into every request. Changing identity remounts via key. */
  extraParams?: Record<string, string>;
  pageSize?: number;
  defaultSort?: { key: string; dir: TableSortDir };
  /** Row field used in delete confirm text. Defaults to first column field. */
  labelField?: string;
  /** Custom cell render. Return undefined for default text render. */
  renderCell?: (column: TableColumn, row: TableRow, value: unknown) => ReactNode;
  /** Deletes one row by uuid. Returns error message, empty on success. */
  onDelete?: DeleteRow;
}) {
  const initialSort = defaultSort?.key ?? columns[0].key;
  const initialDir = defaultSort?.dir ?? "desc";

  const [query, setQuery] = useState<TableQuery>({ sort: initialSort, dir: initialDir, offset: 0 });
  const [rows, setRows] = useState<TableRow[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // Latest props for the mount-once loader below. Parent remounts
  // via key when filters change, so refs stay correct per mount.
  const fetchRef = useRef(fetchRows);
  const extraRef = useRef(extraParams);
  const sizeRef = useRef(pageSize);
  const sortRef = useRef({ key: initialSort, dir: initialDir });

  useEffect(() => {
    fetchRef.current = fetchRows;
    extraRef.current = extraParams;
    sizeRef.current = pageSize;
    sortRef.current = { key: initialSort, dir: initialDir };
  });

  const load = useCallback(
    async (next: TableQuery) => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchRef.current(
          buildParams(next, extraRef.current, sizeRef.current),
        );
        setRows(data.slice(0, sizeRef.current));
        setHasNext(data.length > sizeRef.current);
        setQuery(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch rows.");
        setRows([]);
        setHasNext(false);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const first = sortRef.current;
        const data = await fetchRef.current(
          buildParams({ sort: first.key, dir: first.dir, offset: 0 }, extraRef.current, sizeRef.current),
        );
        if (!active) {
          return;
        }
        setRows(data.slice(0, sizeRef.current));
        setHasNext(data.length > sizeRef.current);
        setQuery({ sort: first.key, dir: first.dir, offset: 0 });
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to fetch rows.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function toggleSort(column: string) {
    const dir: TableSortDir = query.sort === column && query.dir === "asc" ? "desc" : "asc";
    load({ sort: column, dir, offset: 0 });
  }

  async function handleDelete(row: TableRow) {
    if (!onDelete) {
      return;
    }
    const label = String(row[labelField ?? columns[0].field] ?? row.uuid);
    if (!window.confirm(`Delete "${label}"?`)) {
      return;
    }
    setDeleteError("");
    const message = await onDelete(row.uuid);
    if (message) {
      setDeleteError(message);
      return;
    }
    // Row gone: step back a page when it was the last row on screen.
    const nextOffset =
      rows.length <= 1 && query.offset > 0 ? Math.max(0, query.offset - pageSize) : query.offset;
    load({ ...query, offset: nextOffset });
  }

  const page = Math.floor(query.offset / pageSize) + 1;
  const manageVisible = hasPermission(session.user, session.permissions, actionUpdate)
    || hasPermission(session.user, session.permissions, actionDelete);

  return (
    <div>
      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {deleteError ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </p>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              {columns.map((column) => {
                const active = query.sort === column.key;
                return (
                  <th key={column.key} className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      aria-label={`Sort by ${column.label} ${active && query.dir === "asc" ? "descending" : "ascending"}`}
                      className={`inline-flex items-center gap-1.5 uppercase tracking-wider transition hover:text-slate-900 ${active ? "text-blue-600" : ""}`}
                    >
                      {column.label}
                      <span aria-hidden className={active ? "" : "text-slate-300"}>
                        {active ? (query.dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  </th>
                );
              })}
              {manageVisible ? <th className="px-4 py-3 text-right font-medium">Manage</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-sm text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-sm text-slate-500">
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.uuid} className="transition hover:bg-slate-50">
                  {columns.map((column, index) => {
                    const value = row[column.field];
                    const custom = renderCell?.(column, row, value);
                    const content = custom ?? String(value ?? "—");
                    return (
                      <td key={column.key} className="px-4 py-3 text-slate-600">
                        {index === 0 ? (
                          <Link
                            href={`${basePath}/${row.uuid}`}
                            className="font-medium text-blue-600 hover:text-blue-500"
                          >
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                      </td>
                    );
                  })}
                  {manageVisible ? (
                    <td className="px-4 py-3">
                      <span className="flex items-center justify-end gap-2">
                        <AuthComponent
                          user={session.user}
                          permissions={session.permissions}
                          allowedPermissions={actionUpdate}
                        >
                          <Link
                            href={`${basePath}/${row.uuid}/edit`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            Edit
                          </Link>
                        </AuthComponent>
                        <AuthComponent
                          user={session.user}
                          permissions={session.permissions}
                          allowedPermissions={actionDelete}
                        >
                          <Link
                            href="#"
                            onClick={() => handleDelete(row)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            Delete
                          </Link>
                        </AuthComponent>
                      </span>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        hasNext={hasNext}
        loading={loading}
        offset={query.offset}
        count={rows.length}
        onPrev={() => load({ ...query, offset: Math.max(0, query.offset - pageSize) })}
        onNext={() => load({ ...query, offset: query.offset + pageSize })}
      />
    </div>
  );
}
