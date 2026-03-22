export interface StylePageData {
  id: string;
  name: string;
  tagline: string;
  primaryKeyword: string;
  metaDescription: string;
  heroHeading: string;
  heroSubheading: string;
  color: string; // tailwind color class for accents
  content: string; // HTML body
  useCases: string[];
  platformsRecommended: string[];
  industries: string[];
}

export const stylePages: StylePageData[] = [
  {
    id: 'editorial',
    name: 'Editorial Professional',
    tagline: 'The gold standard for corporate and executive headshots.',
    primaryKeyword: 'professional headshots for LinkedIn',
    metaDescription: 'Create editorial professional AI headshots optimized for LinkedIn and corporate use. Clean background, polished lighting, identity-preserved — free to try.',
    heroHeading: 'Editorial Professional Headshots',
    heroSubheading: 'Studio-quality corporate portraits that look intentional, not artificial.',
    color: 'indigo',
    useCases: ['LinkedIn profile', 'Corporate directory', 'Executive bio', 'Press kit', 'Consulting website'],
    platformsRecommended: ['LinkedIn', 'Company website', 'Resume/CV', 'Press'],
    industries: ['Finance', 'Law', 'Consulting', 'Real Estate', 'Healthcare leadership', 'Corporate'],
    content: `
<p>The editorial professional style is the most universally appropriate headshot look for business use. It mirrors the aesthetic of high-end corporate photography studios — a clean, muted background, controlled studio-quality lighting, and a polished but natural presentation that signals credibility without looking staged.</p>

<h2>What Makes Editorial Professional Work</h2>

<p>Traditional professional headshots require a photography studio, a professional photographer, and anywhere from $200 to $600 — plus your time. The results, when done well, communicate something specific: this person is serious, polished, and invests in their professional presence.</p>

<p>ProPortrait AI's editorial professional style replicates that specific visual language. The background is clean and muted (dark grey, off-white, or a gradient). Lighting is directional and controlled, creating the shadow depth that separates a real studio shot from a casual photo. Clothing is adapted to smart professional standards — a suit, blazer, or clean dress shirt — while your actual face, skin tone, and features remain exactly as they are.</p>

<h2>Identity Preservation</h2>

<p>A common complaint with AI portrait tools is subtle identity drift — the AI changes your eye color, lightens or darkens your skin, or modifies your hair in ways that make the result look less like you. The editorial professional style in ProPortrait AI uses identity lock controls to prevent this. Lock your skin tone, eye color, hair length, and hair texture individually. The AI improves quality; it doesn't change who you are.</p>

<h2>When to Use Editorial Professional</h2>

<p>This style is the right choice when:</p>
<ul>
  <li>You're in a conservative or formal industry (finance, law, consulting, healthcare leadership)</li>
  <li>Your photo will appear on your company's official website or press materials</li>
  <li>You're applying for senior or executive-level roles</li>
  <li>Your LinkedIn audience is primarily corporate recruiters or B2B clients</li>
  <li>Your personal brand is built on expertise and authority rather than personality</li>
</ul>

<h2>Platform Sizes Included</h2>

<p>When you download with the "All Platforms" option ($9.99), your editorial professional portrait is delivered at:</p>
<ul>
  <li><strong>LinkedIn:</strong> 800×800px (the exact size LinkedIn recommends)</li>
  <li><strong>Resume/CV:</strong> 600×800px (portrait orientation, suitable for European-style CVs)</li>
  <li><strong>Corporate website:</strong> 500×500px or 800×800px depending on typical use</li>
  <li><strong>Press/media kit:</strong> 2048×2048px HD for print-quality use</li>
</ul>

<h2>Tips for Best Results</h2>

<p>The editorial professional style produces its best results with:</p>
<ul>
  <li>A clear, well-lit source photo (natural light from a window works well)</li>
  <li>A front-facing or slight three-quarter angle</li>
  <li>A neutral or confident expression — not a forced smile</li>
  <li>Natural lighting rather than harsh flash</li>
</ul>

<p>Set the naturalness slider to 60–70% for a polished but natural result. Higher settings approach over-smoothed territory; lower settings may show skin texture you might prefer to soften.</p>
    `.trim(),
  },

  {
    id: 'environmental',
    name: 'Environmental Portrait',
    tagline: 'For founders, creatives, and professionals who want personality in their photo.',
    primaryKeyword: 'tech founder headshots',
    metaDescription: 'Environmental AI headshots for tech founders, creatives, and startup professionals. Captures personality and approachability without a formal studio setting.',
    heroHeading: 'Environmental Portrait Headshots',
    heroSubheading: 'Personality-driven portraits that show who you are, not just what you do.',
    color: 'emerald',
    useCases: ['Startup about page', 'Personal website', 'Twitter/X profile', 'Speaker bio', 'Podcast guest photo'],
    platformsRecommended: ['Twitter/X', 'Personal website', 'LinkedIn (startups)', 'Medium/Substack'],
    industries: ['Tech startups', 'Design', 'Media', 'Education', 'Agency', 'Creative direction'],
    content: `
<p>Not every professional wants to look like they're applying for a bank loan. Environmental portrait headshots capture you in a context that suggests your work and personality — a modern workspace, architectural backdrop, or curated setting that complements rather than competes with your face.</p>

<h2>What Environmental Portraits Communicate</h2>

<p>Where the editorial professional style signals authority and formality, environmental portraits signal approachability, creativity, and authenticity. For startup founders writing blog posts, designers presenting their portfolio, educators building a personal brand, or anyone whose audience values personality alongside expertise — this style is frequently more effective than a sterile studio look.</p>

<p>The best environmental portraits have a specific visual quality: natural-feeling light, a background that's visible but not distracting, and a person who looks relaxed and in their element. ProPortrait AI's environmental portrait style generates this aesthetic — placing you in a contextually appropriate setting (a modern office, a textured wall, a slightly blurred outdoor space) with natural-looking light.</p>

<h2>When Environmental Portraits Outperform Studio Headshots</h2>

<ul>
  <li><strong>Founder-led companies:</strong> A personal brand matters more than corporate distance. Approachability converts.</li>
  <li><strong>Twitter/X and Medium/Substack:</strong> These platforms reward personality. An overly corporate headshot can feel incongruous with personal writing.</li>
  <li><strong>Speaker and podcast contexts:</strong> Conference organizers and podcast hosts often prefer a photo that looks natural and contextual rather than formal.</li>
  <li><strong>Creative fields:</strong> Designers, copywriters, brand strategists, and photographers often benefit from a portrait that itself has good aesthetic sensibility.</li>
  <li><strong>Product-led companies:</strong> If your product is about personality, human connection, or user experience, a human-feeling photo of the team resonates more.</li>
</ul>

<h2>Style Details</h2>

<p>ProPortrait AI's environmental portrait style generates backgrounds in one of several categories: modern workspace (clean desk, window light, architectural elements), textured architectural (exposed brick, concrete, modern glass), outdoor natural (soft-bokeh greenery), and creative studio (workspace with design elements).</p>

<p>Clothing is adapted to smart-casual: quality basics, no ties, natural textures. This style supports a wider expression range than editorial — a natural smile or slightly animated expression often works better here than the composed neutral of a corporate headshot.</p>

<h2>Platform Recommendations</h2>

<p>This style works across most modern platforms but is particularly strong for:</p>
<ul>
  <li>LinkedIn (for startup/tech roles and creative professionals)</li>
  <li>Twitter/X profile photos</li>
  <li>Personal websites and portfolios</li>
  <li>Guest author bios on blogs and publications</li>
  <li>Speaking and event bios</li>
</ul>
    `.trim(),
  },

  {
    id: 'candid',
    name: 'Candid & Real',
    tagline: 'Natural, warm, and approachable — the antidote to over-processed AI portraits.',
    primaryKeyword: 'natural AI headshots',
    metaDescription: 'Natural, candid AI headshots that look genuinely human. No over-smoothing, no artificial glow — just a warm, approachable portrait that looks like you.',
    heroHeading: 'Candid & Real AI Headshots',
    heroSubheading: 'Looks like you caught a great moment — not like you sat for a portrait.',
    color: 'amber',
    useCases: ['Dating apps', 'Social media', 'Personal blog', 'Community profiles', 'Warm introductory contexts'],
    platformsRecommended: ['Instagram', 'Twitter/X', 'Dating apps', 'Facebook', 'Community platforms'],
    industries: ['Any', 'Wellness', 'Education', 'Non-profit', 'Hospitality'],
    content: `
<p>The most common complaint about AI portrait tools isn't bad quality — it's that the results look too perfect. Over-smoothed skin, impossibly even lighting, and a composed stillness that reads as artificial rather than professional. The Candid &amp; Real style in ProPortrait AI is designed to counteract exactly this.</p>

<h2>What "Candid" Means in an AI Portrait</h2>

<p>Candid portraiture — in traditional photography — means capturing someone in a natural moment rather than a posed one. The AI version of this aesthetic uses slightly warmer, more naturalistic lighting, a slightly less formal framing, and skin rendering that preserves texture rather than smoothing it away. The result looks like a very good casual photo taken with good equipment by someone who knows what they're doing — not a studio portrait.</p>

<p>This is specifically useful for contexts where looking too corporate or too polished would create distance. Dating apps. Social media profiles where you want to seem approachable. Community forums. Blog author photos where warmth matters more than authority.</p>

<h2>Identity Preservation</h2>

<p>One of the risks with "candid" AI portraits is that the naturalizing process subtly alters your features — softening a strong jawline, shifting your eye color toward a warmer tone, or changing your hair in small ways that add up to someone who looks almost but not quite like you. ProPortrait AI's identity lock controls prevent this. Lock your skin tone, eye color, hair length, and hair texture individually. The AI preserves what makes you recognizable while generating the warm, natural aesthetic around it.</p>

<h2>The Naturalness Slider Matters Here</h2>

<p>ProPortrait AI's naturalness slider (0–100) controls how much the AI preserves versus smooths your skin and features. For the candid style, we recommend setting the slider to 70–85%. This keeps meaningful texture and natural imperfections while still improving overall quality and lighting. At 100%, you get an almost unprocessed documentary quality. At below 50%, you start to get the over-smoothed look this style is designed to avoid.</p>

<h2>When Candid Outperforms Studio Headshots</h2>

<ul>
  <li><strong>Dating apps:</strong> Authenticity and warmth are the primary signals. An obviously retouched photo creates expectations that real-life interaction has to meet.</li>
  <li><strong>Social media:</strong> Natural-looking photos perform better on most social platforms because they fit the visual language of the feed.</li>
  <li><strong>Wellness and mental health contexts:</strong> Practitioners in therapy, coaching, and wellness benefit from approachable warmth over professional distance.</li>
  <li><strong>Community platforms:</strong> Neighborhood apps, forums, Discord servers — contexts where you want to seem like a real person, not a brand.</li>
  <li><strong>Non-profit and volunteer work:</strong> Human connection matters more than polished authority in most mission-driven contexts.</li>
</ul>

<h2>Platform Sizes Included</h2>

<p>When you download with the "All Platforms" option ($9.99), your candid portrait is delivered at the sizes that matter most for social and casual-use contexts:</p>
<ul>
  <li><strong>Instagram profile:</strong> 320×320px (Instagram's display size) and 1080×1080px (upload quality)</li>
  <li><strong>Twitter/X:</strong> 400×400px (the recommended profile photo size)</li>
  <li><strong>Dating apps:</strong> 1000×1000px square (works across Hinge, Bumble, and Tinder)</li>
  <li><strong>Facebook:</strong> 720×720px (Facebook's optimal profile size)</li>
  <li><strong>Community / forum avatars:</strong> 256×256px (universal avatar size)</li>
</ul>

<h2>Tips for Best Results</h2>

<p>The candid style produces its most natural-looking results when:</p>
<ul>
  <li>Your source photo is taken in natural light — window light, open shade, or golden hour</li>
  <li>You have a relaxed, genuine expression rather than a composed professional pose</li>
  <li>The photo is slightly casual in framing — a small head tilt or slight off-center crop works well</li>
  <li>You avoid heavily filtered or color-graded source photos, which can confuse the AI's naturalistic rendering</li>
</ul>

<p>Set the naturalness slider to 75–80% for the best balance of warmth and quality. Going higher (85–100%) gives a more documentary feel — useful for dating app photos where raw authenticity is the goal. Going lower (below 60%) starts to add the polished quality that this style specifically avoids.</p>
    `.trim(),
  },

  {
    id: 'vintage',
    name: 'Vintage 35mm',
    tagline: 'Warm film grain, soft tones, and timeless character.',
    primaryKeyword: 'vintage style AI portraits',
    metaDescription: 'Vintage 35mm AI portrait headshots with warm film grain and timeless character. Perfect for creatives, artists, and portfolios that want to stand out.',
    heroHeading: 'Vintage 35mm AI Portraits',
    heroSubheading: 'Film-inspired character that stands out from every other AI portrait.',
    color: 'orange',
    useCases: ['Creative portfolio', 'Personal branding', 'Book author bio', 'Artist website', 'Lifestyle brand'],
    platformsRecommended: ['Instagram', 'Personal website', 'Behance/Dribbble', 'Substack'],
    industries: ['Photography', 'Writing', 'Art direction', 'Fashion', 'Hospitality', 'Lifestyle brands'],
    content: `
<p>The vintage 35mm aesthetic — warm color tones, subtle film grain, slightly lifted shadows, and a quality of light that feels analog — has been one of the most enduring aesthetics in photography. It never completely goes out of style because it carries emotional weight that clean digital photography sometimes lacks. ProPortrait AI's vintage portrait style applies this aesthetic to professional headshots.</p>

<h2>The Visual Characteristics</h2>

<p>A well-executed vintage portrait has specific qualities: warm color grading (slightly amber or golden midtones), lifted blacks (shadows don't go completely dark), subtle grain that gives the image texture, and slightly lower contrast than modern digital photography. Skin tones lean warm. The overall feel is intimate and slightly imperfect in a way that feels human.</p>

<p>ProPortrait AI's vintage style replicates this through its AI rendering — not by applying a filter to a digital photo, but by generating the image with these aesthetic qualities built in. The result is a cohesive vintage look rather than a filtered digital photo.</p>

<h2>Identity Preservation</h2>

<p>The warm amber grading that defines vintage photography is one of the places where skin tone drift happens most often in AI portraits — the AI can shift your skin tone to match the period palette in ways that feel subtle but make the portrait look less like you. ProPortrait AI's skin tone lock is specifically designed to prevent this. Lock your skin tone, hair color, and eye color before generating. The vintage color grade wraps around your real features rather than replacing them.</p>

<h2>Who Benefits Most</h2>

<ul>
  <li><strong>Writers and authors:</strong> Warm, textured portraits work particularly well for author bios, where personality and approachability matter alongside intellectual credibility.</li>
  <li><strong>Photographers:</strong> Using a film-inspired portrait signals aesthetic sensibility — you understand and appreciate analog traditions.</li>
  <li><strong>Designers and art directors:</strong> The vintage aesthetic communicates taste and a longer view of design history.</li>
  <li><strong>Lifestyle brands:</strong> If your brand aesthetic runs warm and nostalgic, your founder/team photos should match.</li>
  <li><strong>Hospitality and food:</strong> Warm tones and film grain align with the visual language of quality restaurants, cafes, and boutique hospitality.</li>
</ul>

<h2>Where It Works (and Doesn't)</h2>

<p>The vintage style excels on Instagram, personal websites, Substack headers, and creative portfolio sites. It generally doesn't work well for corporate LinkedIn use, formal executive bios, or any context where "professional" means "contemporary and polished." That's not a weakness — it's a feature. This style is for contexts where standing out matters more than fitting in.</p>

<h2>Platform Sizes Included</h2>

<p>When you download with the "All Platforms" option ($9.99), your vintage portrait is delivered at the sizes that creative and social platforms require:</p>
<ul>
  <li><strong>Instagram profile:</strong> 320×320px (display) and 1080×1080px (upload quality)</li>
  <li><strong>Personal website / portfolio:</strong> 800×800px and 1200×1200px for high-DPI displays</li>
  <li><strong>Substack / blog header:</strong> 1500×500px (recommended Substack profile banner crop)</li>
  <li><strong>Behance / Dribbble:</strong> 800×800px (standard portfolio avatar size)</li>
  <li><strong>Print / press use:</strong> 2048×2048px HD for book jackets, editorial features, or print media</li>
</ul>

<h2>Tips for Best Results</h2>

<p>The vintage style produces its richest film-like quality with:</p>
<ul>
  <li>A source photo with warm or neutral lighting — harsh cool-toned LED light can fight the warm grading</li>
  <li>A front-facing or classic three-quarter angle (the same angles that 35mm portrait photographers favored)</li>
  <li>A relaxed or naturally expressive look — slight smile, thoughtful expression, or looking slightly off-camera all work well</li>
  <li>Avoid heavily color-graded source photos, which can create unpredictable interactions with the vintage rendering</li>
</ul>

<p>Set the naturalness slider to 65–75% for the ideal balance of vintage grain and portrait clarity. Higher settings (80+) increase the film grain and texture, leaning into a more documentary 35mm feel. Lower settings (below 55%) reduce grain and produce a cleaner vintage look closer to medium-format film than grainy 35mm.</p>
    `.trim(),
  },

  {
    id: 'black-white',
    name: 'Black & White',
    tagline: 'Timeless, authoritative, and impossible to look dated.',
    primaryKeyword: 'black and white professional headshots',
    metaDescription: 'Black and white AI professional headshots with dramatic lighting and timeless authority. Free to try — download when you\'re satisfied.',
    heroHeading: 'Black & White Professional Headshots',
    heroSubheading: 'The most timeless headshot aesthetic — and one of the most powerful.',
    color: 'slate',
    useCases: ['Executive portfolio', 'Law firm bio', 'Award recognition', 'Published author', 'High-contrast branding'],
    platformsRecommended: ['LinkedIn', 'Personal website', 'Press kit', 'Speaker materials'],
    industries: ['Law', 'Executive leadership', 'Academia', 'Publishing', 'Architecture', 'Finance'],
    content: `
<p>Black and white portraiture has a specific psychological effect: it removes the contextual noise of color and directs attention entirely to form, expression, and presence. A strong black and white headshot reads as deliberate and confident — you're not trying to appeal through warm tones or pleasant palette, you're letting your face and expression do the work.</p>

<h2>Why Black & White Still Works in 2026</h2>

<p>Color photos can look dated as palettes trend in and out. The warm tones that felt fresh in 2018 look like a period piece now. Black and white doesn't date. A striking B&W portrait from 1975 or 2026 has the same quality — timeless. For professionals who want a headshot that will serve them for five or more years without looking dated, black and white is a smart strategic choice.</p>

<h2>What the AI Gets Right in B&W</h2>

<p>Converting a color photo to grayscale is not a black and white portrait. Real B&W portraiture involves contrast decisions — how bright to render skin, how deep to push shadows, how much texture to preserve. ProPortrait AI's B&W style generates portraits with intentional contrast: lifted highlights on skin, deep shadow definition in facial planes, and the kind of tonal range that distinguishes a professional B&W portrait from a desaturated Instagram filter.</p>

<p>The result has genuine tonal depth — not the flat gray of a casual desaturation, but the full range of black and white portraiture done well.</p>

<h2>Best Uses for B&W Headshots</h2>

<ul>
  <li><strong>Law firm partner bios:</strong> Authority and gravitas are the primary signals. B&W delivers both.</li>
  <li><strong>Executive and C-suite:</strong> A striking B&W portrait signals confidence and makes a profile memorable in a sea of similar color headshots.</li>
  <li><strong>Published authors:</strong> Author photos in books are often B&W for production reasons; having a strong B&W available is useful.</li>
  <li><strong>Award recognition:</strong> Press releases and awards announcements often look better with a strong B&W portrait.</li>
  <li><strong>High-contrast branding:</strong> If your brand uses a black-and-white or monochrome palette, your portrait should match.</li>
</ul>

<h2>Contrast Setting Recommendations</h2>

<p>B&W portraits can range from low-contrast (flat, moody, fashion-editorial) to high-contrast (dramatic, authoritative, graphic). ProPortrait AI defaults to a medium-high contrast setting for the B&W style that works well for most professional contexts. If you want a more editorial fashion look, use a slightly higher naturalness setting (70+) which tends to preserve more tonal subtlety.</p>
    `.trim(),
  },

  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    tagline: 'For the web3, gaming, and tech-forward crowd.',
    primaryKeyword: 'cyberpunk AI portrait',
    metaDescription: 'Cyberpunk neon AI portrait headshots for web3, gaming, and tech-forward personal branding. Free to generate and preview.',
    heroHeading: 'Cyberpunk Neon AI Portraits',
    heroSubheading: 'Neon-lit, high-contrast, and unmistakably futuristic.',
    color: 'violet',
    useCases: ['Discord avatar', 'Twitter/X profile', 'Web3 profile', 'Gaming identity', 'Crypto/NFT context'],
    platformsRecommended: ['Discord', 'Twitter/X', 'OpenSea', 'GitHub (gaming/web3)'],
    industries: ['Web3/Crypto', 'Gaming', 'Esports', 'Streaming', 'Science fiction', 'Tech startups'],
    content: `
<p>The cyberpunk aesthetic has moved from niche subculture to mainstream visual language — appearing in game UI design, brand campaigns, album art, and digital identity in web3 contexts. For professionals whose work or identity sits at the intersection of technology, gaming, web3, or digital-native culture, a cyberpunk portrait communicates immediately: you're not from the legacy world.</p>

<h2>The Visual Language of Cyberpunk Portraiture</h2>

<p>A well-executed cyberpunk portrait has specific elements: deep, high-contrast base lighting often from below or at dramatic angles; a color palette dominated by neon blues, purples, and cyans with bright magenta or orange accents; a sense of urban night environment; and often subtle texturing or chromatic aberration that suggests a digital-physical hybrid reality.</p>

<p>ProPortrait AI's cyberpunk neon style generates this aesthetic cohesively — placing you in a neon-lit context with dramatic lighting and the specific color palette of the genre, while keeping your face recognizable and your identity intact.</p>

<h2>Where Cyberpunk Portraits Work</h2>

<ul>
  <li><strong>Discord profiles:</strong> The dominant platform for gaming and web3 communities. A cyberpunk portrait is visually strong at the small sizes Discord uses.</li>
  <li><strong>Twitter/X:</strong> Tech founders, web3 builders, and gaming personalities use this aesthetic frequently. It signals community membership and aesthetic alignment.</li>
  <li><strong>Web3 and NFT contexts:</strong> OpenSea profiles, Farcaster, Lens Protocol — digital identity contexts where the cyberpunk aesthetic has cultural resonance.</li>
  <li><strong>GitHub (gaming/web3):</strong> Developers building in these spaces can signal their community identity through their profile photo.</li>
  <li><strong>Streaming and esports:</strong> Twitch panels, YouTube channel art, tournament bios.</li>
</ul>

<h2>Identity in High-Contrast Contexts</h2>

<p>The dramatic lighting of cyberpunk portraiture can sometimes make skin tones look cooler or more purple than natural. ProPortrait AI's skin tone lock prevents this — your skin tone is preserved as the lighting and background are adapted around it. This keeps you recognizable even in a dramatically stylized portrait.</p>

<h2>Expression</h2>

<p>This style supports a wide expression range, from intense and serious (leaning into the high-drama aesthetic) to slight smirk (personality-forward). Avoid the big friendly smile — it reads as tonally inconsistent with the aesthetic. The rest of the emotional spectrum works well.</p>
    `.trim(),
  },

  {
    id: 'watercolor',
    name: 'Watercolor',
    tagline: 'Soft, artistic, and warm — a portrait with a human touch.',
    primaryKeyword: 'watercolor AI portrait',
    metaDescription: 'Watercolor AI portrait headshots with a soft, artistic, hand-crafted quality. Ideal for wellness, coaching, and creative personal brands.',
    heroHeading: 'Watercolor AI Portraits',
    heroSubheading: 'The warmth and texture of painted portraiture, generated instantly.',
    color: 'teal',
    useCases: ['Wellness practitioner bio', 'Coach/therapist profile', 'Children\'s author', 'Artisan brand', 'Soft personal branding'],
    platformsRecommended: ['Instagram', 'Personal website', 'Pinterest', 'Wellness platforms'],
    industries: ['Wellness', 'Coaching', 'Therapy', 'Children\'s content', 'Arts and crafts', 'Yoga/Mindfulness'],
    content: `
<p>Watercolor portraiture occupies a specific emotional space: warm, soft, human, and slightly elevated. It signals creativity and sensitivity without the hard edges of digital photography. For practitioners in wellness, coaching, therapy, and artisan/craft businesses, this aesthetic communicates something specific about values — approachability, creativity, warmth — that a standard corporate headshot deliberately does not.</p>

<h2>The Watercolor Portrait Aesthetic</h2>

<p>A well-done watercolor portrait blends photographic realism in the face with the soft edges, paper texture, and color bleed of traditional watercolor painting. The result looks like a talented illustrator painted from a photograph — not like a photo with a filter applied. ProPortrait AI's watercolor style generates this cohesive painted quality rather than applying a surface-level effect.</p>

<p>The color palette leans warm and slightly desaturated — the specific quality of watercolor pigments on white paper. Backgrounds have the characteristic soft wash of watercolor backgrounds. The overall effect is one of care and human craft.</p>

<h2>Best Applications</h2>

<ul>
  <li><strong>Wellness and healing practitioners:</strong> Yoga teachers, meditation guides, Reiki practitioners, nutritionists. The soft, warm aesthetic signals safety and approachability.</li>
  <li><strong>Coaches and therapists:</strong> Life coaches, executive coaches, and therapists whose practice is built on human connection. This aesthetic creates warmth before the first session.</li>
  <li><strong>Children's content creators:</strong> Authors, illustrators, educators, and YouTubers whose audience is children or families benefit from a warm, non-threatening aesthetic.</li>
  <li><strong>Artisan and handmade brands:</strong> Jewelers, potters, textile artists — businesses where handcraft and human touch are the product. The aesthetic mirrors the product values.</li>
  <li><strong>Soft personal branding:</strong> Accounts that want to build an audience through warmth and authenticity rather than authority and expertise.</li>
</ul>

<h2>Platform Fit</h2>

<p>Watercolor portraits are strongest on Instagram (where artistic imagery performs well), personal websites with warm/earthy design aesthetics, and any platform where visual distinctiveness matters. They generally don't work well on LinkedIn for formal corporate use, though they can work for the wellness and creative industries even on LinkedIn.</p>

<h2>Getting the Best Results</h2>

<p>The watercolor style works best with a clear, front-facing source photo with good lighting. The AI adapts the photo into the painted aesthetic, but unclear or heavily shadowed source photos can produce less detailed facial results. Use the skin tone lock to ensure the warm color palette of the watercolor style doesn't shift your natural skin tone.</p>
    `.trim(),
  },
];

export function getStylePage(id: string): StylePageData | undefined {
  return stylePages.find((s) => s.id === id);
}
