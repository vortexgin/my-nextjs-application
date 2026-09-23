"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { hasPermission } from "@/libraries/Permissions";

export { hasPermission };

export type AuthComponentProps = {
  user: unknown;
  permissions?: string[] | null;
  allowedPermissions?: string[] | null;
  roleSlug?: string | null;
  redirect?: string;
  accessDeniedComponent?: ReactNode;
  children: ReactNode;
};

/**
 * Renders children only when permission check passes.
 * Returns null on denial, or navigates to `redirect` when set.
 */
export function AuthComponent({ user, permissions, allowedPermissions, roleSlug, redirect, accessDeniedComponent, children }: AuthComponentProps) {
  const router = useRouter();
  const granted = hasPermission(user, permissions, allowedPermissions, roleSlug);

  useEffect(() => {
    if (!granted && redirect) {
      router.replace(redirect);
    }
  }, [granted, redirect, router]);

  if (!granted) {
    return accessDeniedComponent ?? null;
  }

  return <>{children}</>;
}
