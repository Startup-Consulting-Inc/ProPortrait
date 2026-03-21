import { Helmet } from 'react-helmet-async';
import { getBlogPost } from '../lib/blogPosts';
import AppFooter from './AppFooter';

interface BlogPostPageProps {
  slug: string;
}

export default function BlogPostPage({ slug }: BlogPostPageProps) {
  const post = getBlogPost(slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Post not found</h1>
        <p className="text-slate-500 mb-6">This post doesn't exist or may have moved.</p>
        <a href="/blog" className="text-indigo-600 hover:underline font-semibold">← Back to Blog</a>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'ProPortrait AI',
      url: 'https://portrait.ai-biz.app',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ProPortrait AI',
      url: 'https://portrait.ai-biz.app',
      logo: {
        '@type': 'ImageObject',
        url: 'https://portrait.ai-biz.app/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://portrait.ai-biz.app/blog/${post.slug}`,
    },
  };

  return (
    <>
      <Helmet>
        <title>{`${post.title} | ProPortrait AI`}</title>
        <meta name="description" content={post.metaDescription} />
        <link rel="canonical" href={`https://portrait.ai-biz.app/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://portrait.ai-biz.app/blog/${post.slug}`} />
        <meta property="article:published_time" content={post.publishedAt} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
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
            <a href="/blog" className="hover:text-slate-800 transition-colors">Blog</a>
            <a href="/create" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors">
              Try Free
            </a>
          </nav>
        </header>

        <main className="flex-1 max-w-2xl mx-auto px-6 py-12 w-full">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="text-sm text-slate-400 mb-8 flex items-center gap-2">
            <a href="/" className="hover:text-slate-600">Home</a>
            <span>›</span>
            <a href="/blog" className="hover:text-slate-600">Blog</a>
            <span>›</span>
            <span className="text-slate-600 truncate max-w-xs">{post.title}</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
              <span className="bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                {post.category}
              </span>
              <span>·</span>
              <time dateTime={post.publishedAt}>{post.publishedAt}</time>
              <span>·</span>
              <span>{post.readingMinutes} min read</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed">
              {post.metaDescription}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-10">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {/* Content */}
          <article
            className="prose prose-slate prose-lg max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-slate-700 prose-p:leading-relaxed
              prose-ul:text-slate-700 prose-li:my-1
              prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-slate-900
              prose-table:text-sm prose-th:bg-slate-50 prose-th:text-slate-700
              prose-td:text-slate-600"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA */}
          <div className="mt-14 rounded-2xl bg-indigo-50 border border-indigo-100 p-8 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Try ProPortrait AI — free to generate
            </h2>
            <p className="text-slate-500 mb-5 text-sm">
              Upload any photo and get a studio-quality professional portrait in 30 seconds. Pay only when you download.
            </p>
            <a
              href="/create"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Create Your Portrait — It's Free
            </a>
          </div>

          {/* Back link */}
          <div className="mt-10">
            <a href="/blog" className="text-sm text-indigo-600 hover:underline font-semibold">
              ← Back to Blog
            </a>
          </div>
        </main>

        <AppFooter />
      </div>
    </>
  );
}
