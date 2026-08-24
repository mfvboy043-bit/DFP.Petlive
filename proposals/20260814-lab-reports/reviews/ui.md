# UI review
Verdict: conditional

Candidate: `proposals/20260814-lab-reports/preview` vs mainline `apps/web`  
Scope checked: emergency docs pair (labs enabled / X-ray disabled), labs list + empty state, lab-add type chips and photo previews, list cards (date / clinic / types / thumbs), disclaimer, timeline labs line, mobile tap targets, card restraint, anti-AI-default, motion.

## Findings

- [UI-001] [P2] emergency docs pair — Live labs tile and disabled X-ray still share the same lifted plate, strong border, ink weight, and `:disabled { opacity: 1 }`. At rest they read as twins; the only difference is subtitle copy, and the enabled hover (leaf border) does not exist on phone. Mute X-ray (no lift, fainter ink, keep「即將開放」) and give labs a rest-state live cue in the same language as `.e-quick-nav`.

- [UI-002] [P2] labs / lab-add first viewport — Both screens sit on the passport paper wash, but they were left out of the mobile “washed screens — no opaque sticky slab” exception. Phone first paint is a frosted bar over wash, unlike emergency / timeline / vaccines / alerts / parasite. Add `data-screen="labs"` and `lab-add` to that exception so the new flow stays in the passport family.

- [UI-003] [P2] list cards — Each `.lab-item` leads with a full `.btn.btn-ghost`「移除」(48px beige fill) in the same row as the date, so the destructive control outranks date · clinic · types · thumbs. Keep the card for those interactions; move remove to a quiet text control after the thumbs (timeline proof-remove weight), not a second chrome button in the head.

- [UI-004] [P2] lab-add photo previews — Thumbs reuse `.proof-clear-btn` (`position: absolute` overlay from the large proof slot) while also setting `width: 100%` on an 88px figure, so「移除」sits on the image instead of under it. Match the timeline Rx figure: static clear under the thumb, ≥44px tap, no overlay.

- [UI-005] [P2] timeline labs line — `.tl-visit-labs-btn` is 12px underlined text with `padding: 0`, below a 44px target. Give it a padded hit area (`min-height: var(--tap)` or equivalent) without turning it into a card.

- [UI-006] [P3] labs disclaimer — 「不判讀數值」is the new constraint but uses `.field-hint` (11px muted), quieter than the header restatement「給獸醫師對照原件」. Fold into one support line under the title, or a single quiet rule — still one line, not a banner.

## Notes (non-findings)

- Empty state is one muted line plus header「拍照存檔」; no illustration wall or dashed empty-card.
- Type chips live in a「報告類型」field with a category hint; list types are plain text (`血液／生化`), not colored result / H-L pills. Selected mint is the existing category `is-on`, not a 陽性 signal.
- Emergency hero is unchanged: brand + identity stay in `.e-card`; docs tiles sit underneath, not in the hero. List cards only appear on the labs screen and hold thumbs.
- Motion is existing chip press + screen-in (off on phone); no decorative motion on the new flow.
- Anti-AI-default: serif heads, leaf/paper, no Inter/purple-indigo/cream-terracotta cliché. Thumbs 72px meet tap size.
