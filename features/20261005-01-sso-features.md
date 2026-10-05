# SSO Module — Features Description

> Module: `app/sso` · Tables: `sso_sessions`, `sso_password_resets` (+ `base_users` for identity)
> Stack: Next.js 16 App Router · React 19 · Sequelize 6 + Postgres · Joi · `withEncryption` + `EncryptedFetch` · Mailgun
> Conventions: `export const runtime = "nodejs"` on every API route, `ok()`/`fail()` envelopes, `BaseUseCase` (Joi in `preExec`, `recordActivityLog` in `postExec`), auth forms keep `noValidate` (Joi is authority, no `allowUnknown`).

## Overview

Central login, session, and password-recovery for the whole workspace. All other modules depend on it via `libraries/Auth` (`getSession`, `requireSession`, `actorFromRequest`, `getSessionFromRequest`) and `libraries/Permissions` (`hasPermission` against the permissions snapshot stored at login).

Session permissions are snapshotted at login — after changing grants/seeds, re-login before probing; otherwise 403s mask as client errors.

## Feature map

| # | Feature | Route / Page | UseCase | Auth |
|---|---------|--------------|---------|------|
| F-01 | Sign in (email + password + remember-me) | `POST /sso/api/v1/login` + `app/sso/page.tsx` | `LoginUseCase` | public, `withEncryption` |
| F-02 | Session inspect (who-am-I) | `GET /sso/api/v1/session` | `libraries/Auth.getSession` | `withEncryption`, cookie required |
| F-03 | Forgot password (request reset link) | `POST /sso/api/v1/forgot-password` + `app/sso/forgot/page.tsx` | `ForgotPasswordUseCase` | public, `withEncryption` |
| F-04 | Reset password via token link | `POST /sso/api/v1/update-password` + `app/sso/update-password/page.tsx` | `UpdatePasswordUseCase` | public (token bearer), `withEncryption` |
| F-05 | Logout (soft-delete session) | `LogoutUseCase` only — no HTTP route wired | `LogoutUseCase` | n/a (dead code today) |
| F-06 | Session guards for all modules | `requireSession()` + `AuthComponent` + `AccessDenied` | `libraries/Auth` | server pages + API `actorFromRequest` |

Social buttons (Google / SSO) in `SignInForm.tsx` are UI placeholders — no handler wired.

---

### F-01 Sign in

As a user with an active account, I sign in with email + password so I get a 24h session cookie and land on `/dashboard`.

Flow:
1. `SignInForm` validates client-side with `signInSchema` (email, password min 8), `noValidate` on `<form>`, field errors via `TextField error` prop, submit feedback via `role="status"`/`role="alert"`, button `disabled` while submitting.
2. `postEncrypted("/sso/api/v1/login", {email, password, rememberMe})` → JSON `{iv,data}` envelope (`x-key-exchange` handshake; `x-app-verbose:1` bypass for debugging).
3. `LoginUseCase.preExec`: Joi `email trim+email required, password required, rememberMe boolean default false`. Lookup `base_users where {email: lowercased, deleted_at:null}`. Compare `sha256(password).hex`. Reject unless row exists + `status==="active"` + hash match → `NotAuthorizedException("Invalid email or password.")` (401, generic on purpose).
4. `execute`: `UserModel.toApi()` + `UserModel.resolvePermissions(uuid)` snapshot → `sso_sessions.create({uuid: randomUUID, expired_at: now+24h, user_info, permissions, status:"active"})`. Returns `{token: session.uuid, expired_at, user}`.
5. `postExec`: `recordActivityLog({actor: user, operation:"create", entity:"session", entity_uuid: token})` fire-and-forget.
6. Route sets `httpOnly` cookie `sessionToken=token` (`sameSite:lax, path:/, secure in prod`; `maxAge: 24h` only when `rememberMe`, otherwise session cookie).

Files: `useCases/LoginUseCase.ts` (`SESSION_TTL_HOURS=24`), `api/[version]/login/route.ts` (`withEncryption(handlePost)`), `models/SessionModel.ts` (`sso_sessions`), `components/forms/SignInForm.tsx` + `SignInSchema.ts`.

### F-02 Session inspect

As a client, I fetch my live session (user + permissions + expiry) to gate UI (`hasPermission`, sidebar menus by `base:menu:*`).

- `GET /sso/api/v1/session` → `withEncryption(handleGet)` → `getSession()` (cookie `sessionToken`) → `getSessionByToken`: `findOne where {uuid, status:"active", deleted_at:null, expired_at > NOW()}`. Missing/expired/logged-out → `NotAuthorizedException("Not authenticated.")` 401.
- Returns `ok({user, permissions, expired_at})`. No Joi (no input). No activity log (read-only).
- Request-level variant `getSessionFromRequest(request)`: cookie first, `Authorization: Bearer <token>` fallback. `actorFromRequest()` unwraps `session.user` for all `withAuthorization` API routes.

Files: `api/[version]/session/route.ts`, `libraries/Auth.ts`, `models/SessionModel.ts` (`SESSION_COOKIE="sessionToken"`).

