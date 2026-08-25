# How to use A / B / C

## Open

| Surface | Role | URL |
|---------|------|-----|
| **A → B** | Formal: intro login then passport | `…/apps/web/` |
| **B only (debug)** | Skip intro | `…/apps/web/?app=1` |
| **C** | Discussion / experiment replica | `…/apps/web/c/` |

Local example (LAN server on port 5173):

- Formal: `http://<Wi‑Fi-IP>:5173/apps/web/`
- Debug B: `http://<Wi‑Fi-IP>:5173/apps/web/?app=1`
- C: `http://<Wi‑Fi-IP>:5173/apps/web/c/`

## Rules of thumb

1. Design discussion → work only on **C** (`apps/web/c/`).
2. C uses `petlive-c-*` localStorage keys; B keeps `petlive-*` — data stays separate.
3. C does **not** load Google auth (`config.public.js` / `auth/google-drive.js`).
4. **C → B cover only after Victor confirms** (覆蓋 / cover to B). See `.cursor/rules/c-to-b-cover.mdc`.

## Promote (C → B)

Do **not** auto-sync. After Victor confirms cover:

1. Copy agreed C UI deltas into **B** (`apps/web/`).
2. Restore B-only pieces (Google auth, `petlive-*` keys, intro A).
3. Bump cache `?v=` and publish Pages per auto-publish rule.

- **B** = formal surface (nav + account chrome + emergency footer, etc.)
- **C** = still available at `apps/web/c/` for further drafts
- **A** = intro / login on formal `apps/web/` (default boot; `?app=1` skips to B)
