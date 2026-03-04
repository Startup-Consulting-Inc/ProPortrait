# ORACLE — Analytics & Data Audit Report

**Agent**: ORACLE
**Role**: Measurement architect, data strategist
**Date**: 2026-03-02
**Status**: Complete

---

## Executive Summary

ProPortrait AI has **zero analytics instrumentation**. There is no tracking of any kind — no page views, no user actions, no error rates, no generation times, no feature adoption, no funnel data, and no API cost visibility. The application generates AI portraits using Gemini at a non-trivial API cost per request (estimated $0.08–$0.25 per generation session), but has no way to know how many generations are happening, which features drive retention, or whether users complete the funnel to download.

This is a critical business intelligence gap. The product cannot be improved with data, cannot be priced correctly without cost data, and cannot be A/B tested without a measurement foundation.

**Total trackable user actions identified**: **47 distinct events** across 4 steps.
**Currently tracked**: **0**.
**Analytics coverage**: **0%**.

---

## Current Analytics State

**State: Nothing**

| Layer | Status | Detail |
|-------|--------|--------|
| Page-level tracking | Not present | No GA4, no Plausible, no Fathom |
| Event tracking | Not present | No calls to any analytics SDK anywhere in codebase |
| Error reporting | Not present | Errors caught in try/catch, logged to console only — no Sentry, no Rollbar |
| Performance monitoring | Not present | Generation time never measured; no `performance.now()` calls |
| Session recording | Not present | No Hotjar, FullStory, or LogRocket |
| API cost tracking | Not present | No token counting, no request counting, no cost attribution |
| Feature flags / A/B | Not present | `isPro` is a hardcoded client-side boolean (line 72), not a real gate |
| Analytics dependencies | Zero | `package.json` contains no analytics libraries |
| Tracking scripts | Zero | `index.html` has no `<script>` tags beyond the app entry point |
| Server-side logging | Not present | `better-sqlite3` and `express` are in `package.json` but no analytics server exists |

**Code confirmation** — `src/services/ai.ts` error handling (lines 261–264, 309–313):
```typescript
} catch (error) {
  console.error("Error generating portrait:", error);
  throw error;
}
```
Every API failure is silently dropped after a `console.error`. No reporting, no alerting, no aggregation.

**Code confirmation** — `src/components/PortraitGenerator.tsx` generation handler (lines 148–153):
```typescript
} catch (err) {
  console.error(err);
  setError('Failed to generate portrait. Please try again.');
} finally {
  setIsGenerating(false);
}
```
No duration measurement before or after the `generateProfessionalPortrait` call. No success event. No failure event.

---

## Findings

### CRITICAL

**C1 — Zero error visibility**
API failures at the Gemini layer (rate limits, quota exhaustion, model errors, "No image generated" exceptions) are swallowed by console logs. There is no way to know the current error rate, which error types dominate, or when the service degrades. If the Gemini model name changes or the API returns a new error format, the product silently breaks with no alert.
- **Impact**: Cannot detect outages, cannot calculate reliability SLA, cannot debug user-reported failures.
- **Fix**: Sentry.io (free tier covers this). Instrument `generateProfessionalPortrait` and `editProfessionalPortrait` catch blocks.

**C2 — Generation time is completely unmeasured**
The UI shows "This may take 20–40 seconds" (line 681) but the actual time is never recorded. The retouch pass in `ai.ts` adds a second full Gemini round-trip for every generation (lines 217–259), effectively doubling API cost and latency when `removeBlemishes=true`. This is invisible.
- **Impact**: Cannot validate SLA, cannot detect model performance degradation, cannot calculate true cost-per-generation.
- **Fix**: `const t0 = performance.now()` before the `generateProfessionalPortrait` call, emit `portrait_generation_completed` with `duration_ms` on success.

**C3 — API cost is completely unknown**
Each generation with `numVariations=2` and `removeBlemishes=true` makes 4 Gemini API calls (2 generate + 2 retouch). With `numVariations=4`, it makes 8 calls. The `imageSize: '1K'` config produces 1-megapixel images. The product has no cost-per-session data, making pricing, rate limiting, and abuse detection impossible.
- **Impact**: Cannot set sustainable pricing. Cannot detect cost runaway from a single heavy user. Cannot calculate LTV/CAC.
- **Fix**: Track `api_calls_made` per session, `has_retouch_pass`, and `num_variations` in every generation event.

**C4 — Funnel is completely blind**
There are 4 steps in the wizard. The product has no idea what percentage of users who upload a photo actually click Generate, and what percentage of those reach Download. If 90% of users abandon at Step 2, there is no way to know.
- **Impact**: Cannot optimize conversion, cannot identify drop-off points, cannot justify any UI change with data.
- **Fix**: Track `step_viewed` for each step transition. All step transitions are in one component — it is a 4-line instrumentation.

