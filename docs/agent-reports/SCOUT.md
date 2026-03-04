# SCOUT — Product-Market Fit Audit Report

**Agent**: SCOUT
**Role**: Product strategist, competitive intelligence analyst
**Date**: 2026-03-02
**Status**: Complete

---

## Executive Summary

ProPortrait AI occupies a structurally differentiated position in the AI headshot market but has not yet converted that differentiation into product visibility, market positioning, or revenue. The core technical moat — real-time identity-locked portrait generation with granular per-feature preservation controls — is genuinely unique among the six major competitors analyzed. No competitor offers individual toggles for eye color, skin tone, hair length, hair texture, and glasses preservation; no competitor offers real-time iterative regional editing within the same session.

The product's primary risk is not competitive. It is discoverability and comprehension: the most powerful features are either hidden (undo/redo appears only on hover), buried in UI (regional editing has no marketing presence), or framed for developers rather than users (Copy Settings JSON). Both target ICPs — the Career Pivotter and the Fractional Expert — experience the identical pain ProPortrait solves (identity drift, skin tone bias, multi-platform inconsistency), yet the product does not lead with these pain points in its positioning.

Secondary risks confirmed from code inspection: no analytics to validate any assumption in this report, no real payment flow, and a free tier with zero usage limits — meaning the competitive moat is being given away entirely with no conversion pressure.

**Three highest-leverage product-market fit actions**:
1. Rewrite the hero tagline and Step 1 UI to lead with the identity lock problem, not the output quality.
2. Surface the regional edit studio in onboarding as a named, marketed feature — "Edit Studio" — not a buried sidebar.
3. Add a visual preset gallery to replace the developer-facing "Copy Settings JSON" for the Fractional Expert ICP.

---

## Competitive Feature Matrix

The following matrix reflects features available as of March 2026 based on competitive research across the six primary market alternatives, cross-referenced against features identified in `src/components/PortraitGenerator.tsx` and `src/services/ai.ts`.

| Feature | ProPortrait | Aragon AI | HeadshotPro | BetterPic | Secta Labs | Try It On AI |
|---------|-------------|-----------|-------------|-----------|------------|--------------|
| **Identity: Granular per-feature locks (eye color, skin tone, hair, glasses)** | YES | NO | NO | NO | NO | NO |
| **Identity: Likeness strength slider (0-100)** | YES | NO | NO | NO | NO | NO |
| **Identity: Identity confidence score (displayed)** | YES | NO | NO | NO | NO | NO |
| **Skin: Naturalness slider (texture vs. polished)** | YES | NO | NO | Partial | NO | NO |
| **Skin: Blemish removal toggle (on/off)** | YES | NO | NO | NO | NO | NO |
| **Skin: Explicit skin tone preservation instruction in prompt** | YES | Unknown | Unknown | Unknown | Unknown | Unknown |
| **Editing: Real-time in-browser editing studio** | YES | NO | Partial (Remix) | Partial | NO | NO |
| **Editing: Regional editing (change only background/clothing/lighting/hair)** | YES | NO | NO | Partial | NO | NO |
| **Editing: Undo/redo with visual history strip** | YES | NO | NO | NO | NO | NO |
| **Editing: Before/after comparison slider** | YES | NO | NO | NO | NO | NO |
| **Editing: Transparent background (one-click)** | YES | NO | NO | YES | NO | NO |
| **Expression: 5 named presets (Confident Neutral, Warm Smile, Authority, Expert, Natural)** | YES | NO | NO | NO | NO | NO |
| **Styles: 16 professional styles including platform-specific (LinkedIn, Resume, Speaker)** | YES | 20+ | 20+ | 4K styles | 100+ | 20+ |
| **Group photo: Person selector (left/center/right/custom)** | YES | NO | NO | NO | NO | NO |
| **Export: Platform-optimized downloads (LinkedIn, GitHub, Twitter, Instagram, Resume)** | YES | NO | NO | YES | NO | NO |
| **Export: Download All Platforms (batch, one click)** | YES | NO | NO | NO | NO | NO |
| **Export: Aspect ratio control (1:1 / 3:4) with crop position sliders** | YES | NO | NO | NO | NO | NO |
| **Export: Fill vs. Fit layout mode** | YES | NO | NO | NO | NO | NO |
| **Settings: Copy Settings JSON (preset sharing)** | YES | NO | NO | NO | NO | NO |
| **Processing: Real-time generation (no batch queue wait)** | YES | NO (2hr) | NO (1-3hr) | NO (1.5-2hr) | NO (2hr) | NO |
| **Processing: Single photo input (no 12-15 photo set)** | YES | NO (12 req) | NO | NO (8 req) | NO (15 req) | NO |
| **Processing: Dual-pass AI retouch (generate + refine)** | YES | Unknown | Unknown | Unknown | Unknown | Unknown |
| **Privacy: No server-side image storage** | YES | Unknown | Unknown | Unknown | Unknown | Unknown |
| **API: Developer API for integration** | NO | NO | NO | YES | NO | NO |
| **Volume: Batch processing for teams (multiple people)** | NO | YES | YES (Teams) | YES | YES | NO |
| **Volume: High image count per session (40-300)** | NO (2-4) | YES (40-120) | YES (40-200) | YES (20-120) | YES (300) | YES (100-200) |
| **Quality: 4K resolution output** | NO (1K AI) | NO | NO | YES | NO | NO |
| **Feedback: In-app NPS or rating mechanism** | NO | Unknown | Unknown | Unknown | Unknown | Unknown |
| **Team: Admin dashboard for team usage** | NO | YES | YES | YES | YES | NO |
| **Team: Shared company preset/brand standard** | Partial (JSON only) | NO | Partial | YES | NO | NO |

