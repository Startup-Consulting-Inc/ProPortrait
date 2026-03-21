import { Helmet } from 'react-helmet-async';
import AppFooter from './AppFooter';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'AI Headshots vs Traditional Photography — ProPortrait AI',
  description: 'Comparing AI headshots to traditional photography: cost, quality, turnaround, and when to choose each.',
  url: 'https://portrait.ai-biz.app/comparison',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://portrait.ai-biz.app' },
      { '@type': 'ListItem', position: 2, name: 'AI vs Photographer', item: 'https://portrait.ai-biz.app/comparison' },
    ],
  },
};

const rows = [
  { feature: 'Cost', ai: '$0 to try, $4.99–$9.99 to download', photo: '$200–$600 per session' },
  { feature: 'Turnaround', ai: '30 seconds', photo: '1–2 weeks (booking + delivery)' },
  { feature: 'Style options', ai: '12+ styles, switch instantly', photo: '1 session = 1–2 looks' },
  { feature: 'Revisions', ai: 'Unlimited, free', photo: 'Reshoots cost extra' },
  { feature: 'Identity control', ai: 'Granular locks (skin tone, eyes, hair)', photo: 'Natural (photographer captures you)' },
  { feature: 'Privacy', ai: 'Photos deleted after session', photo: 'Stored by photographer' },
  { feature: 'Print quality', ai: 'Up to 2048×2048px HD', photo: 'Print-ready, unlimited resolution' },
  { feature: 'Environmental shots', ai: 'Generated backgrounds only', photo: 'Real physical locations' },
  { feature: 'Expression nuance', ai: 'AI-generated — plausible, not personal', photo: 'Captured real moment' },
  { feature: 'Scheduling', ai: 'No scheduling needed', photo: '1–2 weeks out, typically' },
];

const scenarios = [
  {
    scenario: 'LinkedIn profile update',
    verdict: 'AI headshot',
    reason: 'Sufficient quality, 100x cheaper, instant results.',
  },
  {
    scenario: 'First professional photo',
    verdict: 'AI headshot',
    reason: 'No upfront cost, unlimited iterations to get it right.',
  },
  {
    scenario: 'GitHub / portfolio profile',
    verdict: 'AI headshot',
    reason: 'Platform-sized export at exact specs, instant.',
  },
  {
    scenario: 'Company directory headshot',
    verdict: 'AI headshot',
    reason: 'Consistent style across the team without coordinating a studio day.',
  },
  {
    scenario: 'Dating app profile',
    verdict: 'AI headshot',
    reason: 'Candid & Real style with naturalness control produces warm, authentic-looking results.',
  },
  {
    scenario: 'Major press / Forbes feature',
    verdict: 'Photographer',
    reason: "At this level, a professional photographer's captured moment adds value AI can't replicate.",
  },
  {
    scenario: 'Conference keynote speaker',
    verdict: 'Photographer',
    reason: 'High-profile context; environmental portrait from a real shoot may be expected.',
  },
  {
    scenario: 'Brand storytelling / environmental shot',
    verdict: 'Photographer',
    reason: "Genuine location and physical context can't be composited convincingly for all uses.",
  },
];

