import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import AppFooter from './AppFooter';

const sections = [
  { id: 'what-we-collect', label: 'What We Collect' },
  { id: 'how-we-use', label: 'How We Use It' },
  { id: 'data-retention', label: 'Data Retention' },
  { id: 'third-party', label: 'Third-Party Services' },
  { id: 'bipa', label: 'BIPA Notice (Illinois)' },
  { id: 'gdpr', label: 'GDPR Rights' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'contact', label: 'Contact' },
];

export default function PrivacyPage() {
  const { user } = useAuthContext();
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
    <Helmet>
      <title>Privacy Policy — ProPortrait AI</title>
      <meta name="description" content="ProPortrait AI is privacy-first. Learn how we handle your photos: processed and deleted immediately, never stored after your session ends." />
      <link rel="canonical" href="https://portrait.ai-biz.app/privacy" />
    </Helmet>
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <a href={user ? '/create' : '/'} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm mb-8">
          ← Back to ProPortrait AI
        </a>

        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-100 mb-1">
                Legal
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Privacy Policy
              </h1>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-xs font-medium px-3 py-1.5 rounded-full">
            Last updated: March 2026
          </span>
        </div>

        {/* Layout with ToC on desktop */}
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
          {/* Table of contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">On this page</p>
              <nav className="space-y-1">
                {sections.map((s, i) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 py-1 transition-colors"
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div>
            <section id="what-we-collect" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">What We Collect</h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                When you use ProPortrait AI, we process the photo you upload solely to generate your portrait. We
                do not store your original photo after processing is complete. We also collect standard server logs
                (IP address, browser type, request timestamps) for security and operational purposes.
              </p>
              <p className="text-slate-700 leading-relaxed">
                If you provide an email address, we store it to send you updates about your portraits and product
                news. You can unsubscribe at any time.
              </p>
            </section>

            <section id="how-we-use" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">How We Use It</h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                Your uploaded photo is sent to Google Gemini AI solely to generate a professional portrait. We do
                not use your photo to train any AI model, and we do not sell or share your image with third parties.
              </p>
              <p className="text-slate-700 leading-relaxed">
                If you accept analytics cookies, we use PostHog to understand how people use the product so we can
                improve it. Analytics data is anonymized and does not include your photos.
              </p>
            </section>

            <section id="data-retention" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
              <p className="text-slate-700 leading-relaxed">
                Generated portraits are stored temporarily so you can download them. Free-tier portraits are deleted within 24 hours. If you are a paid subscriber, we store all portraits you save. Your original uploaded photo is not retained after the generation job is complete.
              </p>
            </section>

            <section id="third-party" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                We use the following third-party services to operate ProPortrait AI:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li><strong>Google Gemini AI</strong> — processes your photo to generate portraits (Google Privacy Policy applies)</li>
                <li><strong>Stripe</strong> — handles payment processing (Stripe Privacy Policy applies)</li>
                <li><strong>PostHog</strong> — product analytics, only when you consent (PostHog Privacy Policy applies)</li>
                <li><strong>Sentry</strong> — error tracking for app stability (Sentry Privacy Policy applies)</li>
                <li><strong>Cloudflare R2</strong> — temporary portrait storage</li>
              </ul>
            </section>

            <section id="bipa" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">BIPA Notice (Illinois)</h2>
              <p className="text-slate-700 leading-relaxed">
                If you are an Illinois resident, you have rights under the Biometric Information Privacy Act (BIPA).
                ProPortrait AI processes facial geometry from your uploaded photo only to generate a portrait image.
                We do not store, sell, lease, trade, or profit from biometric identifiers or biometric information.
                Biometric data derived from your photo is not retained after the portrait generation is complete. For
                questions about our BIPA compliance, contact us at{' '}
                <a href="mailto:privacy@portrait.ai-biz.app" className="text-indigo-600 hover:underline">privacy@portrait.ai-biz.app</a>.
              </p>
            </section>

            <section id="gdpr" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">GDPR Rights</h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                If you are in the European Economic Area (EEA), you have the right to access, correct, or delete
                personal data we hold about you. You also have the right to object to or restrict processing, and
                the right to data portability.
              </p>
              <p className="text-slate-700 leading-relaxed">
                To exercise these rights, contact us at{' '}
                <a href="mailto:privacy@portrait.ai-biz.app" className="text-indigo-600 hover:underline">privacy@portrait.ai-biz.app</a>. We will respond within 30 days.
              </p>
            </section>

            <section id="cookies" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">Cookies</h2>
              <p className="text-slate-700 leading-relaxed">
                We use a session cookie to maintain your session across requests. If you accept analytics cookies,
                PostHog may set additional cookies. You can decline analytics cookies using the consent banner. You
                can also clear cookies at any time through your browser settings.
              </p>
            </section>

            <section id="contact" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">Contact</h2>
              <p className="text-slate-700 leading-relaxed">
                For any privacy questions, data requests, or concerns, please email us at{' '}
                <a href="mailto:privacy@portrait.ai-biz.app" className="text-indigo-600 hover:underline">privacy@portrait.ai-biz.app</a>.
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Back to top button */}
      {showBackTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 shadow-md flex items-center justify-center text-slate-600 transition-colors z-50"
          aria-label="Back to top"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      <AppFooter />
    </div>
    </>
  );
}
