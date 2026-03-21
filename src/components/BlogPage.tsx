import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { blogPosts } from '../lib/blogPosts';
import AppFooter from './AppFooter';

const CATEGORIES = ['All', 'Guide', 'Comparison', 'Privacy'] as const;
type Category = typeof CATEGORIES[number];

const categoryBorder: Record<string, string> = {
  Guide: 'border-l-4 border-indigo-400',
  Comparison: 'border-l-4 border-violet-400',
  Privacy: 'border-l-4 border-emerald-400',
};

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  const featured = blogPosts[0];
  const gridPosts =
    activeCategory === 'All'
      ? blogPosts.slice(1)
      : blogPosts.filter((p) => p.category === activeCategory);

  return (
    <>
      <Helmet>
        <title>Blog — AI Headshot Tips, Guides & LinkedIn Photo Advice | ProPortrait AI</title>
        <meta name="description" content="Guides and tips on professional headshots, LinkedIn profile photos, and AI portrait best practices from the ProPortrait AI team." />
        <link rel="canonical" href="https://portrait.ai-biz.app/blog" />
      </Helmet>

      <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto w-full">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="ProPortrait AI" className="h-7 w-7 rounded-lg" />
            <span className="font-bold text-lg tracking-tight">
              ProPortrait<span className="text-indigo-600"> AI</span>
            </span>
          </a>
          <nav className="hidden sm:flex items-center gap-5 text-sm text-slate-500">
            <a href="/" className="hover:text-slate-800 transition-colors">Home</a>
            <a href="/blog" className="text-indigo-600 font-semibold">Blog</a>
            <a href="/create" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors">
              Try Free
            </a>
          </nav>
        </header>

        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
              ProPortrait AI Blog
            </h1>
            <p className="text-lg text-slate-500">
              Guides on professional headshots, LinkedIn profiles, and AI portrait best practices.
            </p>
          </div>

          {/* Featured post — only shown in "All" view */}
          {activeCategory === 'All' && (
            <a
              href={`/blog/${featured.slug}`}
              className="group block rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-8 sm:p-10 mb-10 hover:from-indigo-700 hover:to-indigo-800 transition-all"
            >
              <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold mb-3">
                <span className="bg-white/20 px-2.5 py-1 rounded-full">{featured.category}</span>
                <span>·</span>
                <span>{featured.publishedAt}</span>
                <span>·</span>
                <span>{featured.readingMinutes} min read</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-snug group-hover:underline">
                {featured.title}
              </h2>
              <p className="text-indigo-100 text-sm leading-relaxed mb-6 max-w-2xl line-clamp-2">
                {featured.metaDescription}
              </p>
              <span className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-xl">
                Read Article →
              </span>
            </a>
          )}

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {gridPosts.map((post) => (
              <a
                key={post.slug}
                href={`/blog/${post.slug}`}
                className={`group block rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all p-6 ${
                  categoryBorder[post.category] ?? ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-3">
                  <span className="bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <span>{post.readingMinutes} min read</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                  {post.metaDescription}
                </p>
                <div className="mt-3 text-xs text-slate-400">{post.publishedAt}</div>
                <div className="mt-2 text-sm font-semibold text-indigo-600 group-hover:underline">
                  Read article →
                </div>
              </a>
            ))}
          </div>
        </main>

        <AppFooter />
      </div>
    </>
  );
}
