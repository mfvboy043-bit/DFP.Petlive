# Pet Health Passport（寵物健康存摺）

Web-first MVP for owner-held pet health records. Not an EMR.

## Quick start

```bash
# Architecture / contract tests
node --test qa/tests/*.test.js

# Static web + module bridge (serve repository root)
python3 -m http.server 5173 --bind 0.0.0.0 --directory .
```

Open [http://127.0.0.1:5173/apps/web/](http://127.0.0.1:5173/apps/web/)

## Open on your phone away from home Wi‑Fi

Use **Tailscale** (private VPN to your Mac). See [`deploy/TAILSCALE.md`](./deploy/TAILSCALE.md).

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [contracts/pet-health-passport-contracts.md](./contracts/pet-health-passport-contracts.md).
