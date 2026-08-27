# UI review
Verdict: conditional

Candidate judged from worktree `proposal/local-first-entry` working tree vs `db0e912` (intro A, unsigned B chrome, C stub). Unrelated labs/imaging on local main ignored.

Hero composition is now complete: brand mark + eyebrow + 「火龍果護照」 + lede + one sage primary + tertiary demo + mascot. No cards in the hero. Unsigned B/C connect chip is light, same family as 選單, not a second black topbar primary. Fonts stay Fraunces / Noto Serif TC / Noto Sans TC. Motion is press/hover only.

## Findings
- [UI-001] [P2] Intro A top-right Google — still a filled black pill (`#121212`, 40px, drop shadow) with a longer `loginWithGoogle` label, so it can win first look against the new sage 「進入護照」. Structurally it is chrome, visually it is still a lock-door primary. Demote to ghost/outline or G-icon-first (keep label for a11y) so the hero CTA owns the first viewport.
- [UI-002] [P3] Intro A lede — support slot now carries local-first, Google-backup, and the medical disclaimer in one block; EN/JA wrap denser than the old single-beat line. Shorten to one support sentence (disclaimer can stay as the existing second line) so the mascot stays in the first-viewport composition on ~375px.
- [UI-003] [P3] Intro A topbar ~421–520px — `loginWithGoogle` stays visible until 420px, so mid-width phones keep a long black chip beside the brand-mark (which ellipsizes). Raise the icon-only breakpoint or cap the label so brand + control share the glass bar without crowding.
- [UI-004] [P3] Unsigned B connect chip ≤520px / inner heads ≤720px — label is hidden; control becomes G-only at ~34×40px next to 選單 (and gear on home). Tap height matches existing chrome; the backup affordance is easy to miss. Keep the light treatment; consider a 40×40 minimum width so the G target matches the gear.