export default function ComparisonPage() {
  return (
    <>
      <Helmet>
        <title>AI Headshots vs Traditional Photography: Cost, Quality & When to Choose | ProPortrait AI</title>
        <meta name="description" content="Comparing AI headshots to traditional photography in 2026. Cost breakdown, quality comparison, and a decision framework for when to choose each." />
        <link rel="canonical" href="https://portrait.ai-biz.app/comparison" />
        <meta property="og:title" content="AI Headshots vs Traditional Photography — ProPortrait AI" />
        <meta property="og:description" content="Cost, quality, turnaround, and when AI headshots beat traditional photography (and when they don't)." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="ProPortrait AI" className="h-7 w-7 rounded-lg" />
            <span className="font-bold text-lg tracking-tight">
              ProPortrait<span className="text-indigo-600"> AI</span>
            </span>
          </a>
          <a
            href="/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Try Free
          </a>
        </header>

        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="text-sm text-slate-400 mb-8 flex items-center gap-2">
            <a href="/" className="hover:text-slate-600">Home</a>
            <span>›</span>
            <span className="text-slate-800 font-medium">AI vs Photographer</span>
          </nav>

          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-5 leading-tight">
              AI Headshots vs Traditional Photography
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed max-w-2xl">
              A $300 photographer session or a $4.99 AI download — the gap is real, and so are the trade-offs. Here's an honest breakdown to help you choose.
            </p>
          </div>

          {/* Cost highlight cards */}
          <div className="grid sm:grid-cols-2 gap-6 mb-14">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-7">
              <div className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-2">AI Headshot</div>
              <div className="text-4xl font-extrabold text-slate-900 mb-1">$0 – $9.99</div>
              <div className="text-slate-600 text-sm">Free to generate. Pay $4.99–$9.99 to download. No subscription.</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Traditional Photographer</div>
              <div className="text-4xl font-extrabold text-slate-900 mb-1">$200 – $600</div>
              <div className="text-slate-600 text-sm">Typical headshot session. Premium photographers charge $500–$1,000+.</div>
            </div>
          </div>

          {/* Full comparison table */}
          <div className="mb-14">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Full Comparison</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-4 font-semibold text-slate-600 w-36">Category</th>
                    <th className="px-5 py-4 font-bold text-indigo-600 text-left">AI Headshot</th>
                    <th className="px-5 py-4 font-semibold text-slate-500 text-left">Traditional Photographer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.feature} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-semibold text-slate-700">{row.feature}</td>
                      <td className="px-5 py-3.5 text-slate-700">{row.ai}</td>
                      <td className="px-5 py-3.5 text-slate-500">{row.photo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Decision framework */}
          <div className="mb-14">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">When to Choose Each</h2>
            <p className="text-slate-500 mb-6">Based on the scenario, not ideology.</p>
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              {scenarios.map((s, i) => (
                <div
                  key={s.scenario}
                  className={`flex flex-col sm:flex-row gap-3 sm:gap-0 px-5 py-4 ${
                    i !== scenarios.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <div className="sm:w-64 font-semibold text-slate-800 text-sm">{s.scenario}</div>
                  <div className="sm:w-36">
                    <span
                      className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                        s.verdict === 'AI headshot'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {s.verdict}
                    </span>
                  </div>
                  <div className="flex-1 text-sm text-slate-500">{s.reason}</div>
                </div>
              ))}
            </div>
          </div>

          {/* The identity accuracy section */}
          <div className="mb-14 rounded-2xl bg-amber-50 border border-amber-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">The Hidden Issue: Identity Accuracy</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              The biggest quality variable in AI headshots isn't style or background — it's how accurately the AI preserves your face. Many tools subtly change your eye color, lighten or darken your skin tone, or smooth your features until the result looks like a more attractive stranger rather than you.
            </p>
            <p className="text-slate-700 leading-relaxed">
              ProPortrait AI's granular identity locks let you pin your exact skin tone, eye color, hair length, and hair texture individually — so the AI only improves quality without changing who you are. The naturalness slider (0–100) prevents the over-processed "AI glow" that makes many AI portraits immediately recognizable as artificial.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center rounded-2xl bg-indigo-50 border border-indigo-100 p-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Try before you decide
            </h2>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Generate and preview a professional portrait for free. Pay only if you like the result — no commitment.
            </p>
            <a
              href="/create"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-7 py-3.5 rounded-xl transition-colors"
            >
              Create Your Portrait — Free
            </a>
            <p className="mt-3 text-xs text-slate-400">No credit card required to try.</p>
          </div>
        </main>

        <AppFooter />
      </div>
    </>
  );
}
