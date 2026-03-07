# ProPortrait AI — Style & Expression Prompts

Reference for the style and expression prompts used in portrait generation. Defined in `server/index.ts`.

---

## Design Principles

**Hick's Law + Progressive Disclosure.** Fewer, more distinct choices reduce decision paralysis. Every style must be immediately visually distinguishable from every other style — no two should feel like subtle variants of each other.

**Anti-Uncanny-Valley by Default.** The single biggest complaint users have with AI portraits is the "plastic skin / wax figure" look. This is addressed through a two-layer prompt system: a base realism guard that always runs, and a conditional skin layer that respects the user's explicit Skin Smoothness and Blemish settings without conflict.

---

## Prompt Architecture — Two-Layer System

The negative prompt is **not** a single universal string. It is split into two layers to avoid conflicting with the user's explicit Skin Smoothness and Blemish controls.

### Layer 1 — Always-On (Base Realism Guard)

Applied to every generation, regardless of any user setting. Targets uncanny valley artifacts that no user ever wants:

> `AI glow, mannequin look, waxy texture, doll-like features, CGI render, artificial sheen, perfect bilateral symmetry, plastic face`

This layer is never suppressed. It is not related to skin smoothness — it removes structural artifacts (the "wax figure" effect) rather than controlling texture level.

### Layer 2 — Conditional on Skin Smoothness Selection

This layer is **dynamic**. It is either suppressed or replaced depending on what the user chose. Skin Smoothness and Blemish controls are user overrides — they must win.

#### Skin Smoothness

| User Selects | Layer 2 Negative (added) | Layer 2 Positive (added) |
|---|---|---|
| 🌿 **Natural** | `over-smoothing, beauty filters, porcelain skin, retouched complexion, skin airbrushing` | `visible pores, natural skin texture, micro-texture, authentic skin character` |
| ✨ **Polished** | *(Layer 2 negatives suppressed)* | `smooth even skin, refined complexion, subtle retouching, balanced skin tone` |
| 📷 **Studio** (PRO) | *(Layer 2 negatives suppressed)* | `flawless studio retouching, professional beauty edit, smooth luminous skin, high-end finish` |

#### Blemishes & Imperfections

| User Selects | Negative (added) | Positive (added) |
|---|---|---|
| **Remove spots & blemishes** | `visible blemishes, skin spots, acne marks` | `clear smooth complexion, even skin tone` |
| **Keep natural (preserve all)** | `blemish removal, spot correction, skin clearing` | `natural skin character, authentic complexion, preserved natural marks` |

> **Implementation note:** Layer 2 skin-texture negatives must be removed from the prompt string when the user selects Polished or Studio. Do not rely on prompt weighting to resolve the conflict — the strings must be conditionally excluded at build time in `server/index.ts`.

---

## Style Prompts (STYLE_MAP)

6 core styles covering the full spectrum from hyper-professional to deeply artistic, with zero redundancy between them. Organized in two tiers for progressive disclosure in the UI.

### Tier 1 — Professional & Authentic

For users who need a photo they can use at work, on LinkedIn, or for personal branding.

| Style ID | Display Name | Best For | Prompt |
|----------|--------------|----------|--------|
| **editorial** | Editorial Professional | LinkedIn, corporate bios, executive headshots, high-trust professional contexts | Ultra-realistic, unretouched close-up portrait. High-end editorial studio lighting with a soft key light and subtle rim-lighting. Skin shows visible pores, fine micro-texture, and subtle natural imperfections. Clean, neutral background. Shot on 85mm lens, shallow depth of field (f/1.8), realistic shadows, natural facial geometry. |
| **environmental** | Environmental Portrait | Tech founders, startup culture, creatives, anyone for whom a stark studio backdrop feels too stiff | Ultra-realistic environmental portrait of the subject in a meaningful, modern workspace context. Soft, diffused natural window lighting. The background is slightly blurred with a shallow depth of field to keep focus on the subject. Relaxed shoulders, authentic expression, natural skin texture with realistic hydration shine. |
| **candid** | Candid & Real | Dating apps, social media, Gen Z/Millennial audiences who distrust polished or manufactured images | Raw, spontaneous, candid lifestyle portrait. Unposed, lived-in human energy. Natural daylight, intentional slight imperfections, subtle sensor grain, and a hint of motion blur. Hyper-detailed skin texture, zero retouching, zero beauty filters, everyday scene. |

### Tier 2 — Distinctive & Creative

For users who want something visually striking or stylistically expressive.