### HIGH

**H1 — No feature adoption data**
16 styles are available. There is no data on which styles are used. If `linkedin` is used by 60% of users and `cartoon` by 0.5%, that directly informs product roadmap. The same applies to expression presets (5 options), identity locks (5 toggles), naturalness presets (3 options), and numVariations (2 or 4).
- **Impact**: Roadmap decisions are made by intuition, not data.
- **Fix**: Include `style`, `expression_preset`, `identity_locks_active_count`, `naturalness_preset`, and `num_variations` as properties on the `portrait_generation_started` event.

**H2 — Edit studio usage is unmeasured**
Step 3 contains a full AI edit loop (clothes, background, color grading, region editing, custom prompts, undo/redo, compare mode). Each edit is another Gemini API call. Whether users engage with the editor at all — or skip straight to export — is unknown. Whether the compare slider is ever used is unknown.
- **Impact**: Cannot justify continued investment in the edit studio without adoption data.
- **Fix**: Track `edit_initiated`, `edit_completed`, `edit_mode_selected`, `compare_mode_toggled`, `undo_used`, `redo_used`.

**H3 — No download conversion tracking**
The final step has 7 download actions: standard download (free/pro), plus 5 platform-specific downloads (LinkedIn, GitHub, Twitter, Instagram, Resume/CV), plus "Download All Platforms". There is no data on which are used.
- **Impact**: Cannot measure the core value delivery moment. Cannot know if platform export is a valued feature.
- **Fix**: Track `portrait_downloaded` with `download_type` (standard/platform/all), `platform`, `format`, `is_pro`.

**H4 — Pro upgrade is a mock**
The "Unlock for $9.99" button (line 991) calls `setIsPro(true)` — it is a free client-side state toggle with no payment processing, no server call, and no analytics. If real monetization is ever added, there is no baseline conversion data.
- **Impact**: Cannot measure upgrade intent, click-through, or conversion funnel for monetization.
- **Fix**: Track `pro_upgrade_clicked` immediately. When real payment is integrated, add `pro_upgrade_completed`.

**H5 — Privacy notice dismissal is untracked**
The privacy banner is shown on Step 1 and dismissed by the user. Whether users read it, how quickly they dismiss it, or whether it causes drop-off is unknown.
- **Impact**: Cannot assess whether the privacy notice creates friction that hurts conversion.
- **Fix**: Track `privacy_notice_shown` and `privacy_notice_dismissed`.

### MEDIUM

**M1 — Group photo feature usage unknown**
The person selector (left/center/right/custom) is a differentiated feature but its usage rate is unknown. If 95% of uploads are single-person photos, the group photo UI adds visual complexity for 5% of users.

**M2 — Copy Settings JSON is untracked**
`handleCopyPreset` copies configuration JSON to clipboard (line 287–300). This is a power-user feature that indicates team usage and sharing behavior. Its adoption rate is completely unknown.

**M3 — History strip interaction untracked**
The edit history thumbnail strip appears when `history[selectedResultIndex].length > 1`. Whether users click back through history states is untracked. High usage would justify making history more prominent.

**M4 — No session identification**
There is no anonymous session ID. Events, if added, cannot be correlated within a single user session or across sessions. Without session IDs, funnel analysis is impossible even if individual events are tracked.

**M5 — No time-on-step measurement**
The time a user spends on each step is not measured. Knowing that users spend an average of 3 minutes on Step 2 (Style & Settings) vs 20 seconds on Step 3 would inform UX priorities.

**M6 — Export configuration choices untracked**
Aspect ratio (1:1 vs 3:4), export mode (fill vs fit), format selection (jpg/png), and crop position adjustments are never recorded.

**M7 — Variation selection untracked**
When `numVariations=4`, users select which of the 4 generated images to work with. Which variation index is preferred is unknown. This could reveal whether generation order matters (e.g. if users always pick the last result, that is a UX signal).

### LOW

**L1 — No referrer / UTM tracking**
There is no capture of how users arrive at the product (organic search, paid ads, social links). Standard UTM parameter capture via `window.location.search` on load would cost 5 lines of code.

**L2 — No viewport / device tracking**
No data on whether users are on mobile or desktop. Given that the UI has `sm:` and `md:` responsive breakpoints, knowing mobile vs desktop split matters.

**L3 — No browser / OS tracking**
Relevant for Canvas API compatibility issues and image download behavior differences.

**L4 — Custom edit prompt content untracked**
The free-text `customEditPrompt` field (line 856–865) contains user intent in natural language. Aggregating common prompts would directly inform which preset edit options to add next.

---

## Analytics Event Taxonomy

Complete list of 47 trackable events across all user actions in `PortraitGenerator.tsx`.

