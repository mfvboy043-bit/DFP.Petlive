# Petlive agents

## Standing orders (always on)

These rules apply to **every** session. Full text lives in `.cursor/rules/` unless noted.

| Priority | Rule | Applies when |
|----------|------|--------------|
| 1 | **Self-iteration gates** — `self-iteration-gates.mdc` | Product changes to `apps/web`, `contracts/`, `packages/` |
| 2 | **Security constitution** — `security-constitution.mdc` + **`security.md`** | **Always.** Mandatory read before auth, cloud sync, storage, Drive, Supabase DB, or billing. No change may violate invariants C/I/A/L. |
| 3 | **Config secrets privacy** — `config-secrets-privacy.mdc` | Any config / Supabase / Google key work |
| 4 | **C → B cover** — `c-to-b-cover.mdc` | Passport UI, shell, styles, facade wiring |
| 5 | **Building blocks** — `web-building-blocks.mdc` | New product logic, chrome, domains, shell |
| 6 | **Auto-publish Pages** — `auto-publish-pages.mdc` | Formal A/B deploy after confirmed cover |

Product changes to `apps/web`, `contracts/`, or `packages/` use **Self-Iteration v2**:

1. Read `.cursor/skills/petlive-orchestrator/SKILL.md`
2. Delegate to `.cursor/agents/petlive-*` (Planner, Builder, Pharmacist, QA, UI, Legal, Arbiter)
3. Treat `proposals/<id>/state.yaml` as gate/iteration source of truth
4. Stop for Victor at Gate A (確認) and Gate B (採用)

Tiny in-chat fixes and updates to Rules/Skills/Agents/proposals scaffolding skip the full loop — **not** passport UI, dock, emergency card, or `styles.css` layout on B (see **c-to-b-cover**).

Surface workflow: **C first → Victor confirms 覆蓋到 B → Cover checklist → auto-publish-pages**. Live/Pages bug reports do **not** authorize Direct B.

Web product logic must follow **building blocks** (always-on rule `.cursor/rules/web-building-blocks.mdc`):

1. **Classify** layer (`domains/` / `core/` / `shell/`) **before** coding  
2. Write the block in that folder **first** — never draft chrome/brain in `app.js` / `c/app.js` to “extract later”  
3. Thin-wire facades + `index.html` script/link tags  

Floating docks, glass chrome, account menus → `apps/web/shell/`. Pet record logic → `apps/web/domains/`.

See `.cursor/SELF-ITERATION-V2.md`.
