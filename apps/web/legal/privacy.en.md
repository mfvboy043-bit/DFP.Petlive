# Dragon Fruit Passport｜Privacy Policy

**Operator / Service name:** Dragon Fruit Passport (火龍果護照)  
**Contact:** mfvboy043@gmail.com  
**Last updated:** 3 September 2026  
**Version:** Draft v1.3 (2026-09-03: 18+ age posture; four-language draft; pending licensed counsel review)

---

## Introduction

Welcome to Dragon Fruit Passport (the "**Service**" or "**we**").

By using the Service, signing in with Google, or enabling cloud backup, you acknowledge that you have read, understood, and agree to this Privacy Policy. If you disagree with any part of this Policy, do not use features that require sign-in or cloud backup.

This Policy explains how we collect, use, store, share, and protect personal data. Medical disclaimers and general terms of use are in the *[Medical Disclaimer & Terms](./terms.html?v=20260903-legal-v13&lang=en)*.

> **Important:** The Service is **not** an electronic health record (EHR/EMR). Pet health records are entered and kept by you for personal reference and visit memory only.

---

## 1. Scope

1. This Policy applies when you use the Service through our web pages, mobile browsers, or other interfaces we provide.
2. This Policy does **not** apply to third-party services (such as Google or Supabase) and their own privacy policies. When you use those services, their terms also apply. See:
   - [Google Privacy Policy](https://policies.google.com/privacy)
   - [Supabase Privacy Policy](https://supabase.com/privacy)
3. If a demo / read-only mode is offered (for example `?demo=1`), data handling in that mode follows the then-current product description.

---

## 2. What personal data we collect

We process data under a **minimum necessary** principle for the features you use. Exact items depend on the features you use and what you enter, upload, or authorize.

### 2.1 Account and sign-in data (Phase 1 enabled)

| Category | Source | Purpose | Storage |
|---|---|---|---|
| Email | Google OAuth (via Supabase Auth) | Account identification, sign-in | Supabase Auth |
| Display name, avatar URL | Google public profile | Account UI | Supabase Auth / browser session |
| Session identifiers | Supabase Auth | Keep you signed in | Browser local storage and Supabase Auth |
| Internal user ID | Supabase Auth | Account identity and future cloud features | Supabase Auth |

**Phase 1 note:** Supabase is used only for **authentication (Google sign-in)**. Your pet health records are **not** uploaded to a Supabase database by default.

### 2.2 Pet health and owner contact data (you provide)

Content you enter or upload may include, without limitation:

- Pet basics (nickname, breed, species, sex, neuter status, birthday, microchip, weight, etc.)
- Visit, medication, vaccine, parasite, lab, and imaging records
- Owner-entered medical alerts, allergies, and chronic conditions
- Owner name, phone, email, emergency contacts, address (if you enter them)
- Photos, medicine labels, prescriptions, reports, or image files (if any)

> **Note:** Such data may include **health-related information** and data that **indirectly identifies** a natural person. It is owner-entered, **not** an official clinic medical record. Under Taiwan's Personal Data Protection Act, some content may be treated as **sensitive personal data**; we process it only as needed for the features you use after agreeing to this Policy.

### 2.3 On-device storage (primary Phase 1 store)

For speed and offline use, pet records are **primarily stored on your browser/device** (for example localStorage, IndexedDB).

On-device data is managed by your device and browser settings. We cannot remotely delete data that exists only on your device without your action.

### 2.4 Cloud backup data

#### (A) Google Drive backup (available; separate authorization)

| Location | Content | Controller | Condition |
|---|---|---|---|
| **Your Google Drive** | Passport backup files (e.g. JSON) | **You** (Google account holder) | You separately grant Google Drive permission in the app |

Google sign-in (Supabase Auth) does **not** automatically enable Google Drive backup; they are **separate authorizations**.

#### (B) Supabase database sync (Phase 2; planned; not live)

| Location | Content | Status |
|---|---|---|
| **Supabase cloud database** | Backup copy tied to your sign-in | **Planned**; this Policy will be updated and announced before launch |

**Feature stages (as of 2026-08):**

| Stage | Feature | Status |
|---|---|---|
| Phase 1 | Supabase Auth (Google sign-in) | **Enabled** |
| Phase 1 | On-device pet data | **Enabled** |
| Phase 1 | Google Drive backup (separate auth) | **Available** |
| Phase 2 | Supabase database sync | **Planned** |

### 2.5 Technical and log data

Where necessary, we or providers may process:

- Device type, OS, browser type and version
- Language preference and UI settings
- Sync timestamps, version numbers, error logs (debug/ops)
- Source IP (if Auth/CDN logs it)

We do **not** collect usage behavior to build marketing profiles or serve targeted ads.

---

## 3. Period, region, recipients, and purposes

(This section follows common disclosure patterns under Article 8 of Taiwan's Personal Data Protection Act.)

### 3.1 Legal bases and consent

We process personal data on one or more of:

1. **Your consent** (e.g. sign-in, Google Drive backup, future Phase 2 sync)
2. **Performance of the service you request** (sign-in, display and back up data you enter)
3. **Legal compliance** (respond to lawful authority requests where applicable)
4. **Service security and rights** (authentication, abuse prevention, debugging, as reasonably necessary)

Where law requires **separate consent** for specific data (e.g. sensitive personal data), we will obtain it via checkbox, dialog, or other clear means before enabling the feature.

**If you refuse or withdraw consent:** you may be unable to use sign-in, cloud backup, or restore-on-new-device features; availability of on-device or demo features follows the then-current product design.

### 3.2 Retention

| Category | Period |
|---|---|
| Sign-in data (Supabase Auth) | Until you delete the account, withdraw consent, or we stop the Service |
| Pet health records (on-device) | Managed/cleared by you in the browser or device |
| Google Drive backup | Until you delete the files in your Google account |
| Supabase cloud copy (from Phase 2) | Until you delete data, turn off sync and complete deletion, or the Service ends |
| Technical logs | Reasonable ops period, then delete or anonymize |

### 3.3 Region and cross-border transfers

Your data may be **transferred and stored across borders** because of cloud providers, including countries/regions where Google or Supabase servers operate (for example the United States, Singapore, Japan — depending on provider configuration).

Under Article 21 of Taiwan's Personal Data Protection Act and related rules, when personal data is transferred outside the ROC we will:

- Disclose overseas recipients and transfer purposes in this Policy
- Require providers to use reasonable technical and organizational safeguards
- Obtain your consent or rely on other lawful transfer conditions when required

### 3.4 Recipients (third-party providers)

| Recipient | Service | Data that may be accessed | Status |
|---|---|---|---|
| **Google LLC** | Google OAuth; Google Drive API (if you authorize) | Account identifiers; backup files in your Drive | In use |
| **Supabase, Inc.** | Auth (Phase 1); database (Phase 2 if enabled) | Sign-in identifiers; from Phase 2, possible passport backups | Auth in use; DB planned |
| **GitHub, Inc.** (GitHub Pages) | Static hosting | Does **not** store your health-record contents | In use |

**We do not sell or rent your personal data to third parties for advertising.**

### 3.5 Purposes

1. Provide and operate the Service (sign-in, read/write/display passport data)
2. On-device-first storage and cloud backup (restore across devices; check backup status)
3. Conflict detection (on-device vs Drive, and from Phase 2 vs Supabase)
4. Security and abuse prevention
5. Legal compliance
6. Other purposes you specifically agree to

---

## 4. Where data lives

```
Your device (local)     → primary working copy (you control) [Phase 1]
Supabase Auth           → sign-in identity (not pet records) [Phase 1]
Your Google Drive       → optional backup after separate auth
Supabase database       → planned backup copy [Phase 2, not live]
Petlive-owned EHR DB    → none; we do not sell your records as a product
```

- **Google sign-in** (via Supabase Auth) verifies identity.
- **Google Drive** is a **backup destination** after separate permission.
- **Supabase database sync** is Phase 2; we will announce and may require confirmation before launch.

---

## 5. Cookies and similar technologies

1. We may use cookies, localStorage, sessionStorage, or similar technologies for sign-in, language preference, and on-device data.
2. You may restrict or clear them in browser settings; that may affect sign-in and data persistence.

---

## 6. Security

We take reasonable measures, including:

- HTTPS in transit
- Account isolation for cloud access (e.g. Row Level Security from Phase 2)
- Limiting staff and vendor access

**No system is perfectly secure.** Keep your Google account, device, and browser access secure.

If a personal-data incident occurs and law requires notice to you or a regulator, we will follow applicable law.

---

## 7. Sync and conflicts

1. **Phase 1:** On-device and Google Drive (if authorized) may temporarily diverge.
2. **Phase 2:** On-device, Drive, and Supabase may temporarily diverge if sync is enabled.
3. We compare versions (e.g. timestamps) and **prompt you to choose** which version to keep rather than silently overwriting every device.
4. We do **not** guarantee that other copies stay in sync if one backup fails.

---

## 8. Your rights as a data subject

Under Taiwan's Personal Data Protection Act, you may:

### 8.1 Rights

1. Inquiry / access
2. Request a copy
3. Supplementation or correction
4. Stop collection, processing, or use
5. Deletion

### 8.2 How to exercise

Email **mfvboy043@gmail.com** with:

- Your request
- Information sufficient to verify identity (e.g. sign-in email)

After identity verification as required by law, we aim to respond within a **reasonable period** (target **30 days** after a complete request; complex requests may take longer). Necessary costs may be charged where law allows.

### 8.3 Refusal or withdrawal of consent

You may refuse or withdraw consent. Doing so may disable sign-in, cloud backup, or restore features; on-device/demo availability follows product design.

### 8.4 Withdrawal / deletion steps

1. **Sign out** in the app to stop new cloud operations (if enabled)
2. **Delete Google Drive backups** in your Drive
3. **Request Supabase account deletion** via mfvboy043@gmail.com (or in-app delete, if provided)
4. **From Phase 2:** delete Supabase cloud copies per in-app guidance or email
5. **Clear on-device data** in browser settings for this site
6. Changes may take time; third-party copies must be deleted via each platform's process

---

## 9. Age restriction (18+)

1. The Service is **not directed at** users under 18.
2. Before using the Service, you must confirm and declare that you are **18 or older**. This is a **self-attestation** and risk-reduction measure, **not** government-ID-grade precise age verification. Standard Google sign-in scopes also do **not** provide us a reliable date of birth or age.
3. If we learn or have reason to believe a user is under 18, we will investigate and, where appropriate, delete the related account and/or data (including on-device data and cloud backups as guided by this Policy).
4. This section does **not** claim compliance with COPPA, GDPR/UK GDPR, Korea's PIPA, or similar child-protection regimes via verifiable parental consent. Formal compliance and jurisdiction-specific thresholds remain for licensed counsel; until then this document remains a **draft**.

---

## 10. Changes to this Policy

1. We may revise this Policy for product updates (including Phase 2), law, or third-party changes.
2. Material changes will be announced in the app or on our site, with an updated "Last updated" date.
3. Continued use after a revision means acceptance where law allows; where separate consent is required, we will obtain it.

---

## 11. Contact (data controller)

- **Operator (controller):** Dragon Fruit Passport (火龍果護照)
- **Legal form:** Individual
- **Business registration number:** None
- **Email:** mfvboy043@gmail.com
- **Address:** Individually operated; no physical business address. Use email for rights requests or complaints; we aim to reply within the §8.2 target period.

---

## Glossary

| Term | Meaning |
|---|---|
| On-device / local | Storage on your browser or device |
| Cloud backup | Copy to Google Drive or (from Phase 2) Supabase after your authorization |
| Phase 1 | Live: Supabase Auth, on-device pet data, optional Google Drive backup |
| Phase 2 | Planned: Supabase database cloud sync |

---

*This is one of four AI-assisted language drafts (en). It is not legal advice or counsel sign-off. Licensed counsel in applicable jurisdictions must review it before it becomes operative.*
