/* ════════════════════════════════════════════
   Hero 主視覺 — 「毛線團」生成器
   每一股毛線＝一段隨機傾角、隨機扁圓度的橢圓弧，
   繞著中心纏 0.8~2.3 圈、帶手感擺動、部分往外甩尾。
   每條線各自平滑優雅，疊在一起互相交纏 — 亂中有序。
   位置式藍→粉漸層、點狀粒子軌跡（模擬圖語言）。
   （確定性亂數：每次載入構圖一致）
   ════════════════════════════════════════════ */

(function () {
  "use strict";
  const svg = document.getElementById("tangleSvg");
  const bloom = document.getElementById("bloom");
  if (!svg || !bloom) return;

  const NS = "http://www.w3.org/2000/svg";

  // 確定性 PRNG（LCG）
  let seed = 20260613;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0), seed / 4294967296);

  const C = { x: 470, y: 335 };

  function el(name, attrs, cls) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (cls) node.setAttribute("class", cls);
    bloom.appendChild(node);
    return node;
  }

  // Catmull-Rom → 貝茲：把取樣點串成平滑曲線
  function smoothPath(p) {
    let d = "M " + p[0][0].toFixed(1) + " " + p[0][1].toFixed(1);
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += " C " + c1[0].toFixed(1) + " " + c1[1].toFixed(1) + ", " + c2[0].toFixed(1) + " " + c2[1].toFixed(1) + ", " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d;
  }

  /* ── 毛線股 ── */
  const N = 104;
  const tailEnds = [];
  for (let i = 0; i < N; i++) {
    // 每股的軌道：中心抖動、橢圓半徑、傾角、纏繞方向與圈數
    const cx = C.x + (rnd() - 0.5) * 95;
    const cy = C.y + (rnd() - 0.5) * 85;
    const rx = 55 + rnd() * 215;
    const ry = 45 + rnd() * 190;
    const th = rnd() * Math.PI;
    const cosT = Math.cos(th), sinT = Math.sin(th);
    const dir = rnd() < 0.5 ? -1 : 1;
    const phi0 = rnd() * Math.PI * 2;
    const sweep = (0.8 + rnd() * 1.5) * Math.PI;          // 纏 0.8π ~ 2.3π
    const tailK = rnd() < 0.5 ? 0.5 + rnd() * 0.9 : 0;     // 一半的線往外甩尾
    const pitch = (rnd() - 0.5) * 0.3;                     // 每圈半徑微縮放（螺距）
    const wobA = 3 + rnd() * 9, wobF = 2 + rnd() * 4, wobP = rnd() * 6.283;

    const steps = 44 + Math.floor(rnd() * 36);
    const pts = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const phi = phi0 + dir * sweep * t;
      let s = 1 + pitch * t;
      if (tailK) { const u = Math.max(0, (t - 0.72) / 0.28); s *= 1 + tailK * u * u; }
      const wob = Math.sin(t * wobF * 6.283 + wobP) * wobA * (0.3 + 0.7 * t);
      const ex = (rx * s + wob) * Math.cos(phi);
      const ey = (ry * s + wob) * Math.sin(phi);
      const x = cx + ex * cosT - ey * sinT;
      const y = cy + ex * sinT + ey * cosT;
      if (x < 30 || x > 870 || y < 24 || y > 736) break;
      pts.push([x, y]);
    }
    if (pts.length < 14) continue;
    const d = smoothPath(pts);

    const dotted = rnd() < 0.32;
    if (dotted) {
      // 粒子軌跡：圓點虛線
      el("path", {
        d,
        stroke: "url(#flowGrad)",
        "stroke-width": (1.5 + rnd() * 1.1).toFixed(2),
        "stroke-dasharray": "0.1 " + (6 + rnd() * 5).toFixed(1),
        "stroke-linecap": "round",
        opacity: (0.38 + rnd() * 0.42).toFixed(2),
        fill: "none",
      }, "t-dotline");
    } else {
      el("path", {
        d,
        stroke: "url(#flowGrad)",
        "stroke-width": (0.7 + rnd() * 1.1).toFixed(2),
        "stroke-linecap": "round",
        opacity: (0.28 + rnd() * 0.5).toFixed(2),
        fill: "none",
      }, "t-line");
    }

    if (tailK && rnd() < 0.7) tailEnds.push(pts[pts.length - 1]);
  }

  /* ── 甩尾端點的光點（顏色跟隨位置漸層） ── */
  tailEnds.slice(0, 30).forEach((p) => {
    el("circle", {
      cx: p[0].toFixed(1), cy: p[1].toFixed(1),
      r: (1.5 + rnd() * 1.9).toFixed(2),
      fill: "url(#flowGrad)",
      opacity: (0.55 + rnd() * 0.45).toFixed(2),
    }, "t-spark");
  });

  /* ── 交叉節點：白底、漸層描邊的小圓（邏輯的痕跡） ── */
  for (let i = 0; i < 8; i++) {
    const a = rnd() * Math.PI * 2, r = 55 + rnd() * 165;
    el("circle", {
      cx: (C.x + Math.cos(a) * r * 1.12).toFixed(1),
      cy: (C.y + Math.sin(a) * r).toFixed(1),
      r: (3 + rnd() * 2.2).toFixed(2),
    }, "t-node");
  }

  /* ── 散落微塵 ── */
  for (let i = 0; i < 36; i++) {
    const a = rnd() * Math.PI * 2, r = 60 + rnd() * 300;
    el("circle", {
      cx: (C.x + Math.cos(a) * r * 1.12).toFixed(1),
      cy: (C.y + Math.sin(a) * r).toFixed(1),
      r: (0.7 + rnd() * 1.4).toFixed(2),
      fill: "url(#flowGrad)",
      opacity: (0.18 + rnd() * 0.4).toFixed(2),
    }, "t-spark");
  }

  /* ── 沿毛線游動的光點（SMIL 微動態） ── */
  const solids = bloom.querySelectorAll(".t-line");
  for (let i = 0; i < 6 && solids.length; i++) {
    const target = solids[Math.floor(rnd() * solids.length)];
    const dot = el("circle", { r: (2 + rnd()).toFixed(2), fill: "url(#flowGrad)", opacity: "0.9" }, "t-glide");
    const m = document.createElementNS(NS, "animateMotion");
    m.setAttribute("dur", (5 + rnd() * 5).toFixed(1) + "s");
    m.setAttribute("begin", (rnd() * 3).toFixed(1) + "s");
    m.setAttribute("repeatCount", "indefinite");
    m.setAttribute("path", target.getAttribute("d"));
    dot.appendChild(m);
  }
})();
