import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/app/dashboard/components/forms/UpdatePasswordForm";

export const metadata: Metadata = {
  title: "Set new password | VortexGin",
};

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <UpdatePasswordForm token={token ?? ""} />
      </div>
    </main>
  );
}
