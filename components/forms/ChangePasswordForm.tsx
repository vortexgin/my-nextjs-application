"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { LoginResult } from "@/app/sso/useCases/LoginUseCase";
import type { User } from "@/app/base/models/UserModel";
import { postEncrypted, putEncrypted } from "@/libraries/EncryptedFetch";
import { changePasswordSchema, type ChangePasswordFormState } from "@/components/forms/ChangePasswordSchema";

type ChangePasswordFormErrors = Partial<Record<keyof ChangePasswordFormState, string>>;

export function ChangePasswordForm({ user }: { user: Pick<User, "uuid" | "email"> }) {
  const [form, setForm] = useState<ChangePasswordFormState>({
    oldPassword: "",
    newPassword: "",
    repeatNewPassword: "",
  });
  const [errors, setErrors] = useState<ChangePasswordFormErrors>({});
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

    const { error, value } = changePasswordSchema.validate(form, {
      abortEarly: false,
      allowUnknown: true,
    });

    if (error) {
      const nextErrors: ChangePasswordFormErrors = {};

      for (const detail of error.details) {
        const field = detail.path[0] as keyof ChangePasswordFormState;
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
      const loginEnvelope = await postEncrypted<LoginResult>("/sso/api/v1/login", {
        email: user.email,
        password: value.oldPassword,
      });

      if (!loginEnvelope.success) {
        setErrors((current) => ({ ...current, oldPassword: "Old password is incorrect." }));
        setSubmitMessage("Old password is incorrect.");
        return;
      }

      const updateEnvelope = await putEncrypted<User>(`/base/api/v1/users/${user.uuid}`, {
        password: value.newPassword,
      });

      if (!updateEnvelope.success) {
        setSubmitMessage(updateEnvelope.message || "Update failed.");
        return;
      }

      setForm({ oldPassword: "", newPassword: "", repeatNewPassword: "" });
      setSubmitMessage("Password changed successfully.");
    } catch {
      setSubmitMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (invalid: boolean) =>
    `w-full rounded-xl border bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:ring-4 ${
      invalid
        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
        : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
    }`;

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Old password</span>
        <input
          type="password"
          name="oldPassword"
          value={form.oldPassword}
          onChange={updateField}
          placeholder="Enter current password"
          aria-invalid={Boolean(errors.oldPassword)}
          className={inputClass(Boolean(errors.oldPassword))}
        />
        {errors.oldPassword ? (
          <span className="mt-2 block text-sm text-red-600">{errors.oldPassword}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">New password</span>
        <input
          type="password"
          name="newPassword"
          value={form.newPassword}
          onChange={updateField}
          placeholder="At least 6 characters"
          aria-invalid={Boolean(errors.newPassword)}
          className={inputClass(Boolean(errors.newPassword))}
        />
        {errors.newPassword ? (
          <span className="mt-2 block text-sm text-red-600">{errors.newPassword}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Repeat new password</span>
        <input
          type="password"
          name="repeatNewPassword"
          value={form.repeatNewPassword}
          onChange={updateField}
          placeholder="Repeat new password"
          aria-invalid={Boolean(errors.repeatNewPassword)}
          className={inputClass(Boolean(errors.repeatNewPassword))}
        />
        {errors.repeatNewPassword ? (
          <span className="mt-2 block text-sm text-red-600">{errors.repeatNewPassword}</span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-base font-medium text-white transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {isSubmitting ? "Saving..." : "Change password"}
      </button>

      {submitMessage ? <p className="text-sm text-slate-600">{submitMessage}</p> : null}
    </form>
  );
}
