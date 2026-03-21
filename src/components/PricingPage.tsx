import { Helmet } from 'react-helmet-async';
import AppFooter from './AppFooter';

const pricingJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Pricing — ProPortrait AI',
  description: 'No subscription. Generate AI professional headshots for free, pay only to download. Single HD portrait $4.99, all platform sizes $9.99.',
  url: 'https://portrait.ai-biz.app/pricing',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://portrait.ai-biz.app' },
      { '@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://portrait.ai-biz.app/pricing' },
    ],
  },
};

const offerJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'ProPortrait AI Pricing',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'Offer',
        name: 'Free — Generate & Preview',
        description: 'Unlimited portrait generation and editing. Free forever.',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'ProPortrait AI' },
      },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: {
        '@type': 'Offer',
        name: 'HD Portrait — Single Download',
        description: 'Download one HD portrait at 2048×2048px resolution.',
        price: '4.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'ProPortrait AI' },
      },
    },
    {
      '@type': 'ListItem',
      position: 3,
      item: {
        '@type': 'Offer',
        name: 'All Platforms — ZIP Download',
        description: 'All platform-optimized sizes: LinkedIn, GitHub, Resume, Twitter, Instagram in a ZIP file.',
        price: '9.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'ProPortrait AI' },
      },
    },
  ],
};

const tiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'Generate and edit as much as you want. No credit card. No time limit.',
    cta: 'Start for free',
    ctaHref: '/create',
    ctaPrimary: false,
    features: [
      'Unlimited portrait generations',
      'All 12+ styles available',
      'Full editing suite (background, lighting, expression)',
      'Identity locks (eye color, skin tone, hair)',
      'Naturalness slider',
      'Before/after comparison slider',
      'Watermarked preview',
    ],
    footnote: null,
  },
  {
    name: 'HD Portrait',
    price: '$4.99',
    description: 'One-time payment. Download one HD portrait. No subscription.',
    cta: 'Get started free',
    ctaHref: '/create',
    ctaPrimary: true,
    features: [
      'Everything in Free',
      '1 HD portrait download (2048×2048px)',
      'No watermark on download',
      'Commercial use license',
      'Yours forever',
    ],
    footnote: 'Pay only when you\'re satisfied with the result.',
  },
  {
    name: 'All Platforms',
    price: '$9.99',
    description: 'All platform sizes in one ZIP. LinkedIn, GitHub, Resume, Twitter, Instagram.',
    cta: 'Get started free',
    ctaHref: '/create',
    ctaPrimary: false,
    features: [
      'Everything in HD Portrait',
      'LinkedIn (800×800px)',
      'GitHub (500×500px)',
      'Resume/CV (600×800px)',
      'Twitter/X (400×400px)',
      'Instagram (320×320px)',
      'ZIP file — download once, use everywhere',
    ],
    footnote: 'Most popular for job seekers and professionals.',
  },
];

const faqs = [
  {
    q: 'Do I need a subscription?',
    a: 'No. ProPortrait AI has no subscription or recurring fees. You pay once per download, only when you\'re ready.',
  },
  {
    q: 'What happens if I\'m not satisfied with my portrait?',
    a: 'Don\'t download it. You can generate unlimited free previews until you\'re happy with the result before paying anything.',
  },
  {
    q: 'Can I use the downloaded portraits commercially?',
    a: 'Yes. All downloaded portraits come with a commercial use license — use them for LinkedIn, company websites, press materials, or any professional purpose.',
  },
  {
    q: 'Does the free tier require a credit card?',
    a: 'No. Generating and previewing is completely free — no credit card required until you decide to download.',
  },
  {
    q: 'How is this different from HeadshotPro or Aragon?',
    a: 'HeadshotPro and Aragon charge $25–$50/month on subscription. ProPortrait AI charges $4.99 or $9.99 per download with no subscription. You also try before you pay — generate for free and only pay when satisfied.',
  },
];

