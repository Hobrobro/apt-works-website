// Vercel Edge Middleware
// 只對「首頁」執行；偵測到 LINE 的預覽爬蟲（UA 含 Linespider）就回傳方形 OG 版，
// 其他訪客（含 LINE App 內建瀏覽器的真人）照常取得原本的橫式預設首頁。
export const config = { matcher: "/" };

export default async function middleware(request) {
  const ua = request.headers.get("user-agent") || "";

  // LINE 連結預覽爬蟲：UA 帶 "Linespider"（in-app 瀏覽器是 "Line/x.x"，不會誤判）
  if (/Linespider/i.test(ua)) {
    const res = await fetch(new URL("/og-line.html", request.url));
    const html = await res.text();
    return new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // 其餘一律照常提供原本頁面
  return undefined;
}
