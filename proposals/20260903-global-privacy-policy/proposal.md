---
id: 20260903-global-privacy-policy
title: Global privacy policy and 18+ self-attestation
status: proposed
author: planner
candidate_branch: ""
candidate_path: "proposals/20260903-global-privacy-policy/preview"
created: 2026-09-03
updated: 2026-09-03
---

# Proposal: Global privacy policy and 18+ self-attestation

Companion: `state.yaml` (v2 source of truth for gates / iteration).

**Gate A only.** This proposal records legal-document and product-control scope. It does not authorize edits to `apps/web/`, `contracts/`, or `packages/`. Builder work starts only after Victor confirms Gate A, and formal B/legal publication still requires Gate B adoption and the applicable C-first/cover workflow.

## Goal

Replace the current Taiwan-centered privacy draft with a reviewable global privacy system that:

- accurately describes Petlive's real Phase 1 data flows;
- uses a global core plus jurisdiction-specific addenda for Taiwan, EEA, UK, United States/California, Canada, Japan, and Korea;
- keeps Traditional Chinese, English, Japanese, and Korean versions semantically synchronized;
- follows Victor’s **2026-09-03 Gate B modification**: Cursor-style **18+** policy (service not directed at under-18; investigate/delete if discovered) plus a **self-attestation checkbox** before entry — risk reduction and intent, **not** precise age verification; Google OAuth does not supply age; and
- creates explicit legal and security gates before any Phase 2 Supabase database sync.

The structure of Cursor's Traditional Chinese privacy policy (last updated 2025-10-06) is a useful reference for category-based collection, purposes, recipients, retention, rights, automated-decision and sale/share statements, jurisdiction-specific notices, and the **under-18 non-collection / non-direction** approach. It is not a legal template for Petlive: Cursor's operating entity, services, vendors, data uses, and legal bases differ.

## Decision and constraints

- Markets in scope: Taiwan, Japan, Korea, global English, United States/Canada, and EEA/UK.
- Age strategy (**modified 2026-09-03**): **18+ self-attestation**. Policy states the service is not directed at under-18 users and that Petlive will investigate and delete account/data when it learns or has reason to believe a user is under 18. Product requires an explicit “I am 18 or older” acknowledgement before entry. This is **not** government-ID age verification and **not** a claim of COPPA/GDPR/PIPA child-compliance via parental consent.
- Supersedes the earlier “no fixed minimum age / age-inclusive + VPC” path. Do **not** build verifiable parental consent for under-18 as the primary model unless Victor revises again.
- Global structure: global core + Taiwan / EEA / UK / US-California / Canada / Japan / Korea addenda + under-18 / discovery notice + cookie/local-storage notice.
- A jurisdiction addendum prevails for that jurisdiction where it conflicts with the global core. No language version may claim that a generic Chinese version controls every jurisdiction.
- AI legal assistants and reviewers provide drafting and issue-spotting only; they are **not substitutes for licensed counsel** and cannot issue the required legal sign-offs.
- Privacy notice, Terms acceptance, Google Drive authorization, optional consent, and age self-attestation must remain separate, purpose-specific actions.

## Verified Phase 1 baseline

The policy inventory and implementation inventory must start from these verified facts:

- Formal B does not expose `?demo=1`.
- Pet records default to `localStorage`; IndexedDB is not enabled as the current default.
- Google Drive backup JSON may include `petPhotos` and therefore image content.
- Supabase `persistSession` may use `localStorage`; the policy must not describe every auth artifact as browser-session-only.
- Google Drive access token is held in `sessionStorage`, and sign-out performs revocation.
- Supabase is currently used for Auth only, not as the pet-record database.
- Sync/reconciliation is not a complete user-facing two-choice flow and includes auto-pull behavior.
- There is no complete in-app account deletion, full-data export, or complete local-data clearing flow.
- Petlive currently has no product analytics integration and no AI API processing.
- Current statements about no analytics, no AI, no sale/share, no targeted advertising, and no solely automated decisions may be published only while verified true.

