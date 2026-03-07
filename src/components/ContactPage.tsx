import { useState, type ChangeEvent, type FormEvent } from 'react';
import { CheckCircle2, Clock3, LifeBuoy, Mail, SendHorizonal } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

const CONTACT_REASONS = [
  { value: 'general', label: 'General question' },
  { value: 'support', label: 'Product support' },
  { value: 'billing', label: 'Billing or account' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'feature', label: 'Feature request' },
  { value: 'bug', label: 'Bug report' },
  { value: 'other', label: 'Other' },
] as const;

type ContactReason = typeof CONTACT_REASONS[number]['value'];

type ContactFormState = {
  name: string;
  email: string;
  company: string;
  reason: ContactReason;
  message: string;
};

const INITIAL_FORM: ContactFormState = {
  name: '',
  email: '',
  company: '',
  reason: 'general',
  message: '',
};

export default function ContactPage() {
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const body = await response.json().catch(() => ({} as { error?: string }));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to send your message. Please try again.');
      }

      setSubmitted(true);
      setForm(INITIAL_FORM);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to send your message. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <a href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="ProPortrait AI" className="h-7 w-7" />
          <span className="font-bold text-lg tracking-tight">
            ProPortrait<span className="text-indigo-600"> AI</span>
          </span>
        </a>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-500">
          <a href="/#features" className="hover:text-slate-800 transition-colors">Features</a>
          <a href="/#pricing" className="hover:text-slate-800 transition-colors">Pricing</a>
          <a href="/contact" className="text-slate-900 font-semibold">Contact</a>
        </nav>
        <a
          href="/app"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Start free
        </a>
      </header>

      <main className="flex-1 px-6 py-10 max-w-6xl mx-auto w-full">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] items-start">
          <section className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-indigo-100">
                <Mail className="w-4 h-4" />
                Contact ProPortrait AI
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  Questions, feedback, or partnership ideas?
                </h1>
                <p className="text-lg text-slate-500 leading-relaxed max-w-xl">
                  Send us a note and we will route it to the right person. For product issues,
                  billing questions, or feature ideas, this is the fastest way to reach the team.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Clock3 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">Fast response window</div>
                  <p className="text-sm text-slate-500 mt-1">
                    We aim to reply within 1 to 2 business days.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <LifeBuoy className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">Real product support</div>
                  <p className="text-sm text-slate-500 mt-1">
                    Share bugs, billing issues, feature requests, or workflow questions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">Specialized inboxes stay separate</div>
                  <p className="text-sm text-slate-500 mt-1">
                    Privacy, legal, and DMCA requests should still go to the dedicated addresses below.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-3">How we can help</h2>
              <ul className="space-y-3 text-sm text-slate-600">
                {[
                  'Troubleshoot generation, editing, export, or account issues',
                  'Answer questions about pricing, plans, and billing',
                  'Review feature ideas and workflow feedback',
                  'Discuss partnerships, press, or other business requests',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-white text-indigo-600 flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-3">Need a specialized contact?</h2>
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  Privacy and data requests:{' '}
                  <a href="mailto:privacy@portrait.ai-biz.app" className="text-indigo-600 underline">
                    privacy@portrait.ai-biz.app
                  </a>
                </p>
                <p>
                  Terms or legal questions:{' '}
                  <a href="mailto:legal@portrait.ai-biz.app" className="text-indigo-600 underline">
                    legal@portrait.ai-biz.app
                  </a>
                </p>
                <p>
                  DMCA notices:{' '}
                  <a href="mailto:dmca@portrait.ai-biz.app" className="text-indigo-600 underline">
                    dmca@portrait.ai-biz.app
                  </a>
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
            {submitted ? (
              <div className="text-center py-8 sm:py-10">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Message sent</h2>
                <p className="text-slate-500 mt-3 max-w-md mx-auto">
                  Thanks for reaching out. We have your message and will follow up as soon as we can.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setError(null);
                  }}
                  className="mt-6 inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Send us a message</h2>
                  <p className="text-sm text-slate-500 mt-2">
                    All fields marked required help us respond faster.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Full name</span>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        minLength={2}
                        maxLength={100}
                        autoComplete="name"
                        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Email address</span>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        maxLength={160}
                        autoComplete="email"
                        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Company</span>
                      <input
                        type="text"
                        name="company"
                        value={form.company}
                        onChange={handleChange}
                        maxLength={120}
                        autoComplete="organization"
                        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Contact reason</span>
                      <select
                        name="reason"
                        value={form.reason}
                        onChange={handleChange}
                        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {CONTACT_REASONS.map((reason) => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Message</span>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      minLength={10}
                      maxLength={2000}
                      rows={7}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="mt-2 block text-xs text-slate-400">
                      Please avoid sending sensitive documents or personal photos through this form.
                    </span>
                  </label>

                  {error ? (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <SendHorizonal className="w-4 h-4" />
                        Send message
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-100 py-6 px-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-4">
          <span>© 2026 ProPortrait AI</span>
          <a href="/" className="hover:text-slate-600 transition-colors">Home</a>
          <a href="/#pricing" className="hover:text-slate-600 transition-colors">Pricing</a>
          <a href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-slate-600 transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
}
