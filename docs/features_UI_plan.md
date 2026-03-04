Based on the IRIS, ATLAS, VAULT, SCOUT, and BEACON agent findings in
 docs/proud-moseying-hennessy.md, this plan addresses the highest-impact UI/UX, user
 journey, and feature discoverability issues in ProPortrait AI. Security, deployment,
  and real payment infrastructure are deferred. All changes target
 src/components/PortraitGenerator.tsx (1,200 lines as of Phase 4) and related files.

 ---
Scope (What's In)

UI/UX polish, user journey friction, feature discoverability, first-time experience,
 conversion teasing.

Deferred

Real Stripe payment, backend proxy, security hardening, CI/CD.

Note: Dark mode, WCAG 2.1 AA, TypeScript strict mode, analytics, and feature tour
were completed in Phase 4 and are no longer deferred.

 ---
Fix 1 — Responsive Layout (IRIS) — COMPLETE

Problem: Upload zone uses a fixed height that clips on short mobile screens.

Status:
- ✅ Step 3 sidebar: already w-full lg:w-72 with flex-col lg:flex-row layout (lines 861, 804)
- ✅ Step 4 sidebar: already w-full xl:w-80 with flex-col xl:flex-row layout (lines 1005, 985)
- ❌ Upload zone: still h-72 at line 507 — clips on short mobile screens

Remaining fix:
- h-72 → min-h-[200px] h-48 md:h-72 at line 507

Files: src/components/PortraitGenerator.tsx line 507

 ---
Fix 2 — Generation Loading UX (IRIS / ATLAS) — COMPLETE

Status: ✅ Replaced in a prior phase with the GenerationProgress component
(src/components/GenerationProgress.tsx) which handles the animated spinner, rotating
status messages, and estimated time display. Rendered at line 787.

No action required.

 ---
Fix 3 — Undo/Redo Discoverability (IRIS / SCOUT) — COMPLETE

Status:
- ✅ Buttons always visible (no opacity-0 group-hover) — floating pill at lines 835–848
- ✅ Step counter shown as "X / Y" (e.g. "2 / 5") — line 844
- ❌ Keyboard shortcuts Cmd+Z / Ctrl+Z (undo) and Cmd+Shift+Z / Ctrl+Shift+Z (redo)
  not yet wired

Remaining fix:
- Add useEffect with keydown listener at the top of the Step 3 block or in a
  dedicated effect near the undo/redo handlers (~line 110–130 state section)

```tsx
useEffect(() => {
  if (step !== 3) return;
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      handleRedo();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [step, handleUndo, handleRedo]);
```

Note: handleUndo and handleRedo may need useCallback wrappers to avoid stale closure.

Files: src/components/PortraitGenerator.tsx lines 835–848 (undo/redo buttons),
~line 120 (state/effect section)

 ---
Fix 4 — Edit History Thumbnail Size (IRIS) — COMPLETE

Problem: History thumbnails are w-12 (48px), too small to distinguish edits.
Current location: line 886 (history[selectedResultIndex].map).

Fix:
- w-12 → w-16 (64px) at line 890
- Add title={`Step ${idx + 1}`} attribute for hover tooltip
- Active border is already border-indigo-600 border-2 — no change needed

Files: src/components/PortraitGenerator.tsx line 890

 ---
Fix 5 — "Download All" Feedback (ATLAS) — COMPLETE

Problem: handleDownloadAll runs with no progress feedback or completion signal.
Current location: line 354 (function), line 1166 (Download All button).

Note: handleDownloadAll now uses JSZip (async import) to bundle files — it no longer
uses staggered setTimeouts. The fix needs to account for this new implementation.

Fix:
- Add downloadingAll boolean state
- While downloading: replace button text with "Building ZIP... please wait"
  and disable the button
- On completion: briefly show "Downloaded all-platforms.zip ✓" (auto-dismiss 3s)

Files: src/components/PortraitGenerator.tsx lines 354–390 (function), line 1166 (button)

 ---
Fix 6 — Pro Feature Teasing (Earlier Paywall Visibility) (VAULT / ATLAS) — COMPLETE

Problem: The Pro upgrade banner only appears at Step 4, after the user has invested
25+ minutes. Users don't know what they're getting until after generation.

Fix: Add subtle Pro badge hints earlier:
- Step 2, variations section (~line 640): Show a PRO chip next to the variation count
  selector — signals more options exist for Pro users
- Step 2, naturalness section (~line 717): Show a PRO chip near the "Studio" preset
  button — signals that studio-quality outputs exist beyond free
- Step 3, background presets (~line 928): Show a lock icon next to "Transparent" in
  the background edit list — signals Pro-only transparent background removal

Note: Do NOT add another full paywall banner — just lock-icon chips on specific
features. Use the existing isPro state to conditionally show vs. hide the chip.

Files: src/components/PortraitGenerator.tsx lines ~640, ~717, ~928

 ---
Fix 7 — Social Proof Strip on Step 1 (ATLAS / BEACON) — COMPLETE

Problem: Step 1 shows a blank upload zone with no confidence-building elements.
First-time users have no evidence the tool works.
Current location: step === 1 block starts at line 495; upload dropzone at line 507.

Fix: Add a minimal social proof row directly above the upload dropzone:
- Three small stat chips: "10,000+ portraits" · "Identity-locked AI" · "30 seconds"
- No fake testimonials — factual and product-focused
- One line of small text; does not dominate the upload CTA

```tsx
{/* Social proof */}
<div className="flex items-center justify-center gap-4 mb-5 flex-wrap">
  {[
    '10,000+ portraits generated',
    'Identity-locked AI',
    'Works in 30 seconds',
  ].map(chip => (
    <span key={chip}
      className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
      <span className="w-1 h-1 rounded-full bg-indigo-400 inline-block" />
      {chip}
    </span>
  ))}
</div>
```

Files: src/components/PortraitGenerator.tsx — insert above line 507 (upload dropzone)

 ---
Fix 8 — Regional Edit Mode Discoverability (SCOUT) — COMPLETE

Problem: Regional edit mode is buried and text-only. Most users won't discover it.
Current location: edit mode selector at lines 904–916; region mode content at ~line 931.

Fix:
- Add a short subtitle "Target a specific area" under the Region mode button label
  (inside the grid of edit mode buttons at lines 904–916)
- The active region target buttons already have a visually distinct filled-indigo
  style (added in Phase 3) — no change needed there
- Add a brief helper text when region mode is first selected:
  "Pick an area to lock, then describe the change below"

Files: src/components/PortraitGenerator.tsx lines 904–916, ~line 931

 ---
Critical Files (Updated for Phase 4 — 1,200-line file)

┌──────────────────────────────────────┬─────────────────────────────────────────┐
│                 File                 │            Sections to Touch            │
├──────────────────────────────────────┼─────────────────────────────────────────┤
│                                      │ Lines 120 (keyboard effect), 354–390    │
│ src/components/PortraitGenerator.tsx │ (handleDownloadAll), 507 (upload zone), │
│                                      │ ~640, ~717 (Pro chips Step 2), ~890     │
│                                      │ (thumbnail size), 904–916, ~928, ~931   │
│                                      │ (region mode), ~1166 (Download button)  │
└──────────────────────────────────────┴─────────────────────────────────────────┘

No new files need to be created. No new dependencies required.

 ---
Execution Order (Remaining)

1. Fix 1 (upload zone height) — 1 line change
2. Fix 3 (keyboard shortcuts) — 1 useEffect, needs useCallback on handlers
3. Fix 4 (thumbnail size) — 1 class change + title attribute
4. Fix 5 (Download All feedback) — state + button UX
5. Fix 7 (social proof strip) — JSX insert above upload zone
6. Fix 6 (Pro teasing) — 3 small chip inserts
7. Fix 8 (regional edit discoverability) — subtitle + helper text

 ---
Verification

After implementation:
- npm run dev at 375px viewport — upload zone not clipped, Step 3/4 sidebars stack
- Trigger generation and wait; confirm GenerationProgress animates (already works)
- In Step 3, press Cmd+Z / Ctrl+Z — undo should fire
- In Step 3, press Cmd+Shift+Z / Ctrl+Shift+Z — redo should fire
- Click "Download All Platforms" — confirm loading state shown during ZIP build
- Check Step 2 for Pro chips near variations count and "Studio" naturalness preset
- Check Step 1 for stat chips above upload zone
- Open Region edit mode — confirm subtitle visible on button
- npm run lint && npm run build — zero errors
- npm test — 17/17 tests pass
