# Petlive Security Constitution

> **Purpose:** Threat-model and security invariants for AI-assisted review (`security scan`, `fix finding`, `verify fix`, `security diff scan`).  
> **Owner:** Victor (Designer). **Last updated:** 2026-08-30.  
> **Scope:** `apps/web/`, `contracts/`, `packages/`, Supabase/Drive integrations.

This document follows **CIA** (Confidentiality, Integrity, Availability) and **Threat Modeling** (assets → roles → trust boundary → invariants → attack surface).

---

## 1. Product context & phases

| Phase | Status | Security implication |
|-------|--------|----------------------|
| **Local-first passport** | **Live** | Pet health data lives in browser storage (localStorage / IndexedDB). Device access = full data access. |
| **Supabase Auth (Google)** | **Phase 1 (A/B)** | Authentication gate only. JWT in browser. **No pet rows in Supabase yet.** |
| **Google Drive backup** | **Optional (A/B)** | OAuth access token in `sessionStorage`. Scoped to user's Drive via `drive.file`. |
| **Supabase DB sync** | **Phase 2 (planned)** | **RLS mandatory** before any prod data. |
| **Supabase Storage (photos)** | **Phase 3 (planned)** | Per-user object policies + size limits. |
| **Stripe / Plus** | **Phase 5 (planned)** | Server-side billing; freeze/capture credits; idempotent webhooks. |

**Deployment model:** Static GitHub Pages — **no Petlive-owned backend server today**. Trust boundary for pet writes is currently **the user's device**, not our server.

---

## 2. Valuable assets (protect these)

| Asset | Where | Impact if leaked / tampered |
|-------|-------|---------------------------|
| **Pet health records** (`pets[]`, visits, meds, vaccines, labs, imaging) | localStorage / IDB | Privacy breach; wrong medical context in emergency |
| **Owner profile & contact** | localStorage | PII exposure |
| **Pet photos, lab images, Rx photos** | localStorage / IDB / future Storage | Sensitive media leak |
| **Google Drive OAuth access token** | `sessionStorage` (`petlive-google-token`) | Attacker reads/writes user's Drive backup file |
| **Supabase session JWT** | Supabase client (browser) | Session hijack until expiry |
| **Supabase anon key** | `config.public.js` (browser) | OK **only** if RLS denies cross-user access (Phase 2+) |
| **Google OAuth Client ID** | `config.public.js` (browser) | Public by design; lock redirect URIs in Google Cloud |
| **Google Client Secret** | **NEVER in repo/browser** | Full OAuth impersonation |
| **Supabase service_role key** | **NEVER in repo/browser** | Full database bypass |

---

## 3. Roles & authorization matrix

| Role | Authentication | May access |
|------|----------------|------------|
| **Anonymous visitor** | None | Intro / legal pages only (A surface) |
| **Signed-in user (Supabase)** | Google via Supabase PKCE | Passport UI; **own local** `pets[]`; optional Drive backup of **own** file |
| **Demo visitor** | `?demo=1` hatch | Read-only demo data; **must not persist writes** |
| **Device owner** | Physical access | All local data (out of app scope — warn in legal copy) |
| **Admin / service** | N/A today | No admin panel in Phase 1 |

### Auth vs authorization (Petlive-specific)

- **Phase 1:** Supabase login = **Authentication** (who enters the app). Pet data authorization = **device-local** (single user per browser profile).
- **Phase 2+:** **Authorization** must be enforced in **Supabase Postgres RLS**, not in UI alone. Assume frontend is fully compromised.

---

## 4. Trust boundary

```
[ User browser — UNTRUSTED ]
  │  DOM, localStorage, sessionStorage, URL params, DevTools
  │  All pet CRUD, demo flags, "signed in" UI state
  ▼
[ Trust boundary — MUST enforce here when backend exists ]
  │  Supabase Postgres + RLS (Phase 2+)
  │  Supabase Edge Functions / server for Stripe webhooks (Phase 5+)
  │  Rate limits, credit freeze, file size caps
  ▼
[ External services ]
  Google Drive API, Supabase Auth, (future) OpenAI/Stripe
```

### Iron rules

1. **Never** put `service_role`, Client Secret, or billing authority in browser code or `config.public.js`.
2. **Never** rely on hiding UI buttons as the only access control once data is multi-tenant in the cloud.
3. **Never** store long-lived Drive refresh tokens in `localStorage` (prefer session-scoped tokens; revoke on sign-out).
4. **Always** re-validate ownership server-side (RLS or Edge Function) before read/write of cloud pet rows.
5. **Always** treat `?demo=1`, `?fresh=1`, `?restore=1` as **debug attack surface** — must not weaken prod gates or leak secrets.

