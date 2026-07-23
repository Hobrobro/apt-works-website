/* ════════════════════════════════════════════
   本器見立所 Apt. Works — 滾動敘事
   線一直都在，只是打結了：
   Hero 線團 → 三場景梳理 → 藍圖 → 系統啟動
   ════════════════════════════════════════════ */

(function () {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const staticMode = new URLSearchParams(location.search).has("static");

  /* ════════ 預約表單：AJAX 送出 + 自訂提示卡，不跳轉 ════════ */
  function setupContactForm() {
    const form = document.querySelector(".bookform");
    const toast = document.getElementById("formToast");
    if (!form || !toast) return;
    const titleEl = toast.querySelector(".toast__title");
    const msgEl = toast.querySelector(".toast__msg");

    const closeToast = () => {
      toast.classList.remove("is-open");
      setTimeout(() => { toast.hidden = true; }, 320);
    };
    const openToast = (isError) => {
      titleEl.textContent = isError ? "送出失敗" : "預約諮詢已送出";
      msgEl.textContent = isError
        ? "請稍後再試，或直接來信 info@ingsist.com。"
        : "敬請等候，我們將有專人為您聯繫……";
      toast.classList.toggle("toast--error", !!isError);
      toast.hidden = false;
      requestAnimationFrame(() => toast.classList.add("is-open"));
      clearTimeout(toast._t);
      if (!isError) toast._t = setTimeout(closeToast, 6000);
    };
    toast.addEventListener("click", (e) => {
      if (e.target === toast || e.target.closest(".toast__close")) closeToast();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;
      btn.disabled = true; btn.textContent = "送出中…";
      fetch("https://formsubmit.co/ajax/info@ingsist.com", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      })
        .then((r) => r.json())
        .then(() => { form.reset(); openToast(false); })
        .catch(() => openToast(true))
        .finally(() => { btn.disabled = false; btn.innerHTML = orig; });
    });
  }
  setupContactForm();

  /* ════════ 手機漢堡選單 ════════ */
  function setupMobileMenu() {
    const burger = document.getElementById("navBurger");
    const menu = document.getElementById("navMenu");
    if (!burger || !menu) return;
    const setOpen = (open) => {
      burger.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open);
      menu.setAttribute("aria-hidden", !open);
      burger.setAttribute("aria-label", open ? "關閉選單" : "開啟選單");
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  }
  setupMobileMenu();

  function onLoad(fn) {
    if (document.readyState === "complete") fn();
    else window.addEventListener("load", fn);
  }

  /* ── Catmull-Rom → 貝茲：把錨點串成平滑曲線 ── */
  function catmullRom(p) {
    let d = "M " + p[0][0].toFixed(1) + " " + p[0][1].toFixed(1);
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += " C " + c1[0].toFixed(1) + " " + c1[1].toFixed(1) + ", " + c2[0].toFixed(1) + " " + c2[1].toFixed(1) + ", " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d;
  }

  /* ════════ 故事線：從線團長出、貫穿整頁的那一條線 ════════
     單一不規則路徑，穿過每個章節、從毛玻璃面板後方繞過，
     隨捲動逐漸被「拉」出來，最後走進 CTA。 */
  function buildStoryThread(animated) {
    const old = document.getElementById("storyThread");
    if (old) {
      if (old._st) old._st.kill();
      old.remove();
    }
    const docH = document.documentElement.scrollHeight;
    const W = document.documentElement.clientWidth;
    const NS = "http://www.w3.org/2000/svg";
    const sy = window.scrollY;

    const pts = [];
    // 起點：Hero 的「客戶資訊」樞紐——線從這裡長出，但一載入時不顯示（往下捲才浮現）
    const hub = document.querySelector("#tangleSvg .hub");
    if (hub) {
      const r = hub.getBoundingClientRect();
      pts.push([r.left + r.width / 2, r.top + r.height / 2 + sy]);
    }
    const anchor = (sel, fx, dy) => {
      const e = document.querySelector(sel);
      if (!e) return;
      const r = e.getBoundingClientRect();
      pts.push([W * fx, r.top + sy + (dy || 0)]);
    };
    anchor("#services", 0.09, 150);
    anchor("#services", 0.55, 430);
    anchor("#needs", 0.9, 170);
    anchor("#needs", 0.14, 470);
    anchor("#method", 0.5, 140);
    anchor("#cases", 0.1, 290);
    anchor("#cases", 0.62, 620);
    anchor("#stages", 0.12, 280);
    anchor("#audience", 0.3, 300);
    // 終點：用一段順滑曲線從右上方彎進白卡頂邊（距左緣約 130px），不用垂直段以免出現勾角
    const ccard = document.querySelector(".contact-card");
    if (ccard) {
      const cr = ccard.getBoundingClientRect();
      const connX = cr.left + 130;
      const connY = cr.top + window.scrollY;
      pts.push([connX + 46, connY - 132]); // 引導點：接點右上方，讓線順順地彎下來
      pts.push([connX, connY]);            // 落在卡片頂邊
    } else {
      anchor("#contact", 0.5, 110);
    }
    if (pts.length < 4) return;

    // 不規則化：錨點間插入帶手感偏移的中繼點（最後彎入段不抖動，保持順滑）
    const dense = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      dense.push(p);
      if (i >= pts.length - 3) continue;
      for (let k = 1; k <= 2; k++) {
        const t = k / 3;
        const jx = Math.sin(i * 3.1 + k * 2.7) * W * 0.055 + Math.cos(i * 1.7 + k) * 28;
        const jy = Math.sin(i * 1.9 + k * 1.3) * 24;
        dense.push([p[0] + (q[0] - p[0]) * t + jx, p[1] + (q[1] - p[1]) * t + jy]);
      }
    }
    dense.push(pts[pts.length - 1]);

    const svg = document.createElementNS(NS, "svg");
    svg.id = "storyThread";
    svg.setAttribute("width", W);
    svg.setAttribute("height", docH);
    svg.setAttribute("viewBox", "0 0 " + W + " " + docH);
    svg.setAttribute("aria-hidden", "true");

    const defs = document.createElementNS(NS, "defs");
    const grad = document.createElementNS(NS, "linearGradient");
    grad.id = "threadGrad";
    grad.setAttribute("gradientUnits", "userSpaceOnUse");
    grad.setAttribute("x1", "0"); grad.setAttribute("y1", pts[0][1]);
    grad.setAttribute("x2", "0"); grad.setAttribute("y2", docH * 0.96);
    [["0", "#94A3B8"], [".1", "#73C1FF"], [".55", "#3C5BEE"], ["1", "#1D339C"]].forEach(([o, c]) => {
      const s = document.createElementNS(NS, "stop");
      s.setAttribute("offset", o); s.setAttribute("stop-color", c);
      grad.appendChild(s);
    });
    defs.appendChild(grad);
    svg.appendChild(defs);

    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", catmullRom(dense));
    path.setAttribute("stroke", "url(#threadGrad)");
    path.setAttribute("stroke-width", "1.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("fill", "none");
    path.setAttribute("opacity", ".8");
    svg.appendChild(path);
    document.body.appendChild(svg);

    if (animated) {
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

      // length ↔ Y 對照表：讓繪製前緣跟著捲動的 Y 走，
      // 不受路徑左右擺盪的長度影響（否則前緣會落後、線看似消失）
      const SAMPLES = 260;
      const lut = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const L = (len * i) / SAMPLES;
        lut.push([path.getPointAtLength(L).y, L]);
      }
      const drawTo = (targetY) => {
        let L = 0;
        for (let i = 0; i < lut.length; i++) {
          L = lut[i][1];
          if (lut[i][0] >= targetY) break;
        }
        path.style.strokeDashoffset = (len - L).toFixed(1);
      };
      const heroEl = document.querySelector(".hero");
      const update = () => {
        drawTo(window.scrollY + window.innerHeight * 0.55);
        // Hero 範圍內淡出（不露線）；往下捲離開 Hero 才淡入 → 線像從樞紐被拉出來、連續延伸
        const hh = heroEl ? heroEl.offsetHeight : window.innerHeight;
        const fade = Math.max(0, Math.min(1, (window.scrollY - hh * 0.3) / (hh * 0.28)));
        svg.style.opacity = fade.toFixed(3);
      };

      svg._st = ScrollTrigger.create({
        trigger: document.body, start: "top top", end: "bottom bottom",
        onUpdate: update, onRefresh: update,
      });
      update();
    }
  }

  /* ════════ 收尾：線抵達 → 描出 80px 線框 → 線框與白卡一起長到完整高度 ════════ */
  let endingTL = null, endingPlayed = false;
  const FRAME_RX = 28, FRAME_START_H = 80;

  function buildEndingFrame(fullH) {
    const stage = document.querySelector(".cta__stage");
    const card = document.querySelector(".contact-card");
    if (!stage || !card) return null;
    const old = stage.querySelector(".cta__frame");
    if (old) old.remove();
    const w = card.offsetWidth;
    const x = card.offsetLeft, y = card.offsetTop;
    if (!w || !fullH) return null;
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "cta__frame");
    svg.setAttribute("width", w); svg.setAttribute("height", fullH);
    svg.setAttribute("viewBox", "0 0 " + w + " " + fullH);
    svg.style.left = x + "px"; svg.style.top = y + "px";
    const defs = document.createElementNS(NS, "defs");
    const grad = document.createElementNS(NS, "linearGradient");
    grad.id = "frameGrad"; grad.setAttribute("gradientUnits", "userSpaceOnUse");
    grad.setAttribute("x1", "0"); grad.setAttribute("y1", "0");
    grad.setAttribute("x2", w); grad.setAttribute("y2", fullH);
    [["0", "#73C1FF"], [".5", "#3C5BEE"], ["1", "#1D339C"]].forEach(([o, c]) => {
      const s = document.createElementNS(NS, "stop");
      s.setAttribute("offset", o); s.setAttribute("stop-color", c);
      grad.appendChild(s);
    });
    defs.appendChild(grad); svg.appendChild(defs);
    const rect = document.createElementNS(NS, "rect");
    rect.setAttribute("x", 1.25); rect.setAttribute("y", 1.25);
    rect.setAttribute("width", w - 2.5); rect.setAttribute("height", FRAME_START_H - 2.5);
    rect.setAttribute("rx", FRAME_RX);
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke", "url(#frameGrad)");
    rect.setAttribute("stroke-width", 2.5);
    rect.setAttribute("stroke-linejoin", "round");
    svg.appendChild(rect);
    stage.appendChild(svg);
    return rect;
  }

  function setupEnding() {
    const card = document.querySelector(".contact-card");
    if (!card) return;
    const H = card.offsetHeight;
    const rect = buildEndingFrame(H);
    if (!rect) return;
    const clipFull = "inset(0px 0px 0px 0px round " + FRAME_RX + "px)";
    const clipBar  = "inset(0px 0px " + (H - FRAME_START_H).toFixed(1) + "px 0px round " + FRAME_RX + "px)";
    const clipNone = "inset(0px 0px " + H.toFixed(1) + "px 0px round " + FRAME_RX + "px)";

    if (endingTL) {
      // resize：依目前狀態還原幾何
      if (endingPlayed) {
        rect.setAttribute("height", (H - 2.5).toFixed(1));
        gsap.set(rect, { autoAlpha: 0 });
        gsap.set(card, { clipPath: clipFull });
      } else {
        const peri = rect.getTotalLength();
        gsap.set(rect, { strokeDasharray: peri, strokeDashoffset: peri });
        gsap.set(card, { opacity: 1, clipPath: clipNone });
      }
      return;
    }

    const peri = rect.getTotalLength();
    gsap.set(rect, { strokeDasharray: peri, strokeDashoffset: peri });
    gsap.set(card, { opacity: 1, clipPath: clipNone }); // 白卡先完全收起（看不見）

    endingTL = gsap.timeline({
      scrollTrigger: { trigger: card, start: "top 55%", once: true },
      onComplete: () => { endingPlayed = true; },
    });
    endingTL
      // 1) 線抵達 → 描出 80px 線框
      .to(rect, { strokeDashoffset: 0, duration: 0.85, ease: "power2.inOut" })
      .set(rect, { strokeDasharray: "none" })
      // 2) 線框內浮現白卡（先露出頂部 80px）
      .set(card, { clipPath: clipBar })
      // 3) 線框與白卡一起往下長到完整高度
      .addLabel("grow")
      .to(rect, { attr: { height: (H - 2.5).toFixed(1) }, duration: 1.0, ease: "power3.out" }, "grow")
      .to(card, { clipPath: clipFull, duration: 1.0, ease: "power3.out" }, "grow")
      // 4) 收尾：線框淡出，白卡邊框接手
      .to(rect, { autoAlpha: 0, duration: 0.45 }, "-=0.2");
  }

  if (reduced || staticMode || typeof gsap === "undefined") {
    // 無動畫模式：直接呈現「梳理後」的完成狀態
    document.body.classList.add("reduced");
    document.querySelectorAll(".scenario").forEach((s) => s.classList.add("is-after"));
    initNavState();
    onLoad(() => buildStoryThread(false));
    return;
  }

  document.documentElement.classList.add("js");
  gsap.registerPlugin(ScrollTrigger);

  /* ── 工具：把 path 設成「未畫出」狀態 ── */
  function prepDraw(target) {
    gsap.utils.toArray(target).forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
  }

  function initNavState() {
    const nav = document.getElementById("nav");
    const update = () => nav.classList.toggle("nav--scrolled", window.scrollY > 40);
    window.addEventListener("scroll", update, { passive: true });
    update();
  }
  initNavState();

  /* ════════ HERO 入場：線團畫出來 ════════ */

  prepDraw("#tangleSvg .t-line");
  gsap.set("#tangleSvg .chip, #tangleSvg .hub", { scale: 0.6, opacity: 0, transformOrigin: "50% 50%" });
  gsap.set("#tangleSvg .t-node, #tangleSvg .t-spark", { scale: 0, transformOrigin: "50% 50%" });
  gsap.set("#tangleSvg .t-glide, #tangleSvg .t-dotline", { opacity: 0 });

  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
  intro
    .to(".nav", { opacity: 1, duration: 0.7 }, 0.1)
    .to(".hero__kicker", { opacity: 1, y: 0, duration: 0.7 }, 0.25)
    .to(".reveal-line > span", { y: 0, duration: 1.05, stagger: 0.14, ease: "power4.out" }, 0.35)
    .to(".hero__en", { opacity: 1, duration: 0.8 }, 0.9)
    .to(".hero__lead", { opacity: 1, duration: 0.8 }, 1.05)
    .to(".hero__actions", { opacity: 1, duration: 0.8 }, 1.2)
    // 線之星雲：流線一齊伸展出來、粒子軌跡浮現
    .to("#tangleSvg .t-line", { strokeDashoffset: 0, duration: 1.6, stagger: { amount: 1.4 }, ease: "power2.inOut" }, 0.45)
    .to("#tangleSvg .t-dotline", { opacity: (i, t) => +t.getAttribute("opacity"), duration: 1.1, stagger: { amount: 1 }, ease: "power2.out" }, 0.9)
    .to("#tangleSvg .t-node, #tangleSvg .t-spark", { scale: 1, duration: 0.5, stagger: { amount: 0.7 }, ease: "back.out(2.4)" }, 1.5)
    .to("#tangleSvg .chip, #tangleSvg .hub", { scale: 1, opacity: 1, duration: 0.6, stagger: 0.06, ease: "back.out(1.8)" }, 1.55)
    .to("#tangleSvg .t-glide", { opacity: 1, duration: 0.8 }, 2.3)
    .to(".hero__scrollcue", { opacity: 1, duration: 0.7 }, 2.4);

  // 線團的呼吸：緩慢漂移，像還沒被解開的結
  gsap.to("#tangleGroup", {
    y: 12, rotation: 0.8, transformOrigin: "50% 50%",
    duration: 6, yoyo: true, repeat: -1, ease: "sine.inOut",
  });

  // 故事線：佈局穩定後建立，隨捲動從線團中被「拉」出來
  onLoad(() => {
    buildStoryThread(true);
    setupEnding();
    ScrollTrigger.refresh();
  });
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { buildStoryThread(true); setupEnding(); }, 350);
  });

  /* ════════ 通用淡入 ════════ */

  gsap.utils.toArray(".fade-up").forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 86%", once: true },
    });
  });

  /* ════════ 三個場景：梳理前 → 梳理後 ════════ */

  const mm = gsap.matchMedia();

  document.querySelectorAll(".scenario").forEach((scenario) => {
    const before = scenario.querySelector(".scene__before");
    const after = scenario.querySelector(".scene__after");
    const draws = after.querySelectorAll(".draw");
    const pops = after.querySelectorAll(".pop");

    prepDraw(draws);
    gsap.set(pops, { scale: 0, transformOrigin: "50% 50%" });

    mm.add("(min-width: 900px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scenario,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          onUpdate: (self) => scenario.classList.toggle("is-after", self.progress > 0.42),
        },
      });
      tl.to({}, { duration: 0.3 }) // 停留在「梳理前」，讓人看清楚那團結
        .to(before, { autoAlpha: 0, scale: 0.975, transformOrigin: "50% 50%", duration: 0.14 }, 0.32)
        .to(draws, { strokeDashoffset: 0, duration: 0.34, stagger: 0.05, ease: "power2.inOut" }, 0.45)
        .to(pops, { scale: 1, duration: 0.14, stagger: 0.03, ease: "back.out(2.2)" }, 0.62)
        .to({}, { duration: 0.18 }); // 停留在「梳理後」
      return () => tl.scrollTrigger && tl.scrollTrigger.kill();
    });

    mm.add("(max-width: 899px)", () => {
      const tl = gsap.timeline({
        paused: true,
        scrollTrigger: { trigger: scenario, start: "top 55%", once: true },
        onStart: () => scenario.classList.add("is-after"),
        delay: 0.5,
      });
      tl.to(before, { autoAlpha: 0, scale: 0.975, duration: 0.6 })
        .to(draws, { strokeDashoffset: 0, duration: 1.1, stagger: 0.12, ease: "power2.inOut" }, 0.3)
        .to(pops, { scale: 1, duration: 0.5, stagger: 0.07, ease: "back.out(2.2)" }, 1.1);
      return () => tl.scrollTrigger && tl.scrollTrigger.kill();
    });
  });

  /* ════════ 工作流程：那條線把五步串起來 ════════ */

  const methodLine = document.querySelector(".method__line-path");
  if (methodLine) {
    prepDraw(methodLine);
    gsap.to(methodLine, {
      strokeDashoffset: 0, ease: "none",
      scrollTrigger: { trigger: ".method__flow", start: "top 78%", end: "top 30%", scrub: 0.5 },
    });
  }

  /* ════════ CTA：手繪底線 ════════ */

  const ctaLine = document.querySelector(".cta__underline-path");
  if (ctaLine) {
    prepDraw(ctaLine);
    gsap.to(ctaLine, {
      strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut",
      scrollTrigger: { trigger: ".cta", start: "top 65%", once: true },
    });
  }
})();
