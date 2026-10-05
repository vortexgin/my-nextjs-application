"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { USER_LIST_PATH } from "@/app/base/views/users/paths";
import type { Role } from "@/app/base/models/RoleModel";
import type { User } from "@/app/base/models/UserModel";
import type { Organization } from "@/app/sass/models/OrganizationModel";
import { AuthComponent } from "@/components/AuthComponent";
import { getEncrypted, postEncrypted, putEncrypted } from "@/libraries/EncryptedFetch";
import { SelectField, TextField } from "@/components/FormField";
import { UPDATE_ORGANIZATION_PERMISSION, hasPermission } from "@/libraries/Permissions";

const API_PATH = "/base/api/v1/users";
const ROLE_API_PATH = "/base/api/v1/roles";
const ORGANIZATION_API_PATH = "/sass/api/v1/organizations";

type RoleOption = {
  uuid: string;
  name: string;
  slug: string;
};

type OrganizationOption = {
  uuid: string;
  name: string;
};

export function UserForm({
  mode,
  uuid,
  initial,
  session,
  adminRoleSlug,
}: {
  mode: "create" | "edit";
  uuid?: string;
  initial?: Pick<User, "name" | "email" | "phone_number" | "status"> & { role_id?: string; organization_id?: string };
  session: { user: unknown; permissions: string[] };
  adminRoleSlug: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [roleId, setRoleId] = useState(initial?.role_id ?? "");
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [organizationOptions, setOrganizationOptions] = useState<OrganizationOption[]>([]);
  const [organizationId, setOrganizationId] = useState(initial?.organization_id ?? "");
  const [organizationAvailable, setOrganizationAvailable] = useState(true);
  const [organizationError, setOrganizationError] = useState("");
  const canManageOrganization = hasPermission(session.user, session.permissions, [UPDATE_ORGANIZATION_PERMISSION]);

  const viewerIsAdmin =
    (session.user as { role?: { slug?: unknown } } | null)?.role?.slug === adminRoleSlug;

  // Keep current role selectable even when missing from fetched list.
  // Non-admin viewers never see the admin role as a choice.
  const roleItems = (
    initial?.role_id && !roleOptions.some((option) => option.uuid === initial.role_id)
      ? [{ uuid: initial.role_id, name: initial.role_id, slug: "" }, ...roleOptions]
      : roleOptions
  ).filter((option) => viewerIsAdmin || option.slug !== adminRoleSlug);

  // Keep current organization selectable even when missing from fetched list.
  const organizationItems =
    initial?.organization_id && !organizationOptions.some((option) => option.uuid === initial.organization_id)
      ? [{ uuid: initial.organization_id, name: initial.organization_id }, ...organizationOptions]
      : organizationOptions;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const envelope = await getEncrypted<Role[]>(
          `${ROLE_API_PATH}?sortProperty=name&sortDirection=asc&limit=100`,
        );
        if (!active) {
          return;
        }
        if (!envelope.success) {
          setOptionsError(envelope.message || "Failed to load roles.");
          return;
        }
        setRoleOptions(
          (envelope.data ?? []).map((role) => ({ uuid: role.uuid, name: role.name, slug: role.slug })),
        );
      } catch {
        if (active) {
          setOptionsError("Failed to load roles. Please try again.");
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

  useEffect(() => {
    if (!canManageOrganization) {
      return;
    }
    let active = true;
    (async () => {
      try {
        const envelope = await getEncrypted<Organization[]>(
          `${ORGANIZATION_API_PATH}?sortProperty=name&sortDirection=asc&limit=100`,
        );
        if (!active) {
          return;
        }
        if (!envelope.success) {
          setOrganizationAvailable(false);
          setOrganizationError(envelope.message || "Failed to load organizations.");
          return;
        }
        setOrganizationOptions(
          (envelope.data ?? []).map((organization) => ({ uuid: organization.uuid, name: organization.name })),
        );
      } catch {
        if (active) {
          setOrganizationAvailable(false);
          setOrganizationError("Failed to load organizations. Please try again.");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [canManageOrganization]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || optionsLoading) {
      setError(
        isPending ? "A save is already in progress." : "Roles are still loading. Please wait.",
      );
      return;
    }
    setError("");
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const passwordRaw = String(formData.get("password") ?? "");
      const payload: Record<string, unknown> = {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone_number: String(formData.get("phone_number") ?? ""),
        status: String(formData.get("status") ?? "active"),
        role_id: roleId || null,
      };
      if (organizationAvailable && canManageOrganization) {
        payload.organization_id = organizationId || null;
      }
      if (mode === "create") {
        payload.password = passwordRaw;
      } else if (passwordRaw) {
        payload.password = passwordRaw;
      }
      if (mode === "create" && !roleId) {
        delete payload.role_id;
      }
      if (mode === "create" && !organizationId) {
        delete payload.organization_id;
      }

      const envelope =
        mode === "create"
          ? await postEncrypted<User>(API_PATH, payload)
          : await putEncrypted<User>(`${API_PATH}/${uuid}`, payload);

      if (!envelope.success) {
        setError(envelope.message || `Failed to ${mode === "create" ? "create" : "update"} user.`);
        return;
      }

      router.push(mode === "create" ? USER_LIST_PATH : `${USER_LIST_PATH}/${uuid}`);
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
          {mode === "create" ? "New user" : "Edit user"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {mode === "create" ? "Create user." : "Update user."}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <TextField
            label="Name"
            type="text"
            name="name"
            required
            minLength={2}
            defaultValue={initial?.name ?? ""}
            placeholder="e.g. Jane Doe"
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField
              label="Email"
              type="email"
              name="email"
              required
              defaultValue={initial?.email ?? ""}
              placeholder="name@company.com"
            />
            <TextField
              label="Phone"
              type="tel"
              name="phone_number"
              required
              minLength={6}
              defaultValue={initial?.phone_number ?? ""}
              placeholder="e.g. +10000000001"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField
              label={`Password${mode === "edit" ? " (empty keeps current)" : ""}`}
              type="password"
              name="password"
              required={mode === "create"}
              minLength={6}
              placeholder={mode === "create" ? "Min 6 characters" : "Leave empty to keep"}
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
          </div>

          <SelectField
            label="Role"
            name="role_id"
            value={roleId}
            onChange={(event) => setRoleId(event.target.value)}
            disabled={optionsLoading}
            placeholder={optionsLoading ? "Loading roles..." : "— No role —"}
            options={roleItems.map((option) => ({ value: option.uuid, label: option.name }))}
            hint="User role assignment is managed here through the user API."
          />

          {organizationAvailable ? (
            <AuthComponent
              user={session.user}
              permissions={session.permissions}
              allowedPermissions={[UPDATE_ORGANIZATION_PERMISSION]}
            >
            <SelectField
              label="Organization"
              name="organization_id"
              value={organizationId}
              onChange={(event) => setOrganizationId(event.target.value)}
              placeholder="— No organization —"
              options={organizationItems.map((option) => ({ value: option.uuid, label: option.name }))}
              hint="User organization assignment is managed here through the user API."
            />
            </AuthComponent>
          ) : null}

          {organizationError && canManageOrganization ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {organizationError}
            </p>
          ) : null}

          {optionsError ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {optionsError}
            </p>
          ) : null}

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
              {isPending ? "Saving..." : mode === "create" ? "Create user" : "Save changes"}
            </button>
            <Link
              href={USER_LIST_PATH}
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