**Score summary (approx. features present)**:
- ProPortrait: 23 of 30 tracked features
- BetterPic: 12 of 30
- HeadshotPro: 9 of 30
- Aragon AI: 8 of 30
- Secta Labs: 7 of 30
- Try It On AI: 5 of 30

ProPortrait leads the feature matrix in identity controls, editing depth, and export flexibility. It trails in volume output, resolution ceiling, and enterprise tooling.

---

## Jobs-to-be-Done Analysis

The following JTBD analysis is grounded in the ICP document at `/Users/jaeheesong/projects/node/proportrait/docs/ICP.md` and cross-referenced against feature capabilities confirmed in code.

| Job | Frequency | Current Support | Gap | Competitor Coverage |
|-----|-----------|-----------------|-----|---------------------|
| "Get a professional photo that still looks like me" | Daily (Career Pivotter trigger) | YES — identity locks + likeness slider + before/after | Weak discoverability: locks buried in Advanced Settings | BetterPic partial; others none |
| "Fix identity drift from prior AI headshot tools" | High (re-purchase driver) | YES — explicit lock system addresses this | Not marketed as the specific solution to prior AI failure | No competitor addresses explicitly |
| "Get a photo fast enough for a 48-hour interview deadline" | Acute (Career Pivotter) | YES — real-time, single-photo, under 2 minutes | Load time not communicated upfront; no SLA stated | ProPortrait uniquely wins this |
| "Create consistent photos across LinkedIn, website, resume, Twitter" | High (both ICPs) | YES — Platform Export with 5 targets + Download All | Download All is not gated correctly; Fractional Expert may not know it exists | BetterPic (API); no competitor matches the 1-click batch |
| "Update my speaker photo for a conference bio (same day)" | High (Fractional Expert trigger) | YES — Speaker style + high-res export | Speaker style not prominently marketed; no "speaker bio" workflow entry point | No direct competitor; speakers use stock photographers |
| "See how I look in multiple styles before committing to brand direction" | High (Fractional Expert) | YES — 16 styles, 2-4 variations | No side-by-side style comparison view; must generate separately | Secta Labs: 100+ styles, batch view |
| "Generate a PNG with transparent background for design files" | Critical (Fractional Expert) | YES — regional edit "Transparent" background | Buried in edit mode: not visible on Step 2 or export screen until editing | BetterPic: direct toggle |
| "Update photos for 10 employees before the conference" | High (Teams) | NO — single photo only | No batch upload, no team dashboard, no bulk download ZIP | Aragon, HeadshotPro, BetterPic all support |
| "Fix the background color to match our brand palette" | Medium (Fractional Expert) | Partial — background presets + free-text prompt | Presets are generic (Solid White, Solid Grey), no hex color input | BetterPic: custom hex background |
| "Set an expression that reads as executive authority for board presentations" | High (Career Pivotter ICP 1) | YES — Serious Authority expression preset | Most users won't find expression control unless they scroll past style grid | No competitor offers named expression control |
| "Make the app work on my phone during a commute" | Medium | Partial — responsive UI exists | No mobile-optimized layout confirmed; no PWA; no mobile-specific flow | Most competitors are desktop-web only |
| "Share my settings with my VA or team so they replicate my look" | Medium (Fractional Expert ICP 2) | Partial — Copy Settings JSON | JSON is developer-facing; no import (paste JSON → apply settings); no visual preset gallery | No competitor has this at all |
| "Know that Google isn't storing my face photo forever" | High (both ICPs, acute for Fractional Expert) | Partial — PrivacyNotice component | Notice distinguishes ProPortrait from Gemini API processing, but language may not be clear enough for Fractional Expert who is public-facing | No competitor has explicit no-storage claim visible |
| "Provide feedback when something looks wrong" | Universal | NO — no feedback mechanism | Zero NPS, zero star rating, zero "report issue" button | Most competitors have basic support ticket |

---

## Findings

### CRITICAL

#### C1 — Identity Locks Are the Core Differentiator But Are Buried in "Advanced Settings"
**Evidence**: In `PortraitGenerator.tsx`, the Identity Locks section (eye color, skin tone, hair length, hair texture, glasses) is rendered inside a collapsible-appearance `bg-slate-50` Advanced Settings block below the style grid, expression presets, likeness slider, and naturalness slider. A user on a first visit who does not scroll will never see it. The product's own hero tagline calls out identity locking: "The only AI portrait tool that actually looks like you — identity-locked, skin-tone guaranteed, platform-ready." But the UI hides the feature that delivers this promise.

**User Impact**: ICP 1 (Career Pivotter) identifies "identity drift anxiety" as the #1 objection to AI headshots. The identity lock UI is the direct answer to that objection — but it must be seen to overcome the objection. Users who complete generation without noticing the locks may not understand why the result preserved their features, and will not know to defend those features in a retry.

**Competitive Context**: No competitor offers this capability. It is the sharpest product moat. Hiding it is a positioning failure.

**Remediation**: Move Identity Locks to the top of Step 2, above the style grid, with a prominent "What makes ProPortrait different" label. Add a one-sentence explainer: "Lock your features — the AI can never change them." Display the Identity Confidence Score prominently next to the Generate button.

---

#### C2 — Undo/Redo Is Invisible (Opacity-0 Until Hover)
**Evidence**: `PortraitGenerator.tsx` line 735: the undo/redo control container has `opacity-0 group-hover:opacity-100 transition-opacity`. It only appears when the user hovers over the image preview area. On mobile (touch), hover does not occur at all. New users will never discover that they can undo an edit.