Any candidate must refresh this inventory against the exact release being reviewed. Policy text must follow implementation; it must not promise controls that have not shipped.

## In scope

### Workstream A — legal documents, data inventory, and four-language architecture

This workstream is independently reviewable and may not assume Workstream B controls already exist.

1. **Data-flow register and disclosure matrix (P0)**
   - For each category, document: data element/category → source → purpose → legal basis by jurisdiction → recipient and role → processing/storage country or region → retention/deletion trigger → available rights and request route.
   - Include account/Auth data, Google profile data, Supabase session artifacts, pet and owner records, contact/emergency data, photos and Drive JSON, local/browser storage, language/preferences, support communications, security/CDN logs, and future-only Phase 2 data as clearly separated entries.
   - Distinguish Petlive/controller decisions from Google, Supabase, GitHub Pages, CDN, and user-directed Drive processing. Do not state that the user is categorically the sole “Drive controller” without counsel-supported role analysis.

2. **Document set and precedence (P0)**
   - Global core privacy notice.
   - Taiwan addendum.
   - EEA addendum.
   - UK addendum.
   - US/California addendum, with state-law scoping and Notice at Collection if thresholds or practices require it.
   - Canada addendum covering federal and applicable provincial requirements, including Québec analysis.
   - Japan addendum.
   - Korea addendum.
   - Under-18 / discovery notice (service not directed at minors; self-attestation; investigate/delete if discovered).
   - Cookie/localStorage/sessionStorage notice that reflects essential storage and actual optional technologies.
   - A version/locale manifest defining effective date, precedence, change classification, and semantic-sync status.

3. **Substantive P0 corrections**
   - Identify the real legal operator/controller, legal form, and a contact channel/address that applicable law accepts for service and rights requests.
   - Replace blanket “use means consent,” “disagree with any part means do not use,” and “continued use accepts material changes” language with notice, contract, authorization, and consent mechanisms appropriate to each purpose and jurisdiction.
   - State jurisdiction-specific rights, identity/authorized-agent handling, appeal or complaint routes, regulator contacts, and legally accurate response periods; remove the global one-size-fits-all 30-day promise.
   - Name actual vendors, roles, countries/regions, and transfer mechanisms only from official or contractual evidence. Do not guess server countries.
   - Define concrete retention triggers, deletion exceptions, backup handling, request workflow, and incident response/notification workflow.
   - Correct the overbroad claim that pet health information is automatically sensitive personal data. Assess sensitivity based on whether content identifies or reveals information about a natural person and on each jurisdiction's definitions.
   - Add truthful present-state declarations for no AI API processing, no analytics, no sale/share, no targeted advertising, and no solely automated decisions with legal or similarly significant effects.
   - Flag the current free-service liability cap of zero for separate Terms review; do not silently solve Terms enforceability inside the privacy policy.

4. **P1 and external-counsel questions**
   - EEA Article 27 representative applicability and UK representative applicability.
   - GDPR/UK legal bases, transparency, international transfers, child consent ages, and supervisory authority routes.
   - US federal COPPA and applicable state privacy-law thresholds, California Notice at Collection, authorized agents, appeals, and sale/share terminology.
   - Canada PIPEDA/federal applicability, provincial private-sector laws, Québec Law 25 requirements, meaningful consent, and cross-border transparency.
   - Japan APPI extraterritorial/cross-border disclosure, parental-consent/capacity approach, and breach duties.
   - Korea PIPA extraterritorial/cross-border transfer, under-14 consent, domestic-representative applicability, and breach duties.
   - Taiwan Personal Data Protection Act notices, sensitive-data characterization, cross-border handling, operator identification, child capacity/parental authority, and incident duties.

5. **Four-language drafting controls**
   - Maintain Traditional Chinese (`zh-Hant`), English (`en`), Japanese (`ja`), and Korean (`ko`) from one approved clause inventory.
   - Record clause IDs and jurisdiction scope so translators do not flatten legal distinctions.
   - Require semantic, defined-term, vendor-name, date, right, and retention parity checks.
   - Preserve local legal terminology and regulator names; semantic consistency does not require literal translation.

