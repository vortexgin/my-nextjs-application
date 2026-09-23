"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export type AuthComponentProps = {
  user: unknown;
  permissions?: string[] | null;
  allowedPermissions?: string[] | null;
  redirect?: string;
  children: ReactNode;
};

/**
 * Grants access when user exists and at least one allowed permission
 * is present in permissions. Empty allowedPermissions means open.
 */
export function hasPermission(
  user: unknown,
  permissions?: string[] | null,
  allowedPermissions?: string[] | null,
): boolean {
  if (!user) {
    return false;
  }

  const required = allowedPermissions ?? [];
  if (required.length === 0) {
    return true;
  }

  const granted = permissions ?? [];
  return required.some((permission) => granted.includes(permission));
}

/**
 * Renders children only when permission check passes.
 * Returns null on denial, or navigates to `redirect` when set.
 */
export function AuthComponent({ user, permissions, allowedPermissions, redirect, children }: AuthComponentProps) {
  const router = useRouter();
  const granted = hasPermission(user, permissions, allowedPermissions);

  useEffect(() => {
    if (!granted && redirect) {
      router.replace(redirect);
    }
  }, [granted, redirect, router]);

  if (!granted) {
    return null;
  }

  return <>{children}</>;
}