| # | Event | Trigger Location | Properties | Priority |
|---|-------|-----------------|------------|----------|
| 1 | `app_loaded` | Component mount (useEffect) | `session_id`, `referrer`, `utm_source`, `utm_medium`, `viewport_width` | P0 |
| 2 | `step_viewed` | Any `setStep()` call | `step_number` (1–4), `step_name`, `previous_step`, `time_on_previous_step_ms` | P0 |
| 3 | `photo_uploaded` | `handleImageUpload` reader.onload | `file_type` (jpeg/png/webp), `file_size_kb`, `session_id` | P0 |
| 4 | `portrait_generation_started` | `handleGenerate` entry | `style`, `expression_preset`, `num_variations`, `likeness_strength`, `naturalness`, `naturalness_preset`, `remove_blemishes`, `identity_locks` (object), `identity_locks_count`, `has_group_photo_hint`, `person_hint_type`, `session_id` | P0 |
| 5 | `portrait_generation_completed` | After `generateProfessionalPortrait` resolves | `duration_ms`, `num_images_returned`, `style`, `num_variations`, `remove_blemishes`, `retouch_pass_included`, `estimated_api_calls`, `session_id` | P0 |
| 6 | `portrait_generation_failed` | `handleGenerate` catch block | `error_message`, `error_type`, `style`, `num_variations`, `duration_ms`, `session_id` | P0 |
| 7 | `portrait_downloaded` | `handleExport` img.onload | `format` (jpg/png), `aspect_ratio`, `export_mode` (fill/fit), `is_pro`, `resolution_px`, `style`, `session_id` | P0 |
| 8 | `platform_download_clicked` | `handlePlatformDownload` | `platform` (linkedin/github/twitter/instagram/resume), `style`, `session_id` | P0 |
| 9 | `download_all_platforms_clicked` | `handleDownloadAll` | `num_platforms`, `style`, `session_id` | P0 |
| 10 | `style_selected` | Style grid button onClick | `style_id`, `previous_style`, `is_new_style`, `session_id` | P1 |
| 11 | `expression_preset_selected` | Expression button onClick | `expression_id`, `previous_expression`, `session_id` | P1 |
| 12 | `identity_lock_toggled` | `toggleLock` | `lock_key` (eyeColor/skinTone/hairLength/hairTexture/glasses), `new_value` (true/false), `total_locks_active`, `session_id` | P1 |
| 13 | `naturalness_preset_selected` | `setNaturalnessFromPreset` | `preset` (natural/polished/studio), `naturalness_value`, `session_id` | P1 |
| 14 | `naturalness_slider_adjusted` | Range input onChange (debounced) | `value`, `previous_value`, `session_id` | P2 |
| 15 | `likeness_strength_adjusted` | Range input onChange (debounced) | `value`, `previous_value`, `session_id` | P2 |
| 16 | `num_variations_selected` | Variations button onClick | `num_variations` (2/4), `previous_value`, `session_id` | P1 |
| 17 | `blemish_removal_toggled` | Remove blemishes button onClick | `remove_blemishes` (true/false), `session_id` | P1 |
| 18 | `person_hint_selected` | Person selector button onClick | `hint_type` (null/left/center/right/custom), `session_id` | P2 |
| 19 | `custom_person_description_entered` | Custom input onChange (debounced, non-PII) | `description_length`, `session_id` | P2 |
| 20 | `settings_json_copied` | `handleCopyPreset` | `style`, `expression_preset`, `num_variations`, `naturalness_preset`, `identity_locks_count`, `session_id` | P2 |
| 21 | `edit_mode_selected` | Edit mode button onClick | `mode` (clothes/background/color/region), `previous_mode`, `session_id` | P1 |
| 22 | `edit_preset_clicked` | Edit preset list button onClick | `mode`, `preset_value` (e.g. "Dark Business Suit"), `session_id` | P1 |
| 23 | `edit_initiated` | `handleEdit` entry | `instruction_source` (preset/custom), `mode`, `has_region_target`, `region_target`, `session_id` | P0 |
| 24 | `edit_completed` | After `editProfessionalPortrait` resolves | `duration_ms`, `mode`, `has_region_target`, `region_target`, `instruction_source`, `session_id` | P0 |
| 25 | `edit_failed` | `handleEdit` catch block | `error_message`, `error_type`, `mode`, `duration_ms`, `session_id` | P0 |
| 26 | `region_target_selected` | Region target button onClick | `region` (background only/clothing only/lighting only/hair only/color grading only), `session_id` | P2 |
| 27 | `custom_edit_prompt_submitted` | Wand2 button onClick / Enter key | `prompt_length`, `has_region_target`, `region_target`, `session_id` | P1 |
| 28 | `variation_selected` | Variation thumbnail onClick | `variation_index`, `total_variations`, `session_id` | P2 |
| 29 | `history_step_selected` | History strip thumbnail onClick | `history_step_index`, `total_history_length`, `session_id` | P2 |
| 30 | `undo_clicked` | `handleUndo` | `current_step`, `max_step`, `session_id` | P2 |
| 31 | `redo_clicked` | `handleRedo` | `current_step`, `max_step`, `session_id` | P2 |
| 32 | `compare_mode_toggled` | Compare button onClick | `new_value` (true/false), `session_id` | P2 |
| 33 | `export_ratio_selected` | Aspect ratio button onClick | `ratio` (1:1/3:4), `previous_ratio`, `session_id` | P2 |
| 34 | `export_mode_selected` | Layout mode button onClick | `mode` (fill/fit), `previous_mode`, `session_id` | P2 |
| 35 | `export_format_selected` | Format button onClick | `format` (jpg/png), `is_pro`, `blocked_by_paywall` (true if png + not pro), `session_id` | P1 |
| 36 | `crop_position_adjusted` | Position range onChange (debounced) | `axis` (x/y), `value`, `session_id` | P3 |
| 37 | `pro_upgrade_clicked` | "Unlock for $9.99" button onClick | `current_step`, `style`, `session_id` | P0 |
| 38 | `privacy_notice_shown` | PrivacyNotice render | `session_id` | P1 |
| 39 | `privacy_notice_dismissed` | `onDismiss` callback | `time_visible_ms`, `session_id` | P1 |
| 40 | `upload_zone_clicked` | Upload zone div onClick | `session_id` | P2 |
| 41 | `back_to_step_1_clicked` | Back button on Step 2 | `session_id` | P2 |
| 42 | `back_to_step_2_clicked` | Back button on Step 3 | `session_id` | P2 |
| 43 | `back_to_step_3_clicked` | Back button on Step 4 | `session_id` | P2 |
| 44 | `proceed_to_export_clicked` | "Export" button on Step 3 | `num_edits_made`, `style`, `session_id` | P1 |
| 45 | `api_key_missing_error` | `generateProfessionalPortrait` key check | `session_id` | P0 |
| 46 | `png_paywall_blocked` | Format button click when fmt=png and !isPro | `session_id` | P1 |
| 47 | `session_ended` | `beforeunload` / `visibilitychange` | `final_step`, `portrait_generated` (bool), `portrait_downloaded` (bool), `total_session_duration_ms`, `num_generations`, `num_edits`, `session_id` | P1 |