### Workstream B — product controls for truthful notice and 18+ attestation

This workstream is independently reviewable. It requires C-first work for passport UI and may not be represented as shipped merely because Workstream A is drafted.

1. **Layered notice and separate actions (P0)**
   - Show short, contextual notices before relevant collection or authorization.
   - Keep Terms acceptance, privacy acknowledgement, Google Drive authorization, and optional consent as separate records and controls.
   - Record notice/consent version, locale, purpose, timestamp, and withdrawal status only where legally and technically justified.

2. **18+ self-attestation (P0) — modified 2026-09-03**
   - Require a clear, separate “I confirm I am 18 or older” control before entry to signed-in / passport features (candidate surface first).
   - Record attestation version, locale, and timestamp locally as a UI receipt only — not legal proof of age.
   - Do **not** rely on Google OAuth profile for age (standard scopes do not provide reliable date of birth).
   - Policy + product copy: service not directed at under-18; if Petlive learns or has reason to believe a user is under 18, investigate and delete account/local guidance / request deletion as applicable.
   - Do **not** claim COPPA/GDPR/UK/PIPA “child-compliant parental consent” under this model.
   - Counsel must still confirm whether any market needs a different age floor (e.g. 20/21) or additional steps; until then keep the draft non-operative for publication.

3. **Deletion, export, and local clearing (P0/P1)**
   - Provide clear in-app routes for account deletion requests, complete export, Drive-backup handling, and complete local data clearing.
   - Explain what sign-out does and does not delete.
   - Define identity verification, status feedback, completion evidence, legal holds/exceptions, and failure recovery.
   - Ensure export and deletion scope matches all stores and providers actually in use.

4. **Policy/product release coupling**
   - Generate a release checklist from the data-flow matrix.
   - Block publication of a claim when its corresponding product control or vendor evidence is absent.
   - Require a new review when vendors, countries, storage, AI, analytics, ads, sale/share, automated decisions, age flow, or cloud sync changes.

5. **Phase 2 Supabase database gate**
   - Before any pet-record database launch: RLS on every user-owned table and storage object, dual-account horizontal-authorization tests, DPA and SCC/UK transfer mechanism review, DPIA/PIA as applicable, working deletion/export, incident exercise, retention implementation, and updated notices.
   - Supabase authentication alone is not authorization for multi-tenant pet data.
   - Phase 2 remains described as future-only until the complete gate passes.

## Tier 2 target paths and wiring

No product file is changed by this proposal. If Gate A later authorizes implementation, the Builder must use these classifications:

- **Legal content:** `apps/web/legal/` for pure policy/addendum/notice documents and the locale/version manifest.
- **Shell — legal routing/viewer:** `apps/web/shell/legal-doc-viewer.js` and `apps/web/shell/legal-doc-viewer.css` for locale/jurisdiction routing, precedence display, document navigation, and update presentation.
- **Shell — privacy controls:** `apps/web/shell/privacy-controls.js` and, when needed, `apps/web/shell/privacy-controls.css` for layered notices, consent-purpose UI, 18+ self-attestation, deletion/export entry points, and privacy-control chrome.
- **Surface facade:** thin initialization/hooks only in `apps/web/c/app.js`, then `apps/web/app.js` only after confirmed C → B cover; localization wiring in `apps/web/c/i18n.js` / `apps/web/i18n.js` as applicable.
- **Load order:** add `<script defer>` and `<link rel="stylesheet">` tags in `apps/web/c/index.html` before `c/app.js`, bump `?v=`, test C, obtain Victor's cover confirmation, then mirror approved wiring to formal `apps/web/index.html` before `app.js` while preserving B-only auth and formal storage behavior.

The Builder must not place routing, consent, age-assurance, deletion/export, or notice-state algorithms into `app.js`. If implementation needs durable consent/notice state, it must first classify and propose the required `core/` storage slot/adapter rather than letting shell code access storage directly.

