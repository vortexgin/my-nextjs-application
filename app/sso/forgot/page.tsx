import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/app/sso/components/forms/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password | VortexGin",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