**Priority key**: P0 = business-critical, implement first. P1 = high value. P2 = product insights. P3 = optimization only.

---

## Key Metrics Dashboard Spec

| Metric | Definition | Tracking Method | Alert Threshold |
|--------|-----------|-----------------|----------------|
| **Daily Active Users** | Unique `session_id` values per day | `app_loaded` event | Drop >20% WoW |
| **Generation Volume** | Count of `portrait_generation_completed` per day | Server-side count | Drop >30% DoD |
| **Generation Success Rate** | `completed` / (`completed` + `failed`) | `portrait_generation_completed` + `portrait_generation_failed` | Below 85% |
| **P50 Generation Time** | Median `duration_ms` on `portrait_generation_completed` | Percentile aggregation | Exceeds 45,000ms |
| **P95 Generation Time** | 95th percentile `duration_ms` | Percentile aggregation | Exceeds 90,000ms |
| **Upload-to-Generate Rate** | `portrait_generation_started` / `photo_uploaded` | Funnel step 2→3 | Below 40% |
| **Generate-to-Download Rate** | `portrait_downloaded` / `portrait_generation_completed` | Funnel step 3→4 | Below 50% |
| **Full Funnel Conversion** | `portrait_downloaded` / `app_loaded` | End-to-end funnel | Below 15% |
| **Pro Upgrade Click Rate** | `pro_upgrade_clicked` / `app_loaded` | Event count ratio | Below 2% (revenue signal) |
| **Edit Engagement Rate** | Sessions with at least 1 `edit_initiated` / sessions reaching Step 3 | Per-session aggregation | Below 20% |
| **Style Distribution** | Breakdown of `style` property on `portrait_generation_started` | Grouped count | N/A (insight only) |
| **API Cost Per Session** | `estimated_api_calls` * per-call cost | `portrait_generation_completed` | Exceeds $0.40/session avg |
| **Error Rate by Type** | Grouped count of `error_message` on `_failed` events | Error taxonomy | Any error type >5% of attempts |
| **Platform Download Adoption** | `platform_download_clicked` / `portrait_downloaded` | Event ratio | N/A (insight only) |
| **Identity Lock Usage** | Average `identity_locks_count` per generation | Mean on `portrait_generation_started` | N/A (insight only) |

---

## Funnel Analysis Setup

The core product funnel has 6 stages. Each stage requires a specific event to be tracked for funnel analysis to work.

