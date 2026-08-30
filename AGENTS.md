# Petlive agents

## Rule hierarchy (always on)

Victor standing order: **Tier 1 → Tier 2 → process rules**, in that order. When in doubt, higher tier wins.

### Tier 1 — 最高憲法（Security）

| Rule | Source |
|------|--------|
| **Security constitution** | `.cursor/rules/security-constitution.mdc` + **`security.md`** |

Applies **always**. No product change may violate invariants C/I/A/L. Auth, sync, storage, Drive, Supabase DB, or billing → read `security.md` before work; **security diff scan** before Gate B when those paths are touched.

### Tier 2 — 架構憲法（Building blocks / 積木規則）

| Rule | Source |
|------|--------|
| **Web building blocks** | `.cursor/rules/web-building-blocks.mdc` |

Applies to **every new write** in `apps/web` — new component, button, chrome, domain logic, shared styles. **Do not wait for Victor to say「照積木規則」.**

```text
1. Classify layer (domain | core | shell | runtime) — name target path BEFORE coding
2. Create/extend block under that folder
3. Thin-wire facade in surface app.js + index.html script/link tags (?v= bumped)
4. Never paste brain into app.js / c/app.js / surface styles.css “to show quickly”
```

Codebase cleanup is **ongoing**. Skipping Tier 2 makes later整理 exponentially harder — **forbidden: 「稍後再拆積木」**.

### Tier 3 — Process standing orders

| Priority | Rule | Applies when |
|----------|------|--------------|
| 1 | **Self-iteration gates** — `self-iteration-gates.mdc` | Product changes to `apps/web`, `contracts/`, `packages/` |
| 2 | **Config secrets privacy** — `config-secrets-privacy.mdc` | Config / Supabase / Google key work |
| 3 | **C → B cover** — `c-to-b-cover.mdc` | Passport UI, shell, styles, facade wiring |
| 4 | **Auto-publish Pages** — `auto-publish-pages.mdc` | Formal A/B deploy after confirmed cover |

---

Product changes to `apps/web`, `contracts/`, or `packages/` use **Self-Iteration v2**:

1. Read `.cursor/skills/petlive-orchestrator/SKILL.md`
2. Delegate to `.cursor/agents/petlive-*` (Planner, Builder, Pharmacist, QA, UI, Legal, Arbiter)
3. Treat `proposals/<id>/state.yaml` as gate/iteration source of truth
4. Stop for Victor at Gate A (確認) and Gate B (採用)

Tiny in-chat fixes and updates to Rules/Skills/Agents/proposals scaffolding skip the full loop — **not** passport UI, dock, emergency card, or `styles.css` layout on B (see **c-to-b-cover**).

Surface workflow: **C first → Victor confirms 覆蓋到 B → Cover checklist → auto-publish-pages**. Live/Pages bug reports do **not** authorize Direct B.

**Layer map (Tier 2 quick ref):** floating docks / nav / chrome → `apps/web/shell/`. Pet record logic → `apps/web/domains/`. Storage slots → `core/`. Surface `app.js` / `c/app.js` → thin facades only.

See `.cursor/SELF-ITERATION-V2.md`.
