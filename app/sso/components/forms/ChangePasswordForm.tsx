"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { LoginResult } from "@/app/sso/useCases/LoginUseCase";
import type { User } from "@/app/base/models/UserModel";
import { postEncrypted, putEncrypted } from "@/libraries/EncryptedFetch";
import { TextField } from "@/components/FormField";
import { changePasswordSchema, type ChangePasswordFormState } from "@/app/sso/components/forms/ChangePasswordSchema";

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
  const [submitKind, setSubmitKind] = useState<"success" | "error" | null>(null);

  const updateField = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    if (submitMessage) setSubmitMessage("");
    if (submitKind) setSubmitKind(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Every validated key (old/new/repeat password) is declared in changePasswordSchema.
    const { error, value } = changePasswordSchema.validate(form, {
      abortEarly: false,
    });

    if (error) {
      const nextErrors: ChangePasswordFormErrors = {};

      for (const detail of error.details) {
        const field = detail.path[0] as keyof ChangePasswordFormState;
        nextErrors[field] = detail.message;
      }

      setErrors(nextErrors);
      setSubmitMessage("Please correct the highlighted fields.");
      setSubmitKind("error");
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmitMessage("");
    setSubmitKind(null);

    try {
      // No side-effect-free password-verify endpoint exists: the update use
      // case accepts a new password without checking the old one, so the old
      // password is verified via a login attempt. Tradeoff: each wrong guess
      // mints a session row + activity-log entry and rotates the session
      // cookie on success. A dedicated verify endpoint would remove that noise.
      const loginEnvelope = await postEncrypted<LoginResult>("/sso/api/v1/login", {
        email: user.email,
        password: value.oldPassword,
      });

      if (!loginEnvelope.success) {
        setErrors((current) => ({ ...current, oldPassword: "Old password is incorrect." }));
        setSubmitMessage("Old password is incorrect.");
        setSubmitKind("error");
        return;
      }

      const updateEnvelope = await putEncrypted<User>(`/base/api/v1/users/${user.uuid}`, {
        password: value.newPassword,
      });

      if (!updateEnvelope.success) {
        setSubmitMessage(updateEnvelope.message || "Update failed.");
        setSubmitKind("error");
        return;
      }

      setForm({ oldPassword: "", newPassword: "", repeatNewPassword: "" });
      setSubmitMessage("Password changed successfully.");
      setSubmitKind("success");
    } catch {
      setSubmitMessage("Something went wrong. Please try again.");
      setSubmitKind("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <TextField
          label="Old password"
          type="password"
          name="oldPassword"
          value={form.oldPassword}
          onChange={updateField}
          placeholder="Enter current password"
          error={errors.oldPassword}
          className={
            errors.oldPassword
              ? "w-full rounded-xl border border-red-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100"
              : undefined
          }
        />
      </div>

      <div>
        <TextField
          label="New password"
          type="password"
          name="newPassword"
          value={form.newPassword}
          onChange={updateField}
          placeholder="At least 6 characters"
          error={errors.newPassword}
          className={
            errors.newPassword
              ? "w-full rounded-xl border border-red-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100"
              : undefined
          }
        />
      </div>

      <div>
        <TextField
          label="Repeat new password"
          type="password"
          name="repeatNewPassword"
          value={form.repeatNewPassword}
          onChange={updateField}
          placeholder="Repeat new password"
          error={errors.repeatNewPassword}
          className={
            errors.repeatNewPassword
              ? "w-full rounded-xl border border-red-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100"
              : undefined
          }
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-base font-medium text-white transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {isSubmitting ? "Saving..." : "Change password"}
      </button>

      {submitMessage ? (
        <p
          role={submitKind === "success" ? "status" : "alert"}
          className={submitKind === "success" ? "text-sm text-green-700" : "text-sm text-red-600"}
        >
          {submitMessage}
        </p>
      ) : null}
    </form>
  );
}
