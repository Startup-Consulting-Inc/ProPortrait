/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';

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

const CHECK_ICON_MUTED = (
  <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

interface LandingPageProps {
  onSignIn?: () => void;
}

export default function LandingPage({ onSignIn }: LandingPageProps) {
  const goToApp = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      window.location.href = '/app';
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="ProPortrait AI" className="h-7 w-7" />
          <span className="font-bold text-lg tracking-tight">ProPortrait<span className="text-indigo-600"> AI</span></span>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-500">
          <a href="#features" className="hover:text-slate-800 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-slate-800 transition-colors">Pricing</a>
        </nav>
        <button
          onClick={goToApp}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Sign In →
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 max-w-6xl mx-auto w-full">

        {/* Hero */}
        <section className="py-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* Left — copy */}
          <div className="flex flex-col items-start gap-6 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-indigo-100">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              AI-Powered · Ready in 30 seconds
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold leading-tight tracking-tight">
              Your best<br />
              professional photo,<br />
              <span className="text-indigo-600">without the photoshoot.</span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed max-w-md">
              Upload any photo. ProPortrait AI generates studio-quality headshots
              for LinkedIn, resumes, and beyond — preserving your identity,
              instantly.
            </p>

            <button
              onClick={goToApp}
              className="mt-2 inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              Generate My Portrait
              <span className="text-indigo-300 font-normal text-base group-hover:translate-x-0.5 transition-transform">— It's free</span>
            </button>

            <div className="flex flex-wrap items-center gap-5 pt-2 text-sm text-slate-400">
              {['No credit card', 'Photos never stored', '16 professional styles'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  {t}
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

        {/* Feature strip */}
        <section id="features" className="py-10 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
                title: 'Identity preserved',
                desc: 'Locks skin tone, eye color, and facial structure — you stay you.',
              },
              {
                icon: <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                title: '16 studio styles',
                desc: 'Corporate, LinkedIn, Creative, B&W, Cinematic, and more.',
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

        {/* Pricing */}
        <section id="pricing" className="py-16 w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Simple, transparent pricing</h2>
            <p className="mt-3 text-slate-500 text-lg">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Free */}
            <div className="flex flex-col p-6 rounded-2xl border border-slate-200 bg-white">
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Free</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-slate-900">$0</span>
              </div>
              <div className="text-xs text-slate-400 mb-5">No credit card required</div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {[
                  '3 portraits total',
                  '1K resolution',
                  'Core styles only',
                  'No saves (24h expiry)',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    {CHECK_ICON_MUTED}{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={goToApp}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Get started free
              </button>
            </div>

            {/* Creator */}
            <div className="flex flex-col p-6 rounded-2xl border border-slate-200 bg-white">
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Creator</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-slate-900">$24.99</span>
              </div>
              <div className="text-xs text-slate-400 mb-5">One-time purchase</div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {[
                  '30 portrait generations',
                  '30 permanent saves',
                  '2K resolution',
                  'All styles & expressions',
                  'PNG + transparent bg',
                  'All platform exports',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    {CHECK_ICON}{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={goToApp}
                className="w-full border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Buy Creator Pass
              </button>
            </div>

            {/* Pro — highlighted */}
            <div className="flex flex-col p-6 rounded-2xl border-2 border-indigo-600 bg-indigo-50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                Most popular
              </div>
              <div className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-1">Pro</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-slate-900">$29.99</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
              <div className="text-xs text-slate-400 mb-5">Cancel anytime</div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {[
                  '100 portraits/month',
                  'Unlimited saves',
                  '2K resolution',
                  'All styles & expressions',
                  'PNG + transparent bg',
                  'All platform exports',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    {CHECK_ICON}{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={goToApp}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow"
              >
                Start Pro
              </button>
            </div>

            {/* Max */}
            <div className="flex flex-col p-6 rounded-2xl border border-slate-200 bg-white">
              <div className="text-sm font-semibold text-violet-600 uppercase tracking-wide mb-1">Max</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-slate-900">$49.99</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
              <div className="text-xs text-slate-400 mb-5">For high-volume creators</div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {[
                  '500 portraits/month',
                  'Unlimited saves',
                  '2K resolution',
                  'All styles & expressions',
                  'PNG + transparent bg',
                  'Highest priority queue',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    {CHECK_ICON}{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={goToApp}
                className="w-full border border-violet-200 hover:bg-violet-50 text-violet-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Start Max
              </button>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-12 flex flex-col items-center gap-4 text-center w-full">
          <p className="text-slate-500 text-lg">Ready to look your best?</p>
          <button
            onClick={goToApp}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-bold text-base px-7 py-3.5 rounded-xl transition-colors"
          >
            Get started — free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 px-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-4">
          <span>© 2026 ProPortrait AI</span>
          <a href="#pricing" className="hover:text-slate-600 transition-colors">Pricing</a>
          <a href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-slate-600 transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
}