**User Impact**: The edit history system is one of the most technically sophisticated features in the product — per-portrait undo stacks, visual thumbnail history strip, step counter. A user who applies a clothing edit they dislike and cannot find undo will regenerate from scratch (at API cost) or abandon. ICP 2 (Fractional Expert) explicitly values "History strip + undo/redo" as a Medium-priority feature.

**Remediation**: Make the undo/redo controls permanently visible below the image (not hover-gated). The step counter ("2 / 3") already communicates edit depth — use it. Replace `opacity-0 group-hover:opacity-100` with visible-but-subtle styling (e.g., `opacity-40 group-hover:opacity-100`).

---

#### C3 — Regional Edit Mode Has Zero Marketing Presence
**Evidence**: The "Region" edit mode (target: background only / clothing only / lighting only / hair only / color grading only) is the fourth button in a four-button edit mode grid in the Step 3 sidebar, labeled "Region" with a Target icon. No tooltip. No explanation on Step 2. Not mentioned in the hero tagline. Not called out on the Upload screen.

**User Impact**: This is the feature that directly addresses ICP 1's objection: "I need a specific environment / company colors." And ICP 2's: "I need exact background colors to match my brand." Neither ICP will discover that per-region editing is available from the current UI. Regional editing is a genuine technical differentiation — BetterPic has partial regional editing only via AI prompt, HeadshotPro has "Remix" (background swap only). ProPortrait's region targeting with identity preservation is unique.

**Remediation**: Rename "Edit Studio" to make it a branded feature name with its own marketing moment. Add a callout on Step 2 (under the Generate button): "After generation, use the Edit Studio to change only your background, clothing, or lighting — without touching your face." Dedicate a bullet point on the landing page to this.

---

#### C4 — No In-App Feedback Mechanism
**Evidence**: No NPS widget, no star rating, no "Was this useful?" prompt, no "Report an issue" button exists anywhere in the codebase. Errors caught in `handleGenerate` and `handleEdit` are surfaced as a generic red text message: "Failed to generate portrait. Please try again." There is no path for a user to report a bad output, a generation failure, or a bug.

**User Impact**: The product cannot learn from failures. Users who get a result that changed their eye color (identity lock failure), darkened their skin tone (skin tone preservation failure), or produced an uncanny valley result have no way to signal this. The product also cannot build social proof from users who are delighted. Both ICPs need different reassurance: Career Pivotter needs to know the product is monitored; Fractional Expert needs to know their specific issue was heard.