| Style ID | Display Name | Best For | Prompt |
|----------|--------------|----------|--------|
| **vintage** | Vintage 35mm | Lifestyle storytelling, creative portfolios, emotional intimacy | Vintage 35mm analog film portrait. Soft faded colors, warm film grain, subtle light leaks, retro 1960s Kodachrome aesthetic. Natural facial geometry and skin fidelity maintained. Emphasizes character and mood, highly emotional and intimate. |
| **bw** | Black & White | Timeless, authoritative presence; portfolio work; any context where color is a distraction | Black-and-white portrait with preserved midtones and natural facial detail. No crushed blacks. Skin rendered in full tonal range — no porcelain or over-smoothed surfaces. Film-like grain preserved. Emphasizes form, light, and expression over color. |
| **cyberpunk** | Cyberpunk Neon | Gamers, Web3, tech-forward personal branding, bold scroll-stopping impact | Cinematic cyberpunk portrait at night. Illuminated by high-contrast, glowing neon pink and blue lights. Dark urban background, dramatic chiaroscuro shadows. Skin reflects neon tones naturally while preserving micro-texture, pores, and human realism. High-tech, dystopian atmosphere. |
| **watercolor** | Watercolor | Wellness brands, soft personal avatars, artistic differentiation | Delicate watercolor illustration portrait. Soft edges, translucent water-based bleeding effects, visible paper texture. Soft diffused lighting, no hard digital lines, authentic traditional media aesthetic. Warm, approachable, and handcrafted feel. |


**Default:**
editorial
---

## What Was Removed and Why

The previous 16-style system collapsed into clusters of near-identical outputs, causing decision paralysis without meaningful visual difference between choices.

| Removed Styles | Why |
|----------------|-----|
| `corporate`, `linkedin`, `resume`, `speaker`, `academic` | All produced: neutral background + bright face light + professional tone. Zero visual distinction between them. Consolidated into `editorial`. |
| `creative`, `tech`, `creative_industry` | All produced: modern, airy, clean, slightly colorful. Collapsed into `environmental`. |
| `studio` | Visually overlapped with `editorial`. Eliminated. |
| `dating` | Ambiguous purpose; `candid` covers authentic warmth more honestly. |
| `cartoon` | Replaced by `watercolor`, which is more refined and has broader appeal. |
| `art_deco` | Niche; caused identity drift. Eliminated. |
| `outdoor` | Absorbed into `candid` and `environmental`. |
| `cinematic` | Replaced by the more visually bold and distinctive `cyberpunk`. |

---

## Expression Prompts (buildExpressionInstruction)

Reduced from 5 to 4. Dropped `approachable_expert` (visually indistinguishable from `confident` in output) and merged `serious_authority` into a cleaner `serious`. Each remaining option produces a meaningfully different face.

| Expression ID | Display Label | Emoji | Prompt | Why it's here |
|---|---|---|---|---|
| **natural** | Natural | ✨ | Keep the subject's original expression exactly as captured in the source photo. Do not alter facial muscles, mouth position, or eye engagement. | Zero intervention — users who already have a good expression want this |
| **confident** | Confident | 😐 | Confident neutral expression. Relaxed jaw, no forced smile, direct and focused eye contact, composed posture. Subtle inner calm. | The 2026 professional default. Counters both "blank stare" and "forced smile" in one |
| **warm_smile** | Warm Smile | 😊 | Warm, genuine smile with natural Duchenne markers — slight squinch of the outer eyes, subtle teeth visible, relaxed cheeks. Approachable and human, not performative. | Most likable; boosts engagement on LinkedIn and dating profiles |
| **serious** | Serious | 🎯 | Strong composed gaze, no expression movement, strong jaw, authority-forward. Eyes engaged but unsmiling. Gravitas without coldness. | Lawyers, executives, academics — contexts where authority matters more than warmth |

**Removed:**
- `approachable_expert` — output was a lighter version of `confident`, indistinguishable to most users. Use `confident` instead.
- `serious_authority` — renamed and simplified to `serious` for clarity.

**Default:**
warm_smile
---

## Real User Pain Points Addressed by This Redesign

Based on research from Reddit, LinkedIn, and product review threads (2025–2026):

| Complaint | How It's Addressed |
|-----------|-------------------|
| "It doesn't look like me" | Universal negative prompt prevents over-smoothing/identity drift; all prompts explicitly specify natural skin geometry |
| "Plastic / waxy / porcelain skin" | Universal negative prompt + explicit pore/texture language in every style prompt |
| "Forced, generic smile" | Expression system is separate from style; users control this independently |
| "All outputs look the same" | 7 styles are visually distinct by design — verified no two share the same visual signature |
| "Too many options, hard to choose" | 6–7 styles split into two clear tiers: professional vs. creative |
| "Too perfect = looks AI-generated" | `candid` style directly targets this; `vintage` leverages the anti-polish 2026 trend |

---

## UI Recommendation

Present **Tier 1** (Editorial, Environmental, Candid) as the default visible options(Quick). Show **Tier 2** (Vintage, B&W, Cyberpunk, Watercolor) behind a "More styles" expansion (Advanced) — so first-time users aren't overwhelmed, but power users can access everything.