```
Stage 1: LANDING
  Event: app_loaded
  Properties: referrer, utm_source, utm_medium, session_id

Stage 2: UPLOAD
  Event: photo_uploaded
  Drop-off metric: (app_loaded - photo_uploaded) / app_loaded
  Typical benchmark: 40–60% of landings result in upload action

Stage 3: CONFIGURE (Step 2 — Style & Settings)
  Event: portrait_generation_started
  Drop-off metric: (photo_uploaded - generation_started) / photo_uploaded
  Key properties: style, expression_preset, num_variations, identity_locks_count

Stage 4: GENERATE (waiting state, Step 2 → Step 3)
  Event: portrait_generation_completed (or _failed)
  Drop-off metric: failed / (completed + failed) = error rate
  Key property: duration_ms (UX quality signal)

Stage 5: EDIT / REVIEW (Step 3)
  Event: proceed_to_export_clicked  OR  portrait_downloaded
  Drop-off metric: (generation_completed - proceed_to_export) / generation_completed
  Sub-funnel: edit_initiated / generation_completed = editor engagement rate

Stage 6: DOWNLOAD (Step 4)
  Event: portrait_downloaded
  Drop-off metric: (proceed_to_export - downloaded) / proceed_to_export
  Key properties: format, platform, is_pro
  Extension: pro_upgrade_clicked / downloaded (upsell conversion rate)
```

**Implementation note**: All 6 stages are reachable from a single component (`PortraitGenerator.tsx`). The full funnel instrumentation requires changes to one file only.

---

## A/B Testing Framework Recommendation

**Recommended tool**: PostHog (see Implementation Plan section for rationale).

PostHog provides feature flags, A/B tests (experiments), and analytics in a single SDK. The `feature_flags` are evaluated client-side on load and can gate UI variants without a server.

**First 3 A/B tests to run** (in priority order):

### Test 1: Default `numVariations` — 2 vs 4
- **Hypothesis**: Users shown 4 variations by default will have a higher download rate because they have more choice, but this doubles API cost and increases wait time.
- **Metric**: `portrait_downloaded` rate (primary), `portrait_generation_failed` rate (guard), `duration_ms` (guard)
- **Variants**: A = `numVariations` default of 2, B = `numVariations` default of 4
- **Sample size**: ~500 generations per variant (achievable within 2 weeks at moderate traffic)
- **Decision rule**: Ship B only if download rate lifts >5% AND error rate does not increase

### Test 2: Generate button copy — "Generate Portraits" vs "Make My Headshot"
- **Hypothesis**: More personal, outcome-focused copy increases the upload-to-generate conversion rate.
- **Metric**: `portrait_generation_started` rate after `photo_uploaded`
- **Variants**: A = "Generate Portraits", B = "Make My Headshot"
- **Sample size**: ~300 uploads per variant
- **Decision rule**: Ship B if lift >3% at 95% confidence

### Test 3: Privacy notice — shown vs hidden
- **Hypothesis**: The privacy notice on Step 1 adds perceived legitimacy and increases upload rate, but could also add friction.
- **Metric**: `photo_uploaded` rate from `app_loaded` (primary), `privacy_notice_dismissed` time (secondary)
- **Variants**: A = show privacy notice (current), B = hide privacy notice, show link in footer only
- **Sample size**: ~500 landings per variant
- **Decision rule**: Ship B only if upload rate lifts >2% (trust is worth the slight conversion cost)

---

## Unit Economics Tracking Plan

ProPortrait AI has a potentially complex cost structure because each generation session makes 2–8 Gemini API calls depending on `numVariations` and `removeBlemishes`. This must be tracked to set sustainable pricing.

### API Call Count Per Session

```
numVariations = 2, removeBlemishes = true:   4 calls (2 generate + 2 retouch)
numVariations = 2, removeBlemishes = false:  2 calls (2 generate only)
numVariations = 4, removeBlemishes = true:   8 calls (4 generate + 4 retouch)
numVariations = 4, removeBlemishes = false:  4 calls (4 generate only)
Edit (each):                                 1 call per edit action
```

### Cost Estimation Model

Gemini image generation pricing (estimate based on `imageSize: '1K'`, 1-megapixel output):
- Approximate cost per image generation call: $0.02–$0.04 (verify against Google AI pricing dashboard)
- Base session cost (2 variations, retouch on): ~$0.08–$0.16
- Premium session cost (4 variations, retouch on, 3 edits): ~$0.22–$0.40

### Tracking Fields to Add to `portrait_generation_completed`

```typescript
{
  num_api_calls_generation: numImages,            // 2 or 4
  num_api_calls_retouch: removeBlemishes ? numImages : 0,  // 0, 2, or 4
  total_api_calls: numImages * (removeBlemishes ? 2 : 1),
  estimated_cost_usd: totalApiCalls * AVG_COST_PER_CALL,  // update as pricing is confirmed
  remove_blemishes: removeBlemishes,
  num_variations: numImages,
}
```

