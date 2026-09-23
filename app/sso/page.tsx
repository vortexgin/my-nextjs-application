import type { Metadata } from "next";
import { SignInForm } from "@/app/sso/components/forms/SignInForm";

export const metadata: Metadata = {
  title: "Sign in | VortexGin",
};

export default function SSOPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm lg:grid-cols-[1.08fr_0.92fr]">
          <div className="hidden flex-col justify-between bg-slate-950 p-10 text-white lg:flex">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-lg font-semibold text-blue-300 ring-1 ring-inset ring-blue-400/30">
                  V
                </div>
                <span className="text-xl font-semibold tracking-tight">VortexGin</span>
              </div>

              <div className="space-y-5">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-300">
                  Secure access
                </p>
                <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-white">
                  Manage your workspace with confidence.
                </h1>
                <p className="max-w-md text-base leading-7 text-slate-300">
                  Centralize collaboration, protect your data, and move faster with one trusted login experience.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {[
                "Single sign-on for your entire team",
                "Granular access controls and audit trails",
                "Reliable performance across every workspace",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-blue-200">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <SignInForm />
        </div>
      </div>
    </main>
  );
}