**Remediation**: Add a four-star thumbs-up/thumbs-down micro-feedback widget below each generated image on Step 3. On thumbs-down, show a two-field form: "What went wrong?" (dropdown: changed my appearance / wrong style / quality issue / other) + optional text. Feed to PostHog (per ORACLE's recommendation) with the full generation settings as properties. Add a "Report generation issue" link in the error message on generation failure.

---

### HIGH

#### H1 — "Copy Settings JSON" Is a Developer Feature Marketed to Non-Developers
**Evidence**: `PortraitGenerator.tsx` lines 287-300: the `handleCopyPreset` function copies a raw JSON object `{ style, likenessStrength, naturalness, naturalnessPreset, expressionPreset, identityLocks, numVariations, removeBlemishes }` to the clipboard. The button label is "Copy Settings JSON" — explicitly developer-facing terminology. There is no "Load Preset" companion feature (paste JSON → apply settings). The feature cannot be discovered or used by a non-technical Fractional Expert ICP user who wants to share settings with their VA.

**User Impact**: ICP 2 (Fractional Expert) rates this feature as High priority — "Will save optimal configuration; may share with VA or a community of practice." But "Copy Settings JSON" fails this user because: (a) JSON is not legible to a non-developer VA, (b) there is no import/load capability so the settings cannot actually be applied by someone who receives the JSON, (c) the feature name suggests it is a technical export, not a "Share My Look" preset.

**Remediation**: Rename to "Save Preset" / "Share My Look". Add a Load Preset button (paste JSON → parse → apply to all sliders). Add a named preset gallery (3-5 pre-built looks: "Executive LinkedIn", "Speaker Stage", "Natural Creator", "Conservative Resume") as a visual alternative to manual configuration. Gate the Save/Load feature behind Pro to create a conversion touchpoint.

---

#### H2 — No Batch Processing for Teams — Largest Revenue Gap
**Evidence**: `PortraitGenerator.tsx` accepts a single `selectedImage` state variable. There is no multi-file upload, no queue system, no team management. The `numVariations` control (2 or 4) varies outputs for a single person, not batch-processes multiple people.

**User Impact**: Companies needing headshots for 10-50 employees — the highest-LTV customer segment — cannot use ProPortrait. This is the market that Aragon, HeadshotPro, BetterPic, and Secta Labs all serve, and it is the segment that pays $149-$499 per session rather than $9.99-$29.99. The VAULT report estimates Teams pricing at $99-$249/month.

**Competitive Context**: HeadshotPro's Remix feature specifically targets teams. BetterPic's enterprise API is designed for batch consistency. These competitors own the corporate team segment.

**Remediation**: Design a "Team Session" mode: multi-photo upload queue (up to 10 photos), each processed with identical locked settings, bulk download as a ZIP. This can be implemented as an extension of the existing single-session flow. Position it as "Company Headshot Day" — replace the $300/person professional photographer session with a 30-minute bulk AI run at $99 per session.

---

#### H3 — No API Product for Developer/Enterprise Integration
**Evidence**: No API endpoint, no API documentation, no API key management in the codebase. The Gemini API key is consumed client-side in `ai.ts`. There is no server-side generation endpoint that a third party could call.

**User Impact**: Developer Advocates, HR tech vendors, resume builders, ATS providers, and LinkedIn third-party tools cannot integrate ProPortrait into their workflows. Magic Hour API is explicitly positioned for this use case. BetterPic's enterprise offering centers on API access. A platform API would unlock a B2B distribution channel that does not require ProPortrait to acquire each user individually.

**Remediation**: Expose a `POST /api/generate` endpoint accepting `{ imageBase64, settings }` and returning `{ portraits: string[] }`. Wrap it with API key authentication. Build a minimal developer documentation page. Price at $0.10-$0.25 per API call for a margin-positive offering. The FORGE report already specifies the Express backend infrastructure for this.

---

#### H4 — No Pre-Generation Style Preview / Sample Gallery
**Evidence**: The 16-style grid in Step 2 shows icons (Briefcase, Palette, Camera) and a two-word description ("Professional & Trustworthy", "Modern & Artistic"). There are no sample before/after images for each style. A user selecting "Speaker" or "Academic" has no visual reference for what that style produces.

**User Impact**: ICP 2 (Fractional Expert) wants to "see how they look in multiple styles before committing to brand direction." Without sample outputs per style, users either select blindly (increasing regeneration rate and API cost) or default to the first style they recognize ("Corporate"), missing the platform-specific styles that are ProPortrait's unique value proposition. Secta Labs leads with style galleries. Aragon shows sample outputs.

**Remediation**: Add a 2-3 example portrait thumbnail to each style card (generic model photos, not user-uploaded). Add a "View Style Examples" expandable gallery above the style grid. This requires only static images, no AI calls.

---

#### H5 — No Onboarding Flow or Feature Orientation for New Users
**Evidence**: The current Step 1 UI goes directly from the upload zone to the "Best Results" / "Avoid" tip cards. There is no feature orientation, no "What makes ProPortrait different" intro, no tooltip tour, no callout of the identity lock system before the user uploads.

**User Impact**: Both ICPs arrive with prior AI headshot trauma (ICP 1: "It won't look like me") or brand skepticism (ICP 2: "It will look like AI"). The product's most powerful answer to both objections — the identity lock system — is introduced only after upload, buried in Step 2's Advanced Settings. First impressions are formed on Step 1 where no differentiators are visible.

**Remediation**: Add a three-step feature callout on the empty Step 1 state (before any upload): "Identity Locked | Edit Studio | Platform-Ready." Each callout links to a one-sentence explainer. Show this as an animated or static explainer below the upload zone. Alternatively, add a "How it works" tooltip on first visit that highlights the three differentiators in sequence.

---

### MEDIUM

#### M1 — Expression Presets Are Not Marketed as a Pain Point Solution
**Evidence**: The expression control section in Step 2 is labeled "Expression Control" with a subtitle "Fix the 'blank stare' problem." This is accurate — the blank stare / dead eyes problem is well-documented in AI headshots. But the feature is presented as a secondary control rather than a primary differentiator.

**Competitive Context**: No competitor offers named expression presets. Aragon preserves the original expression. BetterPic does not offer expression control. This is a genuine gap in the market that ProPortrait fills, but the "Fix the blank stare problem" framing is too internal — it assumes users know what the blank stare problem is.

**Remediation**: Rename section to "Expression" and add a social proof line: "Most AI headshots produce a vacant, plastic stare. Choose your expression before we generate." Test whether leading with this problem statement increases expression preset engagement (currently unmeasured per ORACLE's report).

---

#### M2 — Before/After Comparison Slider Discoverability
**Evidence**: `PortraitGenerator.tsx` line 724-731: the "Compare Original" toggle button is positioned in the top-right corner of the image preview area, styled as a small pill button with `SplitSquareHorizontal` icon. It is visually subtle and not called out in any onboarding flow.

**User Impact**: The before/after comparison slider directly addresses ICP 1's success metric: "The photo passes the 'do I still look like myself' test with a trusted friend." This is a trust-building feature that is effectively invisible to new users. ICP 1 rates this as Medium priority but explicitly values it for identity validation.

**Remediation**: On first arrival at Step 3, show a one-time tooltip or pulsing indicator on the "Compare Original" button: "Click to see how much you've changed (or haven't)." Auto-activate compare mode for 3 seconds on first Step 3 entry as a micro-demo.

---

#### M3 — Group Photo Person Selector Has No Discovery Path
**Evidence**: The group photo person selector (left/center/right/custom) is rendered only on Step 2 when `selectedImage` is set, below the photo thumbnail. It is labeled "Group photo? Select which person to use" in small text. There is no indication on Step 1 that group photos are supported.

**User Impact**: Users with group photos who need to extract a single subject will not know this feature exists. They will either crop manually before uploading (creating a worse input) or be confused by multi-face AI results. Group photo support is a concrete differentiator that saves a common upload friction.

**Remediation**: Add "Group photo? We'll let you pick one person." to the Step 1 upload tips (the "Best Results" panel). Alternatively, show the person selector only if the uploaded photo appears to contain multiple faces (this requires face detection logic, which is a V2 enhancement).

---

#### M4 — No Social Proof, Testimonials, or Usage Statistics
**Evidence**: The application has no testimonials, no star ratings, no "X portraits generated" counter, no "Join Y professionals who use ProPortrait" social proof. The landing page does not exist (per VAULT report). The product header reads "The only AI portrait tool that actually looks like you" — a strong claim with no supporting evidence.

**User Impact**: Both ICPs are research-before-buying personalities who will evaluate proof before paying. ICP 1 specifically cites "LinkedIn peer observation" as a discovery channel — they already have one form of social proof (seeing a peer's new headshot). But once on the product, there is nothing to reinforce that trust.

**Remediation**: Add a "Trusted by X professionals" counter to the header (start at 500+ once generation count is tracked per ORACLE's plan). Add 3-5 short testimonials to the Step 1 screen: "Finally an AI headshot that kept my eye color — [Name], Product Manager at Stripe." Gate behind real users but can be synthetic placeholders during pre-launch.

---

#### M5 — No Mobile Experience Validation
**Evidence**: The UI uses Tailwind responsive classes (`sm:`, `md:`, `lg:`) but is primarily designed for a wide desktop layout. The style grid is `grid-cols-8` on large screens. The edit sidebar is fixed at `w-72`. No mobile-specific flow is implemented. The comparison slider component (`ComparisonSlider.tsx`) was not audited for touch interaction.

**User Impact**: ICP 1 (Career Pivotter) is likely to discover the product via Reddit on mobile during a commute (per ICP.md discovery channels). If the first experience is broken on mobile, conversion is zero at that touchpoint.

**Remediation**: Mobile audit pass: verify the style grid collapses correctly, confirm the ComparisonSlider handles touch drag, validate that the undo/redo controls are reachable on touch (currently hover-only — already flagged in C2).

---

### LOW

#### L1 — "Download All Platforms" Is Not Positioned as a Feature — It Is Invisible
**Evidence**: The "Download All Platforms" button is the last item in the export sidebar, preceded by 5 individual platform buttons, after a separator line. Its label is "Download All Platforms" with a Package icon. It is not mentioned anywhere earlier in the wizard.

**Remediation**: Mention "Get LinkedIn + Resume + GitHub in one click" on the Step 2 Generate button area. Make the batch download the primary CTA on Step 4 with a larger visual treatment. This converts the export step from "choose one download" to "get everything you need for your job search."

---

#### L2 — No Aspect Ratio Preview Context
**Evidence**: The Step 4 aspect ratio selector (1:1 / 3:4) shows only ratio labels without visual previews showing what each ratio would look like cropped from the current portrait.

**Remediation**: Add tiny ratio preview thumbnails showing the crop frame over a miniaturized version of the current portrait. Reduces user uncertainty about whether their head will be cut off.

---

#### L3 — No Reference to Skin Tone Preservation in the Step 1 Privacy Notice
**Evidence**: `PrivacyNotice.tsx` was not read in full but based on its import and the ORACLE report's mention, the notice addresses data handling but not the skin tone preservation guarantee that ICP 2 specifically requires.

**Remediation**: Add one sentence to the Privacy Notice: "Your skin tone is locked by default — we instruct the AI to never lighten or darken it." This turns the privacy notice from a pure legal/data notice into a trust-building product statement.

---

## Feature Gap Prioritization

| Feature | User Impact | Effort | Priority | ICP Alignment |
|---------|-------------|--------|----------|---------------|
| Surface identity locks above the fold in Step 2 | High | XS | P0 | ICP 1 (trust restoration) |
| Make undo/redo permanently visible (remove hover-gate) | High | XS | P0 | ICP 2 (power user) |
| Add in-app feedback mechanism (thumbs + dropdown) | High | S | P0 | Both ICPs |
| Visual preset gallery (replace "Copy Settings JSON") with Load Preset import | High | S | P1 | ICP 2 (VA sharing) |
| Style examples / sample gallery per style card | High | S | P1 | ICP 2 (brand exploration) |
| Regional edit studio: market as named feature with Step 2 callout | High | XS | P1 | Both ICPs |
| Onboarding: 3-feature callout on Step 1 (before upload) | Medium | S | P1 | ICP 1 (objection removal) |
| Before/after slider: auto-activate for 3 seconds on first Step 3 visit | Medium | XS | P1 | ICP 1 (identity trust) |
| Batch processing for teams (multi-photo queue) | High | L | P2 | Teams segment (new) |
| Developer API endpoint (`POST /api/generate`) | Medium | L | P2 | Enterprise/developer |
| NPS survey (post-download, 10 seconds after download) | Medium | S | P2 | Product learning |
| Landing page with before/after, pricing, social proof | High | M | P2 | Acquisition |
| Named preset gallery ("Executive LinkedIn", "Speaker Stage") | Medium | S | P2 | ICP 2 |
| Mobile audit + ComparisonSlider touch support | Medium | S | P2 | ICP 1 (Reddit mobile discovery) |
| Social proof counter ("X portraits generated") | Low | XS | P3 | Both ICPs |
| Expression preset: add pain point framing in subtitle | Low | XS | P3 | Both ICPs |
| Group photo: mention on Step 1 upload tips | Low | XS | P3 | Edge segment |
| Hex color input for custom background color | Medium | S | P3 | ICP 2 (brand palette) |
| "Company Headshot Day" team session flow | High | XL | P3 | Enterprise/teams |

---

## Product Positioning Statement

**Current (from `PortraitGenerator.tsx` line 372)**:
"The only AI portrait tool that actually looks like you — identity-locked, skin-tone guaranteed, platform-ready."

This is technically accurate but structurally weak. "Identity-locked" is jargon; "skin-tone guaranteed" is a claim with no visible proof mechanism; "platform-ready" undersells the multi-platform export capability. The tagline also competes on category definition ("AI portrait tool") rather than outcome ownership.

**Recommended Positioning (V1)**:

**For Career Pivotters**:
"Get a professional headshot in 2 minutes that still looks like you — not a stock photo version of you. Identity-locked. Platform-ready."

**For Fractional Experts**:
"Your face is your brand. ProPortrait keeps it consistent across every platform — without a photographer, without a wait, without changing who you are."

**Universal Core Positioning Statement**:
ProPortrait AI is the real-time professional portrait studio for people who need to look like themselves, not like an AI's idea of what "professional" means. Unlike batch AI headshot services that take 2 hours and require 12 photos, ProPortrait generates in under 2 minutes from a single photo — and locks your eye color, skin tone, hair, and expression so the AI never drifts from who you actually are.

**Proof Points to Lead With**:
1. Single photo upload (competitors require 8-15)
2. Results in under 2 minutes (competitors: 1-3 hours)
3. Per-feature identity locks (unique in the market)
4. Real-time Edit Studio (not "submit and wait")
5. Platform-optimized batch download (LinkedIn + Resume + GitHub in one click)

---

## Differentiation Map

### ProPortrait Uniquely Owns

1. **Real-time generation from a single photo**: All major competitors (Aragon, HeadshotPro, BetterPic, Secta) require 8-15 photos and 1-3 hours. ProPortrait is the only product where a user can go from phone photo to LinkedIn-ready portrait in under 5 minutes with a single source image. This is the structural speed and simplicity advantage.

2. **Granular identity locks (per-feature, not just "likeness level")**: Competitors offer general "identity strength" sliders at best. ProPortrait's 5 discrete toggles (eye color, skin tone, hair length, hair texture, glasses) allow surgical control over which features the AI is permitted to modify. This is the product's core technical moat and directly addresses the #1 objection in AI headshots: "It won't look like me."

3. **Real-time iterative editing studio with undo/redo and history**: HeadshotPro offers "Remix" (background swap). BetterPic offers partial AI prompt editing. ProPortrait offers a full in-session Edit Studio with 4 edit modes, regional targeting, free-text prompts, per-portrait undo stacks, visual history thumbnails, and a before/after comparison slider. No competitor matches this editing depth.

4. **Named expression presets that address the "blank stare" problem**: The AI headshot blank stare/dead eyes problem is widely documented in user reviews. ProPortrait is the only product with a named solution: 5 expression presets (Confident Neutral, Warm Smile, Serious Authority, Approachable Expert, Natural). This directly solves a universal pain point.

5. **Group photo person selection**: Upload a team photo and select which person to convert — by position (left/center/right) or by natural language description. No competitor handles this use case.

6. **Naturalness slider with texture preservation**: The over-smoothed "botox look" / "plastic skin" problem is ProPortrait's most visible differentiator in user reviews of competitor tools. The naturalness slider with explicit texture language in the AI prompt directly prevents this failure mode.

### ProPortrait Is Competitive On

- Platform-optimized export dimensions (shared with BetterPic)
- Transparent background export (shared with BetterPic)
- Style variety (16 vs. 20+ for most competitors — within range)
- Privacy: no server-side storage (unique claim, not verified by competitors)

### ProPortrait Trails On

- Image volume per session (2-4 vs. 40-300 for competitors)
- Resolution ceiling (1K AI native vs. BetterPic's 4K)
- Team/enterprise tooling (absent vs. present for all major competitors)
- Brand recognition and social proof (new entrant vs. 200K+ user claims from Aragon)
- API access for developer integrations (absent vs. BetterPic, Magic Hour)

---

## V2 Feature Roadmap

Prioritized by user value to both ICPs and competitive gap coverage.

### V2.1 — Discovery & Conversion (2 weeks, 0 API changes needed)

| Feature | Rationale |
|---------|-----------|
| Move identity locks above style grid in Step 2 | Highest-leverage discoverability fix; 0 engineering cost |
| Remove hover-gate from undo/redo | Immediate power-user retention improvement |
| Add 3-feature callout on Step 1 (before upload) | Objection removal before the user has any friction |
| Add "Compare Original" auto-activation on first Step 3 visit | Identity trust validation; drives before/after social sharing |
| Add style example thumbnails (static images) to each style card | Reduces blind selection, increases LinkedIn/Speaker/Creative Pro adoption |
| Named preset gallery UI (visual, with Load Preset import) | Replaces developer JSON feature with user-facing shareable presets |

### V2.2 — Feedback & Learning (1 month)

| Feature | Rationale |
|---------|-----------|
| In-app thumbs up/down micro-feedback on Step 3 | First signal on generation quality; feeds ORACLE analytics |
| Post-download NPS (10 seconds after download) | Industry-standard quality signal; required before any paid launch |
| Generation issue categorization (wrong appearance / style / quality) | Structured feedback that feeds AI prompt improvement without user PII |
| "Report issue" on error message | Converts error states from abandonment to engagement |

### V2.3 — Power User Features (6-8 weeks)

| Feature | Rationale |
|---------|-----------|
| Load Preset (paste JSON → apply settings) | Completes the share/reuse preset loop; currently half-implemented |
| Hex color input for background (regional edit) | ICP 2's concrete brand palette requirement |
| Side-by-side style comparison (generate 2 styles in parallel) | ICP 2's explicit desire to compare Speaker vs. Creative Industry before committing |
| Mobile-optimized layout audit + ComparisonSlider touch fix | Validates ICP 1's Reddit mobile discovery channel |
| "Download All Platforms" as primary Step 4 CTA | Repositions export from single download to "your complete professional photo kit" |

### V2.4 — Team & Enterprise Expansion (3 months)

| Feature | Rationale |
|---------|-----------|
| Multi-photo queue (batch upload up to 10) with shared settings | Unlocks the highest-LTV customer segment (team headshot sessions) |
| Company Preset (shared JSON with import + lock) | Team tier feature; standardizes brand headshot look across all employees |
| Bulk download ZIP | Required for teams; no manual per-person download |
| Admin usage dashboard (per-user generation count) | Required for team tier billing justification |
| Developer API (`POST /api/generate`, API key auth) | Unlocks B2B distribution channel; requires FORGE backend |

### V2.5 — Market Expansion (6 months)

| Feature | Rationale |
|---------|-----------|
| 4K AI resolution (Gemini `imageSize: '4K'`) | Closes the BetterPic print quality gap; required for conference print materials |
| Additional style packs (Industry-specific: Legal, Healthcare, Finance, Creative) | Style pack drops as product updates; drives re-engagement and media coverage |
| Portrait cloud history (30-day storage for Pro) | Enables "update your look" use case without re-uploading original photos |
| Public preset gallery / community presets | Network effect feature; creators share preset configs as "looks" |
| AI face analysis feedback ("Your photo has great lighting — we can work with this") | Turns upload step from passive to interactive; builds confidence before generation |

---

## Feedback Mechanism Design

### Tier 1 — Inline Micro-Feedback (MVP)

**Placement**: Step 3, below each generated image thumbnail in the variations sidebar.

**UI**: Two icon buttons — thumbs up (green on hover) and thumbs down (red on hover). No text, no modal for the thumbs-up path.

**On Thumbs Down**: Expand a three-field form inline:
- **What went wrong?** (dropdown): "Changed my appearance" / "Wrong style result" / "Skin quality issue" / "Lighting problem" / "Other"
- **Optional detail**: Single-line text input, 140-character max
- **Submit** button → closes form, shows "Thanks — we'll use this to improve."

**Data captured** (per PostHog event `generation_feedback_submitted`):
- `rating` (positive / negative)
- `issue_type` (string from dropdown)
- `detail_length` (integer, not the text — avoids PII)
- `style`, `expression_preset`, `naturalness`, `identity_locks_active_count`, `session_id`

**No PII captured**. The feedback is correlated with generation settings, not the image.

---

### Tier 2 — Post-Download NPS (Week 4+)

**Trigger**: 10 seconds after the first successful download event (`portrait_downloaded`).

**UI**: Slide-up toast notification (not a modal blocker): "How likely are you to recommend ProPortrait to a colleague? [1–10 scale]"

**On score 9-10 (Promoters)**: Show "Would you share your experience? [Twitter share link pre-filled] [Skip]"

**On score 7-8 (Passives)**: Show "What would make it better? [Optional text] [Skip]"

**On score 0-6 (Detractors)**: Show "What went wrong? [Same dropdown as Tier 1] [Optional text] [Submit]"

**Data captured per PostHog event `nps_submitted`**:
- `nps_score` (integer 1-10)
- `has_comment` (boolean)
- `comment_length` (integer, not the text)
- `style`, `is_pro`, `session_id`

**Target NPS for launch**: ≥ 40 (competitive benchmark for B2C SaaS tools; Apple iPhone is ~72, Slack is ~33).

---

### Tier 3 — Error State Feedback (Immediate)

**Trigger**: Any `setError()` call in `handleGenerate` or `handleEdit`.

**Current UI** (`PortraitGenerator.tsx` lines 148-153): "Failed to generate portrait. Please try again." (red text, no action).

**Proposed UI**: Replace static red text with an expandable error card:
- "Generation failed. [Try Again] [Report This Issue]"
- On "Report This Issue": pre-filled form with session context (style, settings, error message from catch block — not the image). Single-click submit.
- Routes to a monitored email or PostHog event `generation_error_reported`.

---

## Hidden Feature Discovery Plan

The following features are confirmed in code but not discoverable by a first-time user without deliberate exploration.

### Feature: Undo/Redo + Edit History Strip

**Current state**: `opacity-0 group-hover:opacity-100` — invisible until hover. History strip appears only after 2+ edits.

**Discovery interventions**:
1. Remove hover-gate entirely (permanent visible state at reduced opacity, full opacity on hover).
2. After first edit completes, show a one-time tooltip pointing at the undo button: "Don't like it? Undo it."
3. After second edit, show the history strip with a subtle pulse animation on the thumbnails for 2 seconds.
4. Add a small "2 / 3" step counter always visible below the image (not just inside the hover overlay).

### Feature: Regional Edit Mode

**Current state**: Fourth button in a four-button grid on Step 3 sidebar, labeled "Region". No explanation.

**Discovery interventions**:
1. Add a callout on Step 2 below the Generate button: "After generation, the Edit Studio lets you change only your background, clothing, or lighting — without touching your face."
2. Add a tooltip to the "Region" button on hover: "Target a specific area — background, clothing, lighting, or hair — and change only that."
3. On first Step 3 visit, show a one-time coach mark on the Region button: "Try Region Edit — the most powerful feature."
4. Add "Region Edit" to the product's feature list on any landing page.

### Feature: Expression Presets

**Current state**: Rendered in a clearly labeled section on Step 2 with a subtitle "Fix the 'blank stare' problem." Reasonably discoverable for desktop users who scroll, but may be skipped by users who go directly from style selection to the Generate button.

**Discovery interventions**:
1. Anchor the Generate button CTA below the expression section (currently, Generate is at the bottom of the entire Step 2 panel — users must scroll past expression and advanced settings to reach it). Consider a sticky "Generate" CTA that follows the user down the page.
2. Add a micro-animation to the expression section header on first load: the emoji sequence cycles once (😐→😊→😤→🙂→✨) to catch peripheral attention.
3. Add "Expression" as a visible label in the 4-step progress indicator ("Style & Expression" instead of just "Style") so users know this step contains expression control.

### Feature: Identity Locks

**Current state**: Inside "Advanced Settings" block on Step 2 below style grid and expression presets. Collapsed appearance. Defaults to ON for three locks (eye color, skin tone, hair length) — which means users get the benefit without ever seeing the control.

**Discovery interventions**:
1. Move identity locks to the top of Step 2, above the style grid. Label the section: "What the AI will never change about you."
2. Add a prominent display of the current lock status: "3 features locked: Eye Color, Skin Tone, Hair Length [Edit locks]."
3. Show the Identity Confidence Score as a top-level status indicator, not buried at the bottom of Advanced Settings.
4. On first generation completion (Step 3 entry), show a one-time callout: "Your eye color, skin tone, and hair length were locked — the AI was not allowed to change them."

### Feature: Compare Original Slider

**Current state**: Button in top-right of image preview, visually subtle. No auto-activation.

**Discovery interventions**:
1. Auto-activate comparison mode for 3 seconds when Step 3 first loads. Slide slowly from left to right, then stop at center. This demonstrates the feature passively.
2. After auto-demo ends, show a tooltip: "Drag to compare before and after."
3. Add "(compare with original)" as a note next to the image on Step 3, clickable.

### Feature: Group Photo Person Selector

**Current state**: Visible only on Step 2, in small text below the uploaded photo thumbnail.

**Discovery interventions**:
1. Add to Step 1 "Best Results" tip card: "Uploading a group photo? You'll pick which person to use in the next step."
2. On Step 2, use a more prominent separator/section for person selection: "Who's in this photo?" with a single-person icon and group-person icon toggle, not just text.

---

## Dependencies

- **Requires**: ORACLE (usage data — feature adoption rates for styles, expressions, identity lock engagement rates are needed to validate all prioritization in this report; currently 0% analytics coverage per ORACLE)
- **Requires**: VAULT (monetization enforcement — conversion touchpoints in this report assume free tier limits exist; currently unlimited free usage undermines all paywall-adjacent features)
- **Feeds into**: FORGE (batch processing architecture for teams requires new server-side queue; API endpoint spec feeds FORGE's backend roadmap)
- **Feeds into**: ATLAS (visual preset gallery design; style examples per card; onboarding coach marks; all are ATLAS UI deliverables informed by this report's feature prioritization)
- **Feeds into**: SENTINEL/GUARDIAN (feedback mechanism's error reporting data feeds the monitoring and alerting systems; no feedback data currently exists)

---

## Prioritized Remediation Plan

**Priority 0 — Feature Visibility Fixes (Day 1, zero engineering risk)**

These require only CSS/JSX changes to existing features that already work:

1. Move Identity Locks section to the top of Step 2 (above style grid). CSS reorder only.
2. Remove `opacity-0 group-hover:opacity-100` from the undo/redo container. Replace with `opacity-50 group-hover:opacity-100`.
3. Add a three-line callout below the upload zone on Step 1: "Identity Locked | Edit Studio | Platform-Ready" — three spans with icon + label.
4. Add a one-sentence "Region Edit" callout below the Generate button on Step 2.

**Estimated time**: 2-3 hours. Zero regression risk. Immediate discoverability improvement for the product's three strongest differentiators.

---

**Priority 1 — Trust & Feedback Mechanisms (Week 1, requires PostHog from ORACLE Sprint 1)**

5. Add thumbs up/down micro-feedback widget on Step 3 image sidebar.
6. Route generation failures to a "Report Issue" action rather than bare red text.
7. Add "Copy Settings JSON" rename to "Save My Look" and pair with Load Preset input (paste JSON → apply).
8. Auto-activate before/after comparison slider for 3 seconds on first Step 3 visit.

**Estimated time**: 8-12 hours total. Depends on PostHog (ORACLE Sprint 1) for feedback event capture.

---

**Priority 2 — Marketing & Conversion (Week 2-3, requires landing page from VAULT Priority 9)**

9. Build style example gallery: static before/after thumbnail for each of 16 styles.
10. Add social proof counter to the header: "Join 2,400+ professionals who look like themselves."
11. Add post-download NPS toast trigger (10 seconds after download event).
12. Create landing page with before/after comparison, competitive positioning, pricing table.

**Estimated time**: 20-30 hours. Static content + landing page. No API changes.

---

**Priority 3 — Team & Scale Features (Month 2-3, requires FORGE backend)**

13. Multi-photo queue for batch team sessions (up to 10 people).
14. Company Preset (shared JSON + lock + import) as a Teams tier feature.
15. Bulk ZIP download for team batch sessions.
16. Developer API endpoint with API key authentication.

**Estimated time**: 3-4 sprint weeks. Requires FORGE database and Express backend completion.

---

*Competitive data sources: [AI Headshot Comparison — Technology.org](https://www.technology.org/2026/02/24/ai-headshot-generator-comparison-7-tools-ranked-by-usable-results/), [Secta Labs comparison](https://secta.ai/blog/p/best-ai-headshot-generator-comparison), [Pixelbin 15 Best 2026](https://www.pixelbin.io/blog/best-ai-headshot-generator), [PostEverywhere 20 Best 2026](https://posteverywhere.ai/blog/20-best-ai-headshot-generators), [BestPhoto Top 5 2026](https://bestphoto.ai/blog/top-5-ai-headshot-generators-2026), [Lummi Best AI Headshots 2026](https://www.lummi.ai/blog/best-ai-headshot-generators), [Magic Hour AI Headshot APIs](https://magichour.ai/blog/best-ai-headshot-apis), [Genesys Growth Aragon vs HeadshotPro vs BetterPic](https://genesysgrowth.com/blog/aragon-ai-vs-headshotpro-vs-betterpic)*
