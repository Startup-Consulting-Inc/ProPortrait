import AppFooter from './AppFooter';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <div className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <a href="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm mb-8">
          ← Back to ProPortrait AI
        </a>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: March 2026</p>

        <section className="mb-8">
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

        <section className="mb-8">
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

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
          <p className="text-slate-700 leading-relaxed">
          Generated portraits are stored temporarily so you can download them. Free-tier portraits are deleted within 24 hours. If you are a paid subscriber, we store all portraits you save. Your original uploaded photo is not retained after the generation job is complete.

          </p>
        </section>

        <section className="mb-8">
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

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">BIPA Notice (Illinois)</h2>
          <p className="text-slate-700 leading-relaxed">
            If you are an Illinois resident, you have rights under the Biometric Information Privacy Act (BIPA).
            ProPortrait AI processes facial geometry from your uploaded photo only to generate a portrait image.
            We do not store, sell, lease, trade, or profit from biometric identifiers or biometric information.
            Biometric data derived from your photo is not retained after the portrait generation is complete. For
            questions about our BIPA compliance, contact us at privacy@portrait.ai-biz.app.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">GDPR Rights</h2>
          <p className="text-slate-700 leading-relaxed mb-3">
            If you are in the European Economic Area (EEA), you have the right to access, correct, or delete
            personal data we hold about you. You also have the right to object to or restrict processing, and
            the right to data portability.
          </p>
          <p className="text-slate-700 leading-relaxed">
            To exercise these rights, contact us at privacy@portrait.ai-biz.app. We will respond within 30 days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Cookies</h2>
          <p className="text-slate-700 leading-relaxed">
            We use a session cookie to maintain your session across requests. If you accept analytics cookies,
            PostHog may set additional cookies. You can decline analytics cookies using the consent banner. You
            can also clear cookies at any time through your browser settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p className="text-slate-700 leading-relaxed">
            For any privacy questions, data requests, or concerns, please email us at{' '}
            <a href="mailto:privacy@portrait.ai-biz.app" className="text-indigo-600 underline">privacy@portrait.ai-biz.app</a>.
          </p>
        </section>
      </div>
      <AppFooter />
    </div>
  );
}
