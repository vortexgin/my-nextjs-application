"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import type { LoginResult } from "@/app/sso/useCases/LoginUseCase";
import { postEncrypted } from "@/libraries/EncryptedFetch";
import { signInSchema, type SignInFormState } from "@/components/forms/SignInSchema";

type SignInFormErrors = Partial<Record<keyof SignInFormState, string>>;

export function SignInForm() {
  const router = useRouter();
  const [form, setForm] = useState<SignInFormState>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<SignInFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const updateField = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    if (submitMessage) setSubmitMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { error, value } = signInSchema.validate(form, {
      abortEarly: false,
      allowUnknown: true,
    });

    if (error) {
      const nextErrors: SignInFormErrors = {};

      for (const detail of error.details) {
        const field = detail.path[0] as keyof SignInFormState;
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
      const envelope = await postEncrypted<LoginResult>("/sso/api/v1/login", {
        email: value.email,
        password: value.password,
        rememberMe,
      });

      if (!envelope.success) {
        setSubmitMessage(envelope.message || "Sign in failed.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setSubmitMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-white p-6 sm:p-8 lg:p-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
              Welcome back
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Sign in
            </h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-200">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M7 10.5V8a5 5 0 0 1 10 0v2.5M6.5 10.5h11A1.5 1.5 0 0 1 19 12v6.5A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5V12a1.5 1.5 0 0 1 1.5-1.5Z" />
            </svg>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              placeholder="name@company.com"
              aria-invalid={Boolean(errors.email)}
              className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:ring-4 ${errors.email
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                }`}
            />
            {errors.email ? (
              <span className="mt-2 block text-sm text-red-600">{errors.email}</span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              placeholder="Enter your password"
              aria-invalid={Boolean(errors.password)}
              className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:ring-4 ${errors.password
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                }`}
            />
            {errors.password ? (
              <span className="mt-2 block text-sm text-red-600">{errors.password}</span>
            ) : null}
          </label>

          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Keep me signed in
            </label>
            <Link href="/sso/forgot" className="font-medium text-blue-600 transition hover:text-blue-500">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-base font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          {submitMessage ? <p className="text-sm text-slate-600">{submitMessage}</p> : null}
        </form>

        <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
          <div className="h-px flex-1 bg-slate-200" />
          <span>or continue with</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M21.6 12.23c0-.73-.07-1.43-.22-2.1H12v3.97h5.39a4.61 4.61 0 0 1-2 3.02v2.5h3.23c1.9-1.75 2.98-4.34 2.98-7.39Z" fill="#4285F4" />
              <path d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.23-2.5c-.9.6-2.06.94-3.38.94-2.6 0-4.8-1.76-5.59-4.13H.8v2.61A10 10 0 0 0 12 22Z" fill="#34A853" />
              <path d="M6.41 17.75A6 6 0 0 1 6 15v-2.61H2.76A10 10 0 0 0 2 12c0 1.64.39 3.2 1.08 4.57l3.33-2.82Z" fill="#FBBC05" />
              <path d="M12 3.98c1.47 0 2.79.5 3.83 1.49l2.87-2.87A9.92 9.92 0 0 0 12 2a10 10 0 0 0-9.2 5.5l3.64 2.82A5.98 5.98 0 0 1 12 3.98Z" fill="#EA4335" />
            </svg>
            Google
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M13.5 3.5c0 1.2-.7 2-1.9 2.9-.8.6-1.5 1.1-1.5 2.1v.5h2.5v.5c0 2-1.1 3.3-3.4 4.4l-.2.1-.4-.8c1.6-.9 2.5-1.8 2.5-3.1v-.4H8v-.8c0-1.7 1.2-2.9 2.9-3.8.7-.4 1.3-.8 1.3-1.6 0-.9-.7-1.5-1.7-1.5-1.1 0-1.9.6-2.2 1.4l-.8-.4c.5-1.3 1.8-2.2 3.7-2.2 2.1 0 3.5 1.3 3.5 3.1Zm-2.7 14.1c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2Z" />
            </svg>
            SSO
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Need an account? <a href="mailto:vortexgin@gmail.com" className="font-medium text-blue-600 hover:text-blue-500">Request access</a>
        </p>
      </div>
    </div>
  );
}