---

## 5. Security invariants (the constitution)

These must hold in **all** phases. Violations = **High** severity.

### Confidentiality

- **C1:** No user can read or export another user's cloud pet data (Phase 2+).
- **C2:** Drive backup file is readable only by the Google account that created it (`drive.file` scope).
- **C3:** Secrets (`service_role`, Client Secret, raw Drive tokens) never appear in git, chat, logs, or error toasts.
- **C4:** Legal/medical copy must not over-promise encryption we do not implement.

### Integrity

- **I1:** Demo mode (`demoBlocksWrite`) cannot be bypassed by calling domain write APIs directly from console without explicit dev-only hooks.
- **I2:** Cloud sync merge must not silently drop user edits; conflict policy must be documented and tested.
- **I3:** Billing/credits (Phase 5): balance cannot go negative; one payment notification credits **at most once** (idempotent).
- **I4:** Credit-consuming operations (future AI/API): **freeze/deduct before** calling external API (no race window).

### Availability

- **A1:** Photo/lab uploads must enforce max size and count before persisting to IDB/localStorage (avoid quota bricking).
- **A2:** Drive sync failures must not corrupt local `pets[]` (local remains source of truth Phase 1–2).
- **A3:** External CDN scripts (Supabase, GIS) load from pinned URLs; document supply-chain risk.

### Local-first (current phase)

- **L1:** Local `pets[]` remains write truth until Phase 2 migration is explicitly approved.
- **L2:** Sign-out clears Supabase session and Drive token from sessionStorage; does not delete local pets without explicit user action.
- **L3:** IndexedDB migration must not overwrite non-empty IDB with empty localStorage (see `core/storage.js` policy).

---

## 6. Attack surface checklist

| Surface | Risk | Mitigation |
|---------|------|------------|
| URL params (`demo`, `fresh`, `restore`, `app`) | Gate bypass, data wipe | Document; keep out of prod UX; test gate paths |
| User-generated text (pet names, notes, med labels) | XSS if rendered unsafely | Prefer `textContent`; sanitize if `innerHTML` unavoidable |
| Photo / lab file pickers | Storage exhaustion, malicious files | Size/type limits; strip EXIF if sharing later |
| `sessionStorage` Drive token | XSS theft | Minimize token lifetime; revoke on sign-out; CSP when hosting allows |
| `config.public.js` | Key scraping | Anon key OK with RLS; never add service_role |
| GitHub Pages static host | No server rate limit | Client-side debounce; future Edge rate limits for API phases |
| Third-party CDNs | Supply chain | Pin versions; monitor Subresource Integrity where feasible |

---

## 7. Phase 2+ requirements (pre-ship gate)

Before enabling Supabase pet sync in production:

- [ ] **RLS enabled** on every user-data table (`auth.uid() = owner_id` or equivalent).
- [ ] Policies tested with **two test users** — user A cannot `select/insert/update/delete` user B's rows.
- [ ] **No** direct table access from browser except via anon key + RLS.
- [ ] Migrations reviewed; no wide-open `public` grants.
- [ ] Backup/export path documented for users (legal already mentions multi-source backup).

Before enabling paid features:

- [ ] Credit check + **atomic freeze** in server/Edge/DB transaction.
- [ ] Stripe webhooks verified with signing secret (server-only).
- [ ] Rate limits on expensive endpoints.

---

## 8. AI security review protocol

When asked to scan this repo:

1. Read this file first.
2. Map findings to **C/I/A** and invariant IDs (e.g. `C1`, `I4`).
3. Severity: **High** = exploitable cross-user leak, secret exposure, billing bypass, or data loss; **Medium** = missing defense-in-depth; **Low** = hardening.
4. For **High**: propose fix + `verify fix` attack replay.
5. On feature PRs: run **security diff scan** on touched auth/sync/storage paths.

### High-risk patterns to flag immediately

- `service_role` or `Client Secret` in client bundle
- Supabase queries without RLS (Phase 2+)
- `innerHTML` with unsanitized user/pet fields
- Drive token in `localStorage`
- Deduct-after-async for paid API calls (race condition)
- Authorization checks only in `app.js` / shell with no backend mirror

---

## 9. Related project rules

- `.cursor/rules/config-secrets-privacy.mdc` — never read/echo `config.public.js` in AI chat
- `.cursor/rules/security-constitution.mdc` — agent enforcement summary
- `legal/zh-TW/privacy-policy*.md` — user-facing data handling promises (keep in sync)