### Tracking Fields for Edit Sessions

```typescript
// On edit_completed:
{
  cumulative_edits_this_session: editCount,
  cumulative_edit_api_calls_this_session: editCount,  // 1 call per edit
  estimated_cumulative_edit_cost_usd: editCount * AVG_COST_PER_CALL,
}
```

### Unit Economics Dashboard

| Metric | Formula | Target |
|--------|---------|--------|
| **Cost per generation session** | `SUM(estimated_cost_usd) / COUNT(sessions_with_generation)` | Establish baseline first |
| **Cost per download** | `SUM(estimated_cost_usd) / COUNT(portrait_downloaded)` | Must be < free tier value |
| **Revenue per session (future)** | `SUM(revenue) / COUNT(sessions)` | Set after payment integration |
| **Gross margin per pro session** | `($9.99 - cost_per_session) / $9.99` | Target >70% |
| **High-cost user detection** | Sessions where `total_api_calls > 12` | Flag for rate limiting |
| **Free tier cost per MAU** | `SUM(free_session_costs) / MAU` | Must inform freemium limits |

---

## Implementation Plan: PostHog vs Mixpanel vs GA4

### Comparison Matrix

| Criterion | PostHog | Mixpanel | GA4 |
|-----------|---------|---------|-----|
| **Self-hostable** | Yes (OSS) | No | No |
| **Free tier** | 1M events/month | 20M events/month (limited) | Unlimited (sampling above threshold) |
| **A/B testing built-in** | Yes (experiments + feature flags) | No (requires separate tool) | Yes (via Optimize successor, limited) |
| **Session recording** | Yes | No | No |
| **Funnel analysis** | Yes | Yes (best in class) | Yes (limited) |
| **User-level analytics** | Yes | Yes | Limited (aggregate) |
| **GDPR compliance** | Excellent (self-host option) | Adequate | Complex (data to US) |
| **React SDK** | `posthog-js` — excellent | Good | `gtag` — adequate |
| **Event property depth** | 32 properties per event | Unlimited | 25 custom parameters |
| **Pricing at scale** | Predictable (events-based) | Expensive at scale | Free but limited |
| **Setup complexity** | Low | Medium | Medium |
| **Image-heavy app suitability** | High | High | Low (designed for pageviews) |

### Recommendation: PostHog

**Rationale**:

1. **Single SDK for everything needed**: PostHog delivers analytics events, funnels, session recording, A/B tests (experiments), and feature flags in one `npm install posthog-js`. Mixpanel requires a separate A/B tool (LaunchDarkly, Statsig). GA4 requires Firebase A/B Testing.

2. **Session recording is critical here**: ProPortrait AI is a visual, multi-step tool. Watching session replays will reveal usability issues (hesitation on the style grid, confusion with region edit mode) that event data alone cannot show. PostHog includes this.

3. **Self-hostable for privacy**: Since users upload face photos, GDPR compliance is non-trivial. PostHog can be self-hosted on a $5/month VPS so no biometric-adjacent data leaves the operator's infrastructure. This also eliminates the legal risk of sending event payloads containing `file_size`, `style`, and session data to a US analytics vendor.

4. **Free tier is genuinely useful**: 1M events/month on PostHog Cloud covers a substantial user base before any costs are incurred. For a pre-revenue product, this is important.

5. **Funnel analysis matches the product's needs**: The 6-stage funnel described above maps directly to PostHog's funnel visualization. Mixpanel's funnel analysis is marginally better but requires significantly more cost at scale.

**PostHog implementation**: `npm install posthog-js`, initialize in `src/main.tsx` with project API key, then call `posthog.capture('event_name', { ...properties })` at each of the 47 locations identified above.

---

## Analytics Code Spec

Implementation-ready pseudocode/actual TypeScript for the top 10 P0 tracking events. This code is intended to be dropped into `PortraitGenerator.tsx` and `src/lib/analytics.ts`.

### analytics.ts — Wrapper Module

```typescript
// src/lib/analytics.ts
import posthog from 'posthog-js';

let sessionId: string | null = null;

export function initAnalytics(apiKey: string) {
  posthog.init(apiKey, {
    api_host: 'https://app.posthog.com',  // or self-hosted URL
    capture_pageview: false,              // manual control
    session_recording: { maskAllInputs: true },  // mask file inputs for privacy
    loaded: (ph) => { sessionId = ph.get_distinct_id(); },
  });
}

export function getSessionId(): string {
  return sessionId || 'unknown';
}

export function track(event: string, properties: Record<string, unknown> = {}) {
  posthog.capture(event, { session_id: getSessionId(), ...properties });
}
```

