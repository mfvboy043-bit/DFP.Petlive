# Petlive agents

Product changes to `apps/web`, `contracts/`, or `packages/` use **Self-Iteration v2**:

1. Read `.cursor/skills/petlive-orchestrator/SKILL.md`
2. Delegate to `.cursor/agents/petlive-*`
3. Treat `proposals/<id>/state.yaml` as gate/iteration source of truth
4. Stop for Victor at Gate A (確認) and Gate B (採用)

Tiny in-chat fixes and updates to Rules/Skills/Agents/proposals scaffolding skip the full loop.

Web product logic must follow **building blocks** (always-on rule `.cursor/rules/web-building-blocks.mdc`):

1. **Classify** layer (`domains/` / `core/` / `shell/`) **before** coding  
2. Write the block in that folder **first** — never draft chrome/brain in `app.js` / `c/app.js` to “extract later”  
3. Thin-wire facades + `index.html` script/link tags  

Floating docks, glass chrome, account menus → `apps/web/shell/`. Pet record logic → `apps/web/domains/`.

See `.cursor/SELF-ITERATION-V2.md`.
