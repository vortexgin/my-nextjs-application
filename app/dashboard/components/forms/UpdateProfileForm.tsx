"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { User } from "@/app/base/models/UserModel";
import { logout } from "@/app/dashboard/components/actions";
import { putEncrypted } from "@/libraries/EncryptedFetch";
import { TextField } from "@/components/FormField";
import { updateProfileSchema, type UpdateProfileFormState } from "@/app/dashboard/components/forms/UpdateProfileSchema";

type UpdateProfileFormErrors = Partial<Record<keyof UpdateProfileFormState, string>>;

export function UpdateProfileForm({ user }: { user: Pick<User, "uuid" | "name" | "email" | "phone_number"> }) {
  const [form, setForm] = useState<UpdateProfileFormState>({
    name: user.name ?? "",
    email: user.email ?? "",
    phone_number: user.phone_number ?? "",
  });
  const [errors, setErrors] = useState<UpdateProfileFormErrors>({});
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

    // Every validated key (name, email, phone_number) is declared in updateProfileSchema.
    const { error, value } = updateProfileSchema.validate(form, {
      abortEarly: false,
    });

    if (error) {
      const nextErrors: UpdateProfileFormErrors = {};

      for (const detail of error.details) {
        const field = detail.path[0] as keyof UpdateProfileFormState;
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
      const envelope = await putEncrypted<User>(`/base/api/v1/users/${user.uuid}`, {
        name: value.name,
        email: value.email,
        phone_number: value.phone_number,
      });

      if (!envelope.success) {
        setSubmitMessage(envelope.message || "Update failed.");
        setSubmitKind("error");
        return;
      }

      // envelope.data is typed non-nullable but arrives null on some failure paths.
      const updated = envelope.data;
      if (updated) {
        setForm({
          name: updated.name,
          email: updated.email,
          phone_number: updated.phone_number,
        });
      }
      setSubmitMessage("Profile changed. Signing out...");
      setSubmitKind("success");

      await logout();
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
          label="Name"
          type="text"
          name="name"
          value={form.name}
          onChange={updateField}
          placeholder="Your name"
          error={errors.name}
          className={
            errors.name
              ? "w-full rounded-xl border border-red-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100"
              : undefined
          }
        />
      </div>

      <div>
        <TextField
          label="Email address"
          type="email"
          name="email"
          value={form.email}
          onChange={updateField}
          placeholder="name@company.com"
          error={errors.email}
          className={
            errors.email
              ? "w-full rounded-xl border border-red-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100"
              : undefined
          }
        />
      </div>

      <div>
        <TextField
          label="Phone number"
          type="tel"
          name="phone_number"
          value={form.phone_number}
          onChange={updateField}
          placeholder="+15550001111"
          error={errors.phone_number}
          className={
            errors.phone_number
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
        {isSubmitting ? "Saving..." : "Save changes"}
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