export default function PricingPage() {
  return (
    <>
      <Helmet>
        <title>Pricing — No Subscription AI Headshots | ProPortrait AI</title>
        <meta name="description" content="ProPortrait AI pricing: generate and preview free, pay $4.99 for a single HD portrait or $9.99 for all platform sizes. No subscription, no recurring fees." />
        <link rel="canonical" href="https://portrait.ai-biz.app/pricing" />
        <meta property="og:title" content="Pricing — ProPortrait AI" />
        <meta property="og:description" content="No subscription. Generate free, pay $4.99–$9.99 to download. No recurring fees." />
        <script type="application/ld+json">{JSON.stringify(pricingJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(offerJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="ProPortrait AI" className="h-7 w-7 rounded-lg" />
            <span className="font-bold text-lg tracking-tight">
              ProPortrait<span className="text-indigo-600"> AI</span>
            </span>
          </a>
          <nav className="hidden sm:flex items-center gap-5 text-sm text-slate-500">
            <a href="/" className="hover:text-slate-800 transition-colors">Home</a>
            <a href="/pricing" className="text-indigo-600 font-semibold">Pricing</a>
            <a href="/create" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors">
              Try Free
            </a>
          </nav>
        </header>

        <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
          {/* Hero */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-emerald-200 mb-5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No subscription required
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Simple, honest pricing
            </h1>
            <p className="text-xl text-slate-500 max-w-xl mx-auto">
              Generate and edit for free. Pay only when you download a result you love.
            </p>
          </div>

          {/* Pricing tiers */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-7 flex flex-col ${
                  tier.ctaPrimary
                    ? 'border-indigo-400 shadow-lg shadow-indigo-100 bg-white ring-2 ring-indigo-200'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {tier.ctaPrimary && (
                  <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full w-fit mb-4">
                    Most popular
                  </div>
                )}
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900">{tier.name}</h2>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">{tier.price}</span>
                    {tier.price !== '$0' && (
                      <span className="text-slate-400 text-sm">one-time</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">{tier.description}</p>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {tier.footnote && (
                  <p className="text-xs text-slate-400 mb-4">{tier.footnote}</p>
                )}
                <a
                  href={tier.ctaHref}
                  className={`text-center font-bold py-3 rounded-xl transition-colors text-sm ${
                    tier.ctaPrimary
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">How we compare</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-4 font-semibold text-slate-600">Feature</th>
                    <th className="px-5 py-4 font-bold text-indigo-600">ProPortrait AI</th>
                    <th className="px-5 py-4 font-semibold text-slate-500">HeadshotPro</th>
                    <th className="px-5 py-4 font-semibold text-slate-500">Aragon AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['Free to generate', '✅ Unlimited', '❌ No', '❌ No'],
                    ['Subscription required', '❌ None', '✅ ~$29/mo', '✅ ~$35/mo'],
                    ['Pay per download', '✅ $4.99–$9.99', '❌', '❌'],
                    ['Identity preservation', '✅ Granular locks', '⚠️ Limited', '⚠️ Limited'],
                    ['Privacy (no training)', '✅', '⚠️ Unclear', '⚠️ Unclear'],
                    ['Platform-sized exports', '✅ All platforms', '✅', '⚠️ Limited'],
                  ].map(([feature, pp, hp, aragon]) => (
                    <tr key={feature} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 text-slate-700 font-medium">{feature}</td>
                      <td className="px-5 py-3.5 text-center font-semibold text-slate-800">{pp}</td>
                      <td className="px-5 py-3.5 text-center text-slate-500">{hp}</td>
                      <td className="px-5 py-3.5 text-center text-slate-500">{aragon}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Pricing FAQ</h2>
            <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Start for free today</h2>
            <p className="text-slate-500 mb-6">No credit card. No subscription. Generate your first portrait in 30 seconds.</p>
            <a
              href="/create"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base px-8 py-4 rounded-2xl transition-colors"
            >
              Create Your Portrait — Free
            </a>
          </div>
        </main>

        <AppFooter />
      </div>
    </>
  );
}