### F-03 Forgot password

As a user who forgot their password, I request a reset link so I can set a new one without knowing the old.

- Page `app/sso/forgot/page.tsx` → `ForgotPasswordForm` (Joi email, same `noValidate` + `TextField` kit pattern as sign-in).
- `POST /sso/api/v1/forgot-password` (`withEncryption`): Joi `{email trim+email required}`. Lookup active user; inactive/missing → `NotFoundException("User not found.")` 404.
- `execute`: invalidate prior unused resets (`destroy where {user_id, used_at:null}`), `rawToken=randomBytes(32).hex`, store `sha256(rawToken)` in `sso_password_resets {user_id, email, token_hash unique, expires_at: now+60m, used_at:null}`. Send Mailgun link `${APP_URL}/sso/update-password?token=${rawToken}` via `sendPasswordResetEmail`. Missing `MAILGUN_*` → skip send, log link server-side (dev fallback). Always returns generic `{message:"If an account exists..."}` on success path (user-enumeration note: missing-user 404 currently leaks existence — see Known gaps).
- `postExec`: `recordActivityLog({operation:"create", entity:"password_reset"})`.

Files: `useCases/ForgotPasswordUseCase.ts` (`RESET_LINK_TTL_MINUTES=60`), `api/[version]/forgot-password/route.ts`, `models/PasswordResetModel.ts`, `libraries/mail.ts`.

Env: `MAILGUN_API_KEY / MAILGUN_DOMAIN / MAILGUN_FROM`, `APP_URL` (`appBaseUrl()`).

### F-04 Reset password via token

As a user with a valid reset link (<60m, unused), I set a new password (min 6) so I can sign in again.

- Page `app/sso/update-password/page.tsx` (`searchParams.token`) → `UpdatePasswordForm` (dashboard components folder — shared form).
- `POST /sso/api/v1/update-password`: Joi `{token trim min1 required, password min6 required}`. `preExec`: `findOne sso_password_resets where {token_hash: sha256(token), used_at:null}`; missing or `expires_at <= now` → `BadParameterException("Invalid or expired reset link.")` 400.
- `execute`: load `base_users {uuid: reset.user_id, deleted_at:null}` → 404 if gone; `update {password: sha256(new), updated_at: now}`; mark reset `used_at: now` (single-use).
- `postExec`: `recordActivityLog({operation:"update", entity:"password", origin: beforeUser})`. Note: does not revoke existing `sso_sessions` — old sessions stay valid until expiry (see Gaps).

Files: `useCases/UpdatePasswordUseCase.ts`, `api/[version]/update-password/route.ts`.

### F-05 Logout

`LogoutUseCase` validates `{token uuidv4 optional}` and soft-deletes (`status:"deleted", deleted_at: now where {uuid, deleted_at:null}`), returns `{message}`. No activity log. **Not wired to any `api/.../route.ts`** — clients today expire naturally (24h) or are invalidated server-side. Wire-up is a one-route follow-up if needed.

### F-06 Guards used by every module

- Pages: `await requireSession()` (redirects to `/sso` when null) → `hasPermission(user, permissions, [...codes])` → `AuthComponent` / `AccessDenied`.
- APIs: `withAuthorization(handler, [...codes])` (401/403 plaintext `fail()` by design, passed through by `EncryptedFetch.unwrapResponse`) + `await actorFromRequest(request)` for `organization_id` / audit actor. `withEncryption` only passes JSON `{iv,data}` — no multipart bodies.

## Validation / error contract

- Client Joi schemas declare every validated key (`SignInSchema`, `ForgotPasswordSchema`, `ChangePasswordSchema`); server Joi mirrors in each `*UseCase` (`abortEarly:false` → joined message → `BadParameterException` 400 via `getErrorStatus`).
- `NotAuthorizedException` → 401 (login bad creds, session missing). `NotFoundException` → 404. `BadParameterException` → 400.
- Passwords: `sha256` hex (no salt/pepper/bcrypt — see Gaps). Comparison is generic-message to avoid user enumeration on login; forgot-password 404 currently does enumerate.

## Data

- `sso_sessions {uuid pk, expired_at, created_at default NOW, user_info JSONB (User.toApi snapshot), permissions TEXT[], status enum active|inactive|deleted default active, deleted_at}` — `timestamps:false, underscored:true`.
- `sso_password_resets {uuid pk, user_id FK users.uuid CASCADE, email, token_hash unique, expires_at, used_at null, created_at}` + `belongsTo User as user`.

## Known gaps (not bugs to fix here)

1. No logout route wired (F-05 dead code).
2. `sha256` unsalted password hash; no pepper/bcrypt/argon2.
3. Reset does not revoke live sessions; no "change password → logout everywhere".
4. Forgot-password 404 leaks account existence (login path does not).
5. No rate-limit / lockout on login or forgot-password.
6. Google/SSO buttons are placeholders.
7. `rememberMe` only extends cookie `maxAge`; server TTL stays 24h regardless.
