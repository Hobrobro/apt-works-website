// scripts/build-blog.js
//
// 這支腳本在每次部署（Vercel build）時執行：
// 1. 讀取 blog/posts/*.md（Decap CMS 產生的文章原始檔）
// 2. 解析 frontmatter（title / date / excerpt / thumbnail / category）
// 3. 產生根目錄的 posts.json 索引（前台 blog/index.html 靠這個檔案渲染文章列表）
// 4. 為每篇文章產生 blog/<slug>/index.html 靜態頁面
//
// 不需要手動執行；Vercel 在每次部署時會自動跑 `npm run build`。
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const BLOG_DIR = path.join(ROOT, 'blog');
function readPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
  .readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((filename) => {
    const slug = filename.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf8');
    const { data, content } = matter(raw);
    const category = data.category || null;
    return {
      slug,
      title: data.title || slug,
      // ISO 字串，前台用來排序／顯示
      date: data.date ? new Date(data.date).toISOString() : null,
      dateLabel: data.date ? formatDate(data.date) : '',
      excerpt: data.excerpt || '',
      thumbnail: data.thumbnail || null,
      tags: category ? [category] : [],
      html: marked.parse(content),
    };
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date));
}
function formatDate(d) {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}
function escapeHtml(str = '') {
  return String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
}
function renderPostPage(post) {
  const ogImage = post.thumbnail
  ? `https://apt-works.vercel.app${post.thumbnail.startsWith('/') ? '' : '/'}${post.thumbnail}`
    : 'https://apt-works.vercel.app/images/og_default.jpg';
  return `<!DOCTYPE html>
  <html lang="zh-Hant">
  <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(post.title)} · 本器見立所 Apt. Works</title>
  <meta name="description" content="${escapeHtml(post.excerpt)}" />
  <meta property="og:title" content="${escapeHtml(post.title)}" />
  <meta property="og:description" content="${escapeHtml(post.excerpt)}" />
  <meta property="og:image" content="${ogImage}" />
  <link rel="canonical" href="https://apt-works.vercel.app/blog/${encodeURIComponent(post.slug)}/" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='5' y='5' width='7' height='5.5' rx='1.5' fill='none' stroke='%233C5BEE' stroke-width='2.6'/%3E%3Crect x='20' y='5' width='7' height='5.5' rx='1.5' fill='none' stroke='%233C5BEE' stroke-width='2.6'/%3E%3Crect x='5' y='21.5' width='7' height='5.5' rx='1.5' fill='none' stroke='%233C5BEE' stroke-width='2.6'/%3E%3Crect x='20' y='21.5' width='7' height='5.5' rx='1.5' fill='none' stroke='%233C5BEE' stroke-width='2.6'/%3E%3Cpath d='M7 20 L16 11 L25 20' fill='none' stroke='%231D339C' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@350;400;500;700;900&family=IBM+Plex+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/style.css?v=10" />
  <style>
  .post-hero {
  padding: clamp(7rem, 14vw, 10rem) clamp(1.2rem, 4vw, 3.2rem) clamp(2rem, 4vw, 3rem);
  max-width: 760px;
  margin: 0 auto;
  }
  .post-hero__back {
  display: inline-flex; align-items: center; gap: .5rem;
  font-family: var(--mono); font-size: .78rem; letter-spacing: .1em;
  color: var(--muted); text-decoration: none; margin-bottom: 2rem;
  }
  .post-hero__back:hover { color: var(--blue); }
  .post-hero__meta {
  display: flex; align-items: center; gap: .8rem; flex-wrap: wrap;
  font-family: var(--mono); font-size: .75rem; letter-spacing: .12em;
  color: var(--muted); margin-bottom: 1.2rem;
  }
  .post-hero__tag {
  padding: .15rem .6rem;
  background: var(--ice);
  border: 1px solid var(--border);
  border-radius: 99px;
  color: var(--blue);
  font-size: .68rem;
  letter-spacing: .1em;
  }
  .post-hero__title {
  font-size: clamp(1.8rem, 4.4vw, 2.6rem);
  font-weight: 900;
  letter-spacing: -.03em;
  line-height: 1.3;
  color: var(--ink);
  }
  .post-body {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 clamp(1.2rem, 4vw, 3.2rem) clamp(5rem, 9vw, 8rem);
  font-size: 1.02rem;
  line-height: 1.9;
  color: var(--ink);
  }
  .post-body h2 {
  font-size: 1.4rem; font-weight: 700; letter-spacing: -.01em;
  margin: 2.6rem 0 1rem;
  color: var(--ink);
  }
  .post-body h3 {
  font-size: 1.15rem; font-weight: 700;
  margin: 2rem 0 .8rem;
  color: var(--ink);
  }
  .post-body p { margin: 0 0 1.3rem; }
  .post-body strong { color: var(--ink); font-weight: 700; }
  .post-body ul, .post-body ol {
  margin: 0 0 1.3rem; padding-left: 1.4rem;
  }
  .post-body li { margin-bottom: .5rem; }
  .post-body blockquote {
  margin: 1.8rem 0;
  padding: 1rem 1.4rem;
  border-left: 3px solid var(--blue);
  background: var(--ice);
  border-radius: 4px;
  color: var(--muted);
  font-style: italic;
  }
  .post-body a { color: var(--blue); }
  .post-body img { max-width: 100%; border-radius: 12px; margin: 1.5rem 0; }
  .post-cta {
  max-width: 760px; margin: 0 auto;
  padding: 0 clamp(1.2rem, 4vw, 3.2rem) clamp(5rem, 9vw, 7rem);
  }
  .post-cta__box {
  border: 1px solid var(--border);
  background: var(--ice);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  }
  .post-cta__title { font-size: 1.1rem; font-weight: 700; color: var(--ink); margin-bottom: 1rem; }
  </style>
  </head>
  <body>
  <header class="nav" id="nav">
  <a class="nav__brand" href="/" aria-label="本器見立所 Apt. Works">
  <img class="nav__logo" src="/images/logo.svg" alt="本器見立所 Apt. Works" />
  </a>
  <nav class="nav__links">
  <a href="/#services">服務內容</a>
  <a href="/#needs">解決方案</a>
  <a href="/#method">見立て方法</a>
  <a href="/#cases">案例研究</a>
  <a href="/blog/" aria-current="page">觀點</a>
  <a href="/#contact">關於我們</a>
  </nav>
  <a class="btn btn--primary nav__cta" href="/#contact">預約診斷 <span class="btn__arrow">→</span></a>
  <button class="nav__burger" id="navBurger" type="button" aria-label="開啟選單" aria-expanded="false" aria-controls="navMenu">
  <span></span><span></span><span></span>
  </button>
  </header>
  <nav class="navmenu" id="navMenu" aria-hidden="true">
  <a href="/#services">服務內容</a>
  <a href="/#needs">解決方案</a>
  <a href="/#method">見立て方法</a>
  <a href="/#cases">案例研究</a>
  <a href="/blog/">觀點</a>
  <a href="/#contact">關於我們</a>
  <a class="btn btn--primary navmenu__cta" href="/#contact">預約診斷 <span class="btn__arrow">→</span></a>
  </nav>
  <main>
  <div class="post-hero">
  <a class="post-hero__back" href="/blog/">← 回觀點列表</a>
  <div class="post-hero__meta">
  <span>${post.dateLabel}</span>
  ${post.tags.map((t) => `<span class="post-hero__tag">${escapeHtml(t)}</span>`).join('')}
  </div>
  <h1 class="post-hero__title">${escapeHtml(post.title)}</h1>
  </div>
  <article class="post-body">
  ${post.html}
  </article>
  <div class="post-cta">
  <div class="post-cta__box">
  <p class="post-cta__title">想聊聊你們現在的流程或系統卡在哪裡？</p>
  <a class="btn btn--primary" href="/#contact">預約診斷 <span class="btn__arrow">→</span></a>
  </div>
  </div>
  </main>
  <footer class="footer">
  <div class="footer__inner">
  <img class="footer__logo" src="/images/logo.svg" alt="本器見立所 Apt. Works" />
  <p class="footer__copy mono">© 2026 Apt. Works 本器見立所<br class="br-mobile"> Powered by <a href="https://ingsist.com" target="_blank" rel="noopener">Ingsist Creative</a></p>
  </div>
  </footer>
  <script>
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 20);
  }, { passive: true });
  const burger = document.getElementById('navBurger');
  const menu = document.getElementById('navMenu');
  burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') === 'true';
  burger.setAttribute('aria-expanded', !open);
  menu.setAttribute('aria-hidden', open);
  menu.classList.toggle('navmenu--open', !open);
  burger.classList.toggle('nav__burger--open', !open);
  });
  menu.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => {
  burger.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
  menu.classList.remove('navmenu--open');
  burger.classList.remove('nav__burger--open');
  });
  });
  </script>
  </body>
  </html>
  `;
}
function main() {
  const posts = readPosts();
  // 1. posts.json（前台 blog/index.html 讀這個檔案渲染列表）
const indexData = posts.map(({ html, ...rest }) => ({
  ...rest,
  date: rest.dateLabel, // 前台顯示用格式化日期
}));
  fs.writeFileSync(
    path.join(ROOT, 'posts.json'),
    JSON.stringify(indexData, null, 2)
    );
  console.log(`[build-blog] 已產生 posts.json，共 ${posts.length} 篇文章`);
  // 2. 每篇文章的靜態頁面 blog/<slug>/index.html
posts.forEach((post) => {
  const dir = path.join(BLOG_DIR, post.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderPostPage(post));
  console.log(`[build-blog] 已產生 blog/${post.slug}/index.html`);
});
}
main();