## Out of scope

- Editing or publishing any legal page, product UI, contract, package, or formal B surface at Gate A.
- Treating Cursor's policy, an AI legal assistant, translations, or this proposal as legal advice or legal approval.
- Claiming current compliance with COPPA, GDPR/UK GDPR child rules, CCPA/CPRA, Canadian, Taiwanese, Japanese, or Korean law.
- Inventing operator identity, representative, vendor role, server country, transfer mechanism, retention period, regulator response deadline, or consent requirement.
- Enabling Supabase pet-record database sync, analytics, AI APIs, advertising, sale/share, public profiles, or new child-directed marketing.
- Combining Terms acceptance, privacy notice, Drive OAuth, and optional consent into one checkbox.
- Rewriting unrelated medical, dosage, disclaimer, billing, or general Terms content, except to open separately tracked legal issues.
- Direct B passport UI work before C review and Victor's explicit cover instruction.

## Required licensed-counsel confirmation

The candidate cannot pass Gate B on drafting review alone. Record reviewer name/firm, jurisdiction, date, document version/hash, scope, findings, and disposition.

- **Taiwan-qualified counsel:** operator/controller identity and service contact, PDPA notices and rights, child capacity/parental authority, cross-border handling, sensitive-data characterization, incident response, and interaction with the Terms.
- **EEA privacy counsel:** controller role, Article 6 bases, Member-State child-consent ages, Article 27 representative, DPIA, supervisory complaints, SCCs, and transfer impact requirements.
- **UK privacy counsel:** UK GDPR/Data Protection Act bases, under-13 consent rule, UK representative, ICO routes, UK IDTA/Addendum, and child-design obligations.
- **US counsel with COPPA and state privacy expertise:** under-13 age assurance and verifiable parental consent, parental rights/deletion, child-directed/actual-knowledge analysis, California Notice at Collection and thresholds, state rights/appeals, and sale/share/targeted-ad terminology.
- **Canadian privacy counsel:** PIPEDA/federal and provincial applicability, Québec Law 25, capacity/parental consent, meaningful consent, breach and cross-border requirements.
- **Japan privacy counsel:** APPI extraterritorial scope, child capacity/parent consent, cross-border disclosures/consent, operator disclosures, rights, and breach reporting.
- **Korea privacy counsel:** PIPA extraterritorial scope, under-14 parental consent/verification, cross-border transfer, domestic representative, rights, retention, and breach reporting.

Counsel may narrow an addendum only with a documented applicability analysis. “Not currently above a statutory threshold” must be tracked as a release condition and rechecked when scale or data practices change.

## Risks

- **Age policy — medium/high:** 18+ self-attestation can be lied about; Google login does not prove age. Counsel must still review “not directed at children / no actual knowledge” posture for each market. Do not market to children.
- **False or misleading notice — high:** publishing controls, vendors, countries, deletion/export, or response deadlines that do not match the release creates legal and trust risk.
- **Cross-border uncertainty — high:** official/contractual vendor evidence and transfer mechanisms may differ by configured region and account plan.
- **Translation drift — high:** legal rights, exceptions, and consent ages can change meaning across four languages.
- **Over-collection — high:** age assurance or parental verification can create a new identity-data set; data minimization and security review are mandatory.
- **Local-first integrity — high:** deletion/export controls must cover the actual `localStorage`, auth persistence, session token, and Drive behavior without erasing unrelated device data or implying remote control over local-only records.
- **C/B drift — medium:** passport controls must be proven on C and covered deliberately while formal legal documents and B-only auth behavior stay aligned.
- **Policy precedent — medium:** Cursor's policy contains structures worth studying but also “continued use” and age-exclusion choices that do not satisfy Petlive's selected strategy.

## Review and gate routing

