/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import UserMenu from './UserMenu';
import AppFooter from './AppFooter';

function HeroSlider() {
  const [position, setPosition] = useState(42);
  const [isDragging, setIsDragging] = useState(false);
  const [hinted, setHinted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
    setHinted(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => updatePosition(e.clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, updatePosition]);

  // Animated hint sweep on first load
  useEffect(() => {
    if (!hinted) return;
    let frame: number;
    let startTime: number | null = null;
    const duration = 1600;
    const delay = 900;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime - delay;
      if (elapsed < 0) { frame = requestAnimationFrame(animate); return; }
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setPosition(42 + Math.sin(eased * Math.PI) * 30);
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [hinted]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl shadow-2xl cursor-col-resize select-none"
      style={{ aspectRatio: '1 / 1' }}
      onMouseDown={(e) => { setIsDragging(true); updatePosition(e.clientX); }}
      onTouchStart={(e) => updatePosition(e.touches[0].clientX)}
      onTouchMove={(e) => { e.preventDefault(); updatePosition(e.touches[0].clientX); }}
    >
      <img
        src="/sample-before.jpg"
        alt="Original casual photo"
        className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
        draggable={false}
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src="/sample-after.jpg"
          alt="ProPortrait AI professional portrait"
          className="absolute inset-0 w-full h-full object-cover object-center"
          draggable={false}
        />
      </div>
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] z-10 pointer-events-none"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      />
      <div
        className="absolute top-1/2 z-20 -translate-y-1/2 w-11 h-11 bg-white rounded-full shadow-2xl flex items-center justify-center pointer-events-none"
        style={{ left: `${position}%`, transform: `translateX(-50%) translateY(-50%)` }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M7 10H4M4 10L7 7M4 10L7 13M13 10H16M16 10L13 7M16 10L13 13" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="absolute bottom-4 left-4 bg-black/60 text-white text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
        Before
      </div>
      <div className="absolute bottom-4 right-4 bg-indigo-600/90 text-white text-sm font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
        ProPortrait AI
      </div>
      {hinted && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/55 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none whitespace-nowrap animate-pulse">
          ← Drag to compare →
        </div>
      )}
    </div>
  );
}

const CHECK_ICON = (
  <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

interface LandingPageProps {
  onSignIn?: () => void;
}

export default function LandingPage({ onSignIn }: LandingPageProps) {
  const { user, loading } = useAuthContext();
  const goToApp = () => {
    window.location.href = '/create';
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <a href={user ? '/create' : '/'} className="flex items-center gap-2">
          <img src="/logo.png" alt="ProPortrait AI" className="h-7 w-7 rounded-lg" />
          <span className="font-bold text-lg tracking-tight">ProPortrait<span className="text-indigo-600"> AI</span></span>
        </a>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-500">
          <a href="#features" className="hover:text-slate-800 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-slate-800 transition-colors">How it Works</a>
          <a href="#faq" className="hover:text-slate-800 transition-colors">FAQ</a>
        </nav>
        {loading ? (
          <div className="w-8 h-8" />
        ) : user ? (
          <UserMenu
            onOpenProfile={() => window.location.href = '/create'}
            onOpenAdmin={() => window.location.href = '/admin'}
          />
        ) : (
          <button
            onClick={goToApp}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Create Your Portrait
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center px-6 max-w-6xl mx-auto w-full">

        {/* Hero */}
        <section className="py-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* Left — copy */}
          <div className="flex flex-col items-start gap-6 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Free to generate &amp; edit
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold leading-tight tracking-tight">
              Your best<br />
              professional photo,<br />
              <span className="text-indigo-600">without the photoshoot.</span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed max-w-md">
              Upload any photo and get studio-quality professional portraits in seconds. 
              Generate and edit free forever — pay only when you're ready to download.
            </p>

            <button
              onClick={goToApp}
              className="mt-2 inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              Create Your Portrait
              <span className="text-indigo-300 font-normal text-base group-hover:translate-x-0.5 transition-transform">— it's free</span>
            </button>

            <div className="flex flex-wrap items-center gap-5 pt-2 text-sm text-slate-500">
              {[
                { icon: '✓', text: 'Free to generate & edit' },
                { icon: '✓', text: 'Photos not saved unless you do' },
                { icon: '✓', text: 'Pay only to download' },
                { icon: '✓', text: 'Sign in to buy & download' },
              ].map((t) => (
                <span key={t.text} className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">{t.icon}</span>
                  {t.text}
                </span>
              ))}
            </div>
          </div>

          {/* Right — comparison slider */}
          <div className="order-1 lg:order-2 w-full max-w-sm mx-auto lg:max-w-none">
            <HeroSlider />
            <p className="text-center text-xs text-slate-400 mt-3">
              Real output. Drag to compare before &amp; after.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-12 w-full">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
            <p className="mt-2 text-slate-500">From casual photo to professional portrait in 30 seconds</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Upload your photo',
                desc: 'Any casual photo works. Selfie, group shot, or existing picture.',
                badge: 'Free',
              },
              {
                step: '2',
                title: 'Generate & edit',
                desc: 'Choose from 7 professional styles. Edit clothes, background, lighting.',
                badge: 'Free',
              },
              {
                step: '3',
                title: 'Pay to download',
                desc: 'Only when you\'re happy with the result. $4.99 for HD, $9.99 for all platforms.',
                badge: 'Pay once',
              },
            ].map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center p-6 relative">
                <div className="absolute top-4 right-4 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {f.badge}
                </div>
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {f.step}
                </div>
                <div className="font-semibold text-slate-800 mb-2">{f.title}</div>
                <div className="text-sm text-slate-500">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature strip */}
        <section id="features" className="py-10 w-full">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Why ProPortrait AI?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
                title: 'Identity preserved',
                desc: 'Locks skin tone, eye color, and facial structure — you stay you.',
              },
              {
                icon: <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                title: '7 studio styles',
                desc: 'Editorial, Environmental, Vintage, B&W, Cyberpunk, and more.',
              },
              {
                icon: <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                title: 'Platform-ready exports',
                desc: 'LinkedIn, GitHub, Twitter, and Resume sizes — one click.',
              },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex-shrink-0 w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <div className="font-semibold text-slate-800 mb-1">{f.title}</div>
                  <div className="text-sm text-slate-500">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy & Trust Section */}
        <section className="py-12 w-full">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 sm:p-10 border border-emerald-200">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl shrink-0">
                🔒
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Your privacy matters</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">Not saved unless you choose to</p>
                      <p className="text-slate-500 text-sm">Your photos are not stored on our servers unless you explicitly save them to your library.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">No training on your photos</p>
                      <p className="text-slate-500 text-sm">We never use your photos to train AI models or for any other purpose.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">Secure processing</p>
                      <p className="text-slate-500 text-sm">All processing happens on secure, encrypted servers.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">You own the result</p>
                      <p className="text-slate-500 text-sm">Downloaded portraits are yours to use anywhere, commercially or personally.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 w-full">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center text-slate-900 mb-10">Frequently Asked Questions</h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {[
              { 
                q: 'Do I need to create an account?', 
                a: 'Generating and editing is free with no account required. To buy credits or download your portrait, a quick sign-in is required so we can securely deliver your purchase.'
              },
              { 
                q: 'What can I do for free?', 
                a: 'Everything except downloading! Upload photos, generate unlimited portraits, try all 7 styles, use the full editing suite — all free. You\'ll see a watermark on the preview until you purchase.' 
              },
              { 
                q: 'How much does it cost?', 
                a: 'Generating and editing is completely free. When you\'re ready to download, it\'s $4.99 for a single HD portrait or $9.99 for all platform sizes (LinkedIn, GitHub, etc.) in a ZIP file. One-time payment, no subscription.' 
              },
              { 
                q: 'What happens to my photos?', 
                a: 'Your photos are not saved on our servers unless you explicitly save them to your library. We don\'t share or use your photos for any other purpose. Your privacy is our priority.'
              },
              { 
                q: 'What styles are available?', 
                a: 'Editorial, Environmental, Candid, Vintage, B&W, Cyberpunk, and Watercolor. All styles are available to try for free.' 
              },
              { 
                q: 'What resolution do I get?', 
                a: 'Downloaded portraits are 2048px HD resolution — perfect for LinkedIn, resumes, and professional use.' 
              },
              { 
                q: 'Can I use these commercially?', 
                a: 'Yes — once you purchase and download, the portraits are yours to use for personal branding, business profiles, marketing, and social media.' 
              },
              { 
                q: 'Which platforms are supported?', 
                a: 'LinkedIn, GitHub, X/Twitter, Instagram, and Resume/CV sizes. The Plus tier ($9.99) includes all sizes in a convenient ZIP file.' 
              },
            ].map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="font-semibold text-slate-900 mb-2">{item.q}</div>
                <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-12 flex flex-col items-center gap-4 text-center w-full">
          <p className="text-slate-500 text-lg">Ready to look your best?</p>
          <p className="text-indigo-600 font-medium">Join thousands creating professional portraits</p>
          <button
            onClick={goToApp}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-bold text-base px-7 py-3.5 rounded-xl transition-colors"
          >
            Create Your Portrait
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </button>
          <p className="text-sm text-slate-400">Free to start • Pay only to download</p>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