### Event 1: app_loaded

```typescript
// In src/main.tsx, after React.render()
import { initAnalytics, track } from './lib/analytics';

initAnalytics(import.meta.env.VITE_POSTHOG_KEY);
track('app_loaded', {
  referrer: document.referrer,
  utm_source: new URLSearchParams(window.location.search).get('utm_source'),
  utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
  viewport_width: window.innerWidth,
  viewport_height: window.innerHeight,
});
```

### Event 2: step_viewed

```typescript
// In PortraitGenerator.tsx, replace all setStep() calls with a helper:
const stepEntryTime = useRef<number>(Date.now());

const navigateToStep = (newStep: Step) => {
  const timeOnCurrentStep = Date.now() - stepEntryTime.current;
  track('step_viewed', {
    step_number: newStep,
    step_name: ['', 'upload', 'style', 'edit', 'export'][newStep],
    previous_step: step,
    time_on_previous_step_ms: timeOnCurrentStep,
  });
  stepEntryTime.current = Date.now();
  setStep(newStep);
};
// Replace all setStep(N) calls: setStep(2) → navigateToStep(2), etc.
```

### Event 3: photo_uploaded

```typescript
// In handleImageUpload, inside reader.onload:
reader.onload = (e) => {
  const file = event.target.files![0];
  track('photo_uploaded', {
    file_type: file.type,              // image/jpeg, image/png, etc.
    file_size_kb: Math.round(file.size / 1024),
  });
  setSelectedImage(e.target?.result as string);
  // ... rest of handler
  navigateToStep(2);
};
```

### Events 4 & 5: portrait_generation_started / completed

```typescript
// In handleGenerate:
const handleGenerate = async () => {
  if (!selectedImage) return;
  const generationStart = performance.now();

  track('portrait_generation_started', {
    style: selectedStyle,
    expression_preset: expressionPreset,
    num_variations: numVariations,
    likeness_strength: likenessStrength,
    naturalness: naturalness,
    naturalness_preset: naturalnessPreset,
    remove_blemishes: removeBlemishes,
    identity_locks: identityLocks,
    identity_locks_count: Object.values(identityLocks).filter(Boolean).length,
    has_group_photo_hint: selectedPersonHint !== null,
    person_hint_type: selectedPersonHint ?? 'single',
    estimated_api_calls: numVariations * (removeBlemishes ? 2 : 1),
  });

  setIsGenerating(true);
  // ...
  try {
    const results = await generateProfessionalPortrait(/* ... */);
    const durationMs = Math.round(performance.now() - generationStart);

    track('portrait_generation_completed', {
      duration_ms: durationMs,
      num_images_returned: results.length,
      style: selectedStyle,
      num_variations: numVariations,
      remove_blemishes: removeBlemishes,
      retouch_pass_included: removeBlemishes,
      estimated_api_calls: numVariations * (removeBlemishes ? 2 : 1),
    });

    // ... rest of success path
  } catch (err) {
    const durationMs = Math.round(performance.now() - generationStart);
    track('portrait_generation_failed', {
      error_message: err instanceof Error ? err.message : String(err),
      error_type: err instanceof Error ? err.constructor.name : 'UnknownError',
      style: selectedStyle,
      num_variations: numVariations,
      duration_ms: durationMs,
    });
    setError('Failed to generate portrait. Please try again.');
  }
};
```

### Events 6 & 7: edit_initiated / edit_completed

```typescript
// In handleEdit:
const handleEdit = async (instruction: string) => {
  if (generatedImages.length === 0) return;
  const editStart = performance.now();

  track('edit_initiated', {
    instruction_source: instruction === customEditPrompt ? 'custom' : 'preset',
    mode: editMode,
    has_region_target: regionTarget !== null,
    region_target: regionTarget,
    instruction_length: instruction.length,
  });

  setIsEditing(true);
  try {
    const result = await editProfessionalPortrait(/* ... */);
    const durationMs = Math.round(performance.now() - editStart);

    track('edit_completed', {
      duration_ms: durationMs,
      mode: editMode,
      has_region_target: regionTarget !== null,
      region_target: regionTarget,
      instruction_source: instruction === customEditPrompt ? 'custom' : 'preset',
    });
    // ... rest of success path
  } catch (err) {
    const durationMs = Math.round(performance.now() - editStart);
    track('edit_failed', {
      error_message: err instanceof Error ? err.message : String(err),
      error_type: err instanceof Error ? err.constructor.name : 'UnknownError',
      mode: editMode,
      duration_ms: durationMs,
    });
  }
};
```

### Event 8: portrait_downloaded

