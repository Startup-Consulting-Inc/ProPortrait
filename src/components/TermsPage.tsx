import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FileText } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import AppFooter from './AppFooter';

const sections = [
  { id: 'service-description', label: 'Service Description' },
  { id: 'acceptable-use', label: 'Acceptable Use' },
  { id: 'intellectual-property', label: 'Intellectual Property' },
  { id: 'dmca', label: 'DMCA Policy' },
  { id: 'disclaimers', label: 'Disclaimers' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'contact', label: 'Contact' },
];

export default function TermsPage() {
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
      <title>Terms of Service — ProPortrait AI</title>
      <meta name="description" content="Read the ProPortrait AI Terms of Service. Understand your rights and responsibilities when using our AI professional headshot generator." />
      <link rel="canonical" href="https://portrait.ai-biz.app/terms" />
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
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-100 mb-1">
                Legal
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Terms of Service
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
            <section id="service-description" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">Service Description</h2>
              <p className="text-slate-700 leading-relaxed">
                ProPortrait AI provides an AI-powered professional headshot generation service. By using this
                service, you agree to these Terms of Service. If you do not agree, please do not use the service.
              </p>
            </section>

            <section id="acceptable-use" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">Acceptable Use</h2>
              <p className="text-slate-700 leading-relaxed mb-3">You agree not to use ProPortrait AI to:</p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Upload photos of individuals without their explicit consent</li>
                <li>Generate portraits intended to impersonate, defame, or deceive others</li>
                <li>Create content that violates applicable laws or third-party rights</li>
                <li>Attempt to reverse-engineer, scrape, or abuse the service</li>
                <li>Circumvent usage limits or access controls</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-3">
                You must be at least 18 years old to use this service. By uploading a photo of another person,
                you represent that you have their consent.
              </p>
            </section>

            <section id="intellectual-property" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">Intellectual Property</h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                You retain all rights to your original uploaded photos. You own the generated portraits produced
                from your photos. You grant ProPortrait AI a limited, non-exclusive license to process your photo
                solely to provide the service.
              </p>
              <p className="text-slate-700 leading-relaxed">
                ProPortrait AI and its underlying technology, branding, and software remain the property of
                ProPortrait AI. You may not reproduce, distribute, or create derivative works from our software
                or branding without written permission.
              </p>
            </section>

            <section id="dmca" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">DMCA Policy</h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                If you believe that content generated by ProPortrait AI infringes your copyright, please send a
                DMCA takedown notice to{' '}
                <a href="mailto:dmca@portrait.ai-biz.app" className="text-indigo-600 hover:underline">dmca@portrait.ai-biz.app</a>{' '}
                including:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>A description of the copyrighted work you claim was infringed</li>
                <li>Identification of the infringing material and its location</li>
                <li>Your contact information</li>
                <li>A statement that you have a good faith belief the use is unauthorized</li>
                <li>A statement, under penalty of perjury, that the information is accurate</li>
                <li>Your physical or electronic signature</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-3">
                We will respond to valid DMCA notices promptly.
              </p>
            </section>

            <section id="disclaimers" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">Disclaimers</h2>
              <p className="text-slate-700 leading-relaxed">
                ProPortrait AI is provided "as is" without warranty of any kind. We do not guarantee that generated
                portraits will be suitable for any particular purpose. AI-generated images may not perfectly
                represent the subject. You use the service at your own risk.
              </p>
            </section>

            <section id="liability" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
              <p className="text-slate-700 leading-relaxed">
                To the maximum extent permitted by law, ProPortrait AI shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages arising from your use of the service.
                Our total liability to you for any claims arising from these terms or the service shall not exceed
                the amount you paid us in the 12 months preceding the claim.
              </p>
            </section>

            <section id="governing-law" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">Governing Law</h2>
              <p className="text-slate-700 leading-relaxed">
                These Terms are governed by the laws of the State of Illinois, United States, without regard to
                its conflict of law provisions. Any disputes shall be resolved in the courts of Cook County,
                Illinois.
              </p>
            </section>

            <section id="contact" className="mb-8 border-l-4 border-indigo-200 pl-6">
              <h2 className="text-xl font-semibold mb-3">Contact</h2>
              <p className="text-slate-700 leading-relaxed">
                For questions about these Terms, contact us at{' '}
                <a href="mailto:legal@portrait.ai-biz.app" className="text-indigo-600 hover:underline">legal@portrait.ai-biz.app</a>.
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
