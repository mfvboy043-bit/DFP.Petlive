---
id: 20260827-form-ui-render
title: Form UI render — extract填表畫面 HTML from app.js
status: proposed
author: planner
candidate_branch: "proposal/form-ui-render"
candidate_path: "proposals/20260827-form-ui-render"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Form UI render building blocks (FO-05)

Companion: `state.yaml`.

## Goal

Move form-screen HTML builders from surface `app.js` into domain/shell `render.js` modules. Facades keep read/validate/submit and DOM state.

## Acceptance criteria

- [x] Breed, medications, labs, imaging, parasite form HTML under render modules
- [x] Proof preview under `shell/proof-preview.js`
- [x] C facade thin wrappers; script tags wired
- [x] FO-05 tests pass; `node --check apps/web/c/app.js`