```typescript
// In handleExport, inside img.onload:
img.onload = () => {
  const dataUrl = renderToCanvas(img, width, height);
  track('portrait_downloaded', {
    format: exportFormat,
    aspect_ratio: exportRatio,
    export_mode: exportMode,
    is_pro: isPro,
    resolution_px: width * height,
    style: selectedStyle,
    download_type: 'standard',
  });
  // ... download link creation
};
```

### Event 9: platform_download_clicked

```typescript
// In handlePlatformDownload:
const handlePlatformDownload = (presetId: string) => {
  track('platform_download_clicked', {
    platform: presetId,
    style: selectedStyle,
  });
  // ... rest of handler
};
```

### Event 10: pro_upgrade_clicked

```typescript
// On the "Unlock for $9.99" button:
<button
  onClick={() => {
    track('pro_upgrade_clicked', {
      current_step: step,
      style: selectedStyle,
      export_format_attempted: exportFormat,
    });
    setIsPro(true);  // replace with real payment flow
  }}
  className="w-full py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50"
>
  Unlock for $9.99
</button>
```

---

## Dependencies

- **Requires**: None (Tier 2 — standalone audit, no dependency on other agents)
- **Feeds into**:
  - **ATLAS** — A/B test data requires the event taxonomy and funnel data defined here
  - **VAULT** — Unit economics tracking plan (estimated_api_calls, cost fields) feeds VAULT's financial modeling
  - **SENTINEL** / **GUARDIAN** — Error event taxonomy (portrait_generation_failed, edit_failed, api_key_missing_error) provides ground truth for alert thresholds
  - **SCOUT** — Feature usage data (style distribution, expression adoption, identity lock usage rates) directly feeds product roadmap prioritization

---

## Prioritized Remediation Plan

### Sprint 1 — Foundation (Week 1, ~8 hours of engineering)

| Task | File | Effort |
|------|------|--------|
| Install PostHog: `npm install posthog-js` | `package.json` | 5 min |
| Create `src/lib/analytics.ts` wrapper | New file | 30 min |
| Initialize PostHog in `src/main.tsx` | `src/main.tsx` | 15 min |
| Add session ID generation | `analytics.ts` | 15 min |
| Implement `navigateToStep` helper (replaces raw `setStep`) | `PortraitGenerator.tsx` | 30 min |
| Track `app_loaded`, `step_viewed`, `photo_uploaded` (P0 funnel) | `PortraitGenerator.tsx` | 1 hour |
| Track `portrait_generation_started/completed/failed` with timing | `PortraitGenerator.tsx` | 2 hours |
| Track `edit_initiated/completed/failed` with timing | `PortraitGenerator.tsx` | 1 hour |
| Track `portrait_downloaded` and `platform_download_clicked` | `PortraitGenerator.tsx` | 1 hour |
| Track `pro_upgrade_clicked` | `PortraitGenerator.tsx` | 15 min |

**Output of Sprint 1**: Full P0 funnel visible. Error rate measurable. Generation time tracked. API call cost model populated.

### Sprint 2 — Feature Insights (Week 2, ~4 hours)

| Task | File | Effort |
|------|------|--------|
| Track style selection, expression selection, lock toggles | `PortraitGenerator.tsx` | 1 hour |
| Track edit mode selection, preset clicks, region target | `PortraitGenerator.tsx` | 1 hour |
| Track numVariations, blemish toggle, naturalness preset | `PortraitGenerator.tsx` | 30 min |
| Track compare mode, undo/redo, variation selection | `PortraitGenerator.tsx` | 30 min |
| Track privacy notice shown/dismissed | `PrivacyNotice.tsx` | 30 min |
| Set up PostHog funnels dashboard (Step 1 → 2 → 3 → 4 → download) | PostHog UI | 30 min |

**Output of Sprint 2**: Feature adoption data live. Funnel dashboard operational. A/B test #1 can be launched.

### Sprint 3 — Session Recording + Cost Tracking (Week 3, ~3 hours)

| Task | File | Effort |
|------|------|--------|
| Enable PostHog session recording (privacy settings: mask inputs) | `analytics.ts` | 30 min |
| Add `estimated_cost_usd` field to generation events | `PortraitGenerator.tsx` | 30 min |
| Build cost-per-session dashboard in PostHog | PostHog UI | 1 hour |
| Set up error rate alert (PostHog → Slack webhook) | PostHog UI | 30 min |
| Launch A/B Test #1 (numVariations default 2 vs 4) | PostHog Experiments | 30 min |

**Output of Sprint 3**: Unit economics visible. Session replays available. First A/B test running.

### Total Estimated Engineering Investment

- Sprint 1: ~8 hours
- Sprint 2: ~4 hours
- Sprint 3: ~3 hours
- **Total**: ~15 hours to reach full analytics coverage on all 47 events

This is among the highest ROI engineering investments available for the product. The data produced in Sprint 1 alone will inform every subsequent product decision.
