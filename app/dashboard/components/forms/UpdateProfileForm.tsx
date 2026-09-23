"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { User } from "@/app/base/models/UserModel";
import { logout } from "@/app/dashboard/components/actions";
import { putEncrypted } from "@/libraries/EncryptedFetch";
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

  const updateField = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    if (submitMessage) setSubmitMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { error, value } = updateProfileSchema.validate(form, {
      abortEarly: false,
      allowUnknown: true,
    });

    if (error) {
      const nextErrors: UpdateProfileFormErrors = {};

      for (const detail of error.details) {
        const field = detail.path[0] as keyof UpdateProfileFormState;
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
      const envelope = await putEncrypted<User>(`/base/api/v1/users/${user.uuid}`, {
        name: value.name,
        email: value.email,
        phone_number: value.phone_number,
      });

      if (!envelope.success) {
        setSubmitMessage(envelope.message || "Update failed.");
        return;
      }

      setForm({
        name: envelope.data.name,
        email: envelope.data.email,
        phone_number: envelope.data.phone_number,
      });
      setSubmitMessage("Profile changed. Signing out...");

      await logout();
    } catch {
      setSubmitMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (invalid: boolean) =>
    `w-full rounded-xl border bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:ring-4 ${invalid
      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
    }`;

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={updateField}
          placeholder="Your name"
          aria-invalid={Boolean(errors.name)}
          className={inputClass(Boolean(errors.name))}
        />
        {errors.name ? (
          <span className="mt-2 block text-sm text-red-600">{errors.name}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={updateField}
          placeholder="name@company.com"
          aria-invalid={Boolean(errors.email)}
          className={inputClass(Boolean(errors.email))}
        />
        {errors.email ? (
          <span className="mt-2 block text-sm text-red-600">{errors.email}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Phone number</span>
        <input
          type="tel"
          name="phone_number"
          value={form.phone_number}
          onChange={updateField}
          placeholder="+15550001111"
          aria-invalid={Boolean(errors.phone_number)}
          className={inputClass(Boolean(errors.phone_number))}
        />
        {errors.phone_number ? (
          <span className="mt-2 block text-sm text-red-600">{errors.phone_number}</span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-base font-medium text-white transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>

      {submitMessage ? <p className="text-sm text-slate-600">{submitMessage}</p> : null}
    </form>
  );
}
