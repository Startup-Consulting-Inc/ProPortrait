import { Helmet } from 'react-helmet-async';
import { getStylePage, stylePages } from '../lib/styleData';
import AppFooter from './AppFooter';

interface StylePageProps {
  styleId: string;
}

const heroBg: Record<string, string> = {
  indigo:  'bg-gradient-to-br from-indigo-50 to-indigo-100 border-b border-indigo-200',
  emerald: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-b border-emerald-200',
  amber:   'bg-gradient-to-br from-amber-50 to-amber-100 border-b border-amber-200',
  orange:  'bg-gradient-to-br from-orange-50 to-orange-100 border-b border-orange-200',
  slate:   'bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200',
  violet:  'bg-gradient-to-br from-violet-50 to-violet-100 border-b border-violet-200',
  teal:    'bg-gradient-to-br from-teal-50 to-teal-100 border-b border-teal-200',
};

export default function StylePage({ styleId }: StylePageProps) {
  const style = getStylePage(styleId);

  if (!style) {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Style not found</h1>
        <p className="text-slate-500 mb-6">This style page doesn't exist.</p>
        <a href="/" className="text-indigo-600 hover:underline font-semibold">← Back to Home</a>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: style.heroHeading,
    description: style.metaDescription,
    url: `https://portrait.ai-biz.app/styles/${style.id}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://portrait.ai-biz.app' },
        { '@type': 'ListItem', position: 2, name: 'Styles', item: 'https://portrait.ai-biz.app/styles' },
        { '@type': 'ListItem', position: 3, name: style.name, item: `https://portrait.ai-biz.app/styles/${style.id}` },
      ],
    },
  };

  const relatedStyles = stylePages.filter((s) => s.id !== style.id).slice(0, 3);
  const heroBgClass = heroBg[style.color] ?? heroBg.indigo;

  return (
    <>
      <Helmet>
        <title>{`${style.heroHeading} — Free AI Headshots | ProPortrait AI`}</title>
        <meta name="description" content={style.metaDescription} />
        <link rel="canonical" href={`https://portrait.ai-biz.app/styles/${style.id}`} />
        <meta property="og:title" content={style.heroHeading} />
        <meta property="og:description" content={style.metaDescription} />
        <meta property="og:url" content={`https://portrait.ai-biz.app/styles/${style.id}`} />
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

        {/* Colored hero band */}
        <div className={`${heroBgClass} px-6 py-14`}>
          <div className="max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="text-sm text-slate-400 mb-8 flex items-center gap-2">
              <a href="/" className="hover:text-slate-600">Home</a>
              <span>›</span>
              <span className="text-slate-600">Styles</span>
              <span>›</span>
              <span className="text-slate-800 font-medium">{style.name}</span>
            </nav>

            <span className="inline-block bg-white/80 text-indigo-600 text-sm font-semibold px-3 py-1 rounded-full mb-4 border border-indigo-100">
              AI Portrait Style
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
              {style.heroHeading}
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed mb-8">
              {style.heroSubheading}
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="/create"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base px-7 py-3.5 rounded-xl transition-colors"
              >
                Try {style.name} — Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <span className="inline-flex items-center text-sm text-slate-500 px-4">
                Generate free · Pay only to download
              </span>
            </div>
          </div>
        </div>

        <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
          {/* Use cases + platforms */}
          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Best For</h3>
              <ul className="space-y-1.5">
                {style.useCases.map((uc) => (
                  <li key={uc} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    {uc}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Platforms</h3>
              <ul className="space-y-1.5">
                {style.platformsRecommended.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Industries</h3>
              <ul className="space-y-1.5">
                {style.industries.map((ind) => (
                  <li key={ind} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {ind}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Article content */}
          <article
            className="prose prose-slate prose-lg max-w-none mb-14
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-slate-700 prose-p:leading-relaxed
              prose-ul:text-slate-700 prose-li:my-1
              prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-slate-900"
            dangerouslySetInnerHTML={{ __html: style.content }}
          />

          {/* CTA */}
          <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-8 text-center mb-14">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Try the {style.name} style — free
            </h2>
            <p className="text-slate-500 mb-5 text-sm max-w-sm mx-auto">
              Generate unlimited previews for free. Pay only when you're ready to download.
            </p>
            <a
              href="/create"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Create Your Portrait
            </a>
          </div>

          {/* Related styles */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Explore Other Styles</h2>
            <div className="grid sm:grid-cols-3 gap-4 overflow-x-auto">
              {relatedStyles.map((s) => (
                <a
                  key={s.id}
                  href={`/styles/${s.id}`}
                  className="group block rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all p-5"
                >
                  <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full mb-3">
                    AI Style
                  </span>
                  <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">{s.tagline}</p>
                  <span className="text-xs font-semibold text-indigo-600 group-hover:underline">
                    View Style →
                  </span>
                </a>
              ))}
            </div>
          </div>
        </main>

        <AppFooter />
      </div>
    </>
  );
}
