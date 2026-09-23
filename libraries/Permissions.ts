/**
 * Shared access check used by both client views (AuthComponent)
 * and server APIs (withAuthorization). Same rule as checkAccess.
 *
 * Grants when a user exists and:
 * - no permissions required (open), or
 * - "authorized" required (any live session), or
 * - at least one required entry matches the role slug or
 *   overlaps the granted session permissions.
 *
 * Role slug comes from the explicit argument, falling back to
 * `user.role.slug` when the user is an object carrying it.
 */
export function hasPermission(
  user: unknown,
  permissions?: string[] | null,
  allowedPermissions?: string[] | null,
  roleSlug?: string | null,
): boolean {
  if (!user) {
    return false;
  }

  const required = allowedPermissions ?? [];
  if (required.length === 0 || required.includes("authorized")) {
    return true;
  }

  const slug = roleSlug ?? roleSlugOf(user);
  const granted = permissions ?? [];
  return required.some((permission) => permission === slug || granted.includes(permission));
}

function roleSlugOf(user: unknown): string | null {
  const role = (user as { role?: { slug?: unknown } } | null | undefined)?.role;
  return typeof role?.slug === "string" ? role.slug : null;
}