- Workstream A: licensed legal specialists listed above, legal-language/translation QA, product data-flow owner, and security reviewer for claims touching auth/storage/Drive/Supabase.
- Workstream B: privacy/security review, QA, UI/accessibility review, child-safety/legal review, and legal-language review.
- Any auth, storage, Drive, Supabase, deletion/export, consent, or age-assurance implementation requires `security.md` review and a security diff scan before Gate B.
- Gate B may adopt Workstream A and B only when their dependencies are explicit. A document may not claim an unshipped B control.

## Acceptance criteria

### Workstream A

- [ ] Global core and Taiwan / EEA / UK / US-California / Canada / Japan / Korea addenda have explicit scope and precedence.
- [ ] Child/parent notice and cookie/local-storage notice exist in all four languages.
- [ ] Traditional Chinese, English, Japanese, and Korean versions pass clause-ID semantic consistency review, including defined terms, rights, dates, retention, vendors, and exceptions.
- [ ] Every data category has a complete category → purpose → legal basis → recipient/role → region → retention/deletion → rights matrix, with no guessed values.
- [ ] The final policy is tested against the exact release implementation and all known Phase 1 facts in this proposal.
- [ ] Vendor countries, roles, subprocessors, and transfer mechanisms have official or contractual evidence attached to the review record.
- [ ] Statements that Petlive has no AI API processing, analytics, sale/share, targeted advertising, or solely automated significant decisions are verified true at release.
- [ ] Terms acceptance, privacy acknowledgement, Drive authorization, and optional consent are described and implemented as separate actions where applicable.
- [ ] Concrete rights, regulator complaint routes, request verification, retention, deletion, and incident procedures are jurisdiction-correct; no global 30-day shortcut remains.
- [ ] Pet health content is not automatically labeled sensitive personal data without a natural-person and jurisdiction-specific analysis.

### Workstream B

- [ ] “I am 18 or older” self-attestation is separate, versioned, localized, and required before entry controls unlock on the candidate surface.
- [ ] Without attestation, privacy acknowledgement / restricted actions stay blocked; status copy does not claim verified age.
- [ ] Policy clauses state: not directed at under-18; investigate/delete if discovered; attestation is not precise age verification; Google OAuth does not supply age.
- [ ] No verifiable-parental-consent UI is presented as a production child-compliance path.
- [ ] In-app account deletion, complete export, Drive-backup guidance/action, and complete Petlive local-data clearing match all actual stores and failure states.
- [ ] Layered notices and consent records are purpose-specific, versioned, localized, withdrawable where required, and do not rely on one bundled checkbox.
- [ ] C-first passport controls pass before any formal B cover; the B cover preserves auth, formal storage keys, and intro wiring.

### Cross-workstream release gates

- [ ] Automated and manual policy/implementation consistency tests pass for data flows, stores, vendors, permissions, controls, and claims.
- [ ] Phase 2 remains blocked until RLS, dual-account authorization tests, DPA/SCC/UK transfer review, DPIA/PIA, deletion/export, retention, and incident exercise are complete.
- [ ] Taiwan counsel and each applicable EEA/UK, US, Canada, Japan, and Korea specialist sign-off is recorded against the exact four-language release.
- [ ] Unresolved counsel questions, threshold assumptions, and jurisdiction exclusions are blocking issues or explicit launch restrictions.
- [ ] No document says that an AI legal assistant is a lawyer or that AI review equals legal sign-off.
- [ ] Gate B adoption occurs before formal legal publication or B release.

## Notes for Victor

建議確認後仍維持兩條可獨立審查的工作流：

1. **A 法律文件／資料盤點／四語架構**：先完成可由各地律師逐條核對的文件與證據矩陣。
2. **B 產品配套**：18+ 自我聲明、刪除匯出、分層告知先在 C 驗證；沒有配套前，A 不得寫成「已提供」。

**2026-09-03 修改：** 年齡策略改為 Cursor 式「不面向 18 歲以下＋進入前自我聲明已滿 18」。這不是精確驗齡，也不宣稱兒童隱私法合規。

本提案不代表已完成全球法律合規，也不把 AI 法律助理當作律師。

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
（Gate B 階段若已確認 18+ 方向，Builder 應在 preview 實作後再請採用。）
