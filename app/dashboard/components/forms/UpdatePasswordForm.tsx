"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { postEncrypted } from "@/libraries/EncryptedFetch";
import { updatePasswordSchema, type UpdatePasswordFormState } from "@/app/dashboard/components/forms/UpdatePasswordSchema";

type UpdatePasswordFormErrors = Partial<Record<keyof UpdatePasswordFormState, string>>;

export function UpdatePasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [form, setForm] = useState<UpdatePasswordFormState>({
    password: "",
    passwordConfirmation: "",
  });
  const [errors, setErrors] = useState<UpdatePasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const updateField = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    if (submitMessage) setSubmitMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { error, value } = updatePasswordSchema.validate(form, {
      abortEarly: false,
      allowUnknown: true,
    });

    if (error) {
      const nextErrors: UpdatePasswordFormErrors = {};

      for (const detail of error.details) {
        const field = detail.path[0] as keyof UpdatePasswordFormState;
        nextErrors[field] = detail.message;
      }

      setErrors(nextErrors);
      setSubmitMessage("Please correct the highlighted fields.");
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const envelope = await postEncrypted<{ message: string }>("/sso/api/v1/update-password", {
        token,
        password: value.password,
      });

      if (!envelope.success) {
        setSubmitMessage(envelope.message || "Reset link invalid or expired.");
        return;
      }

      setSubmitMessage("Password updated. Redirecting to sign in...");
      window.setTimeout(() => router.push("/sso"), 1200);
    } catch {
      setSubmitMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8 lg:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Reset link invalid
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          This link misses its token. Request a new reset link and try again.
        </p>
        <Link
          href="/sso/forgot"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-base font-medium text-white transition hover:bg-blue-500"
        >
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8 lg:p-10">
      <Link
        href="/sso"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <span aria-hidden="true">←</span>
        Back to sign in
      </Link>

      <div className="mt-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-200">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M7 11V8a5 5 0 1 1 10 0v3M6.5 11h11A1.5 1.5 0 0 1 19 12.5v6A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-6A1.5 1.5 0 0 1 6.5 11Z" />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
          Set new password
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Choose a new password for your account. You return to sign in after saving.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">New password</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={updateField}
            placeholder="At least 6 characters"
            aria-invalid={Boolean(errors.password)}
            className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:ring-4 ${
              errors.password
                ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />
          {errors.password ? (
            <span className="mt-2 block text-sm text-red-600">{errors.password}</span>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Confirm new password</span>
          <input
            type="password"
            name="passwordConfirmation"
            value={form.passwordConfirmation}
            onChange={updateField}
            placeholder="Repeat new password"
            aria-invalid={Boolean(errors.passwordConfirmation)}
            className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:ring-4 ${
              errors.passwordConfirmation
                ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />
          {errors.passwordConfirmation ? (
            <span className="mt-2 block text-sm text-red-600">{errors.passwordConfirmation}</span>
          ) : null}
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-base font-medium text-white transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? "Saving..." : "Save new password"}
        </button>

        {submitMessage ? <p className="text-sm text-slate-600">{submitMessage}</p> : null}
      </form>
    </div>
  );
}
