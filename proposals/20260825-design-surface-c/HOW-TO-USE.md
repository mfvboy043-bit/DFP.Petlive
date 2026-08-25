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

## Promote (after Gate B)

Victor said cover on 2026-08-25: C UI was copied into **B** (`apps/web/`) with Google auth restored.

- **B** = formal surface (nav + account chrome + emergency footer, etc.)
- **C** = still available at `apps/web/c/` for further drafts
- **A** = `?intro=1` login testing (not forced on everyday B boot)

