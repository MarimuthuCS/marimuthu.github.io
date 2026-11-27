(() => {
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Instant entrance (no waiting screen) ---------- */
  document.querySelectorAll("[data-hero]").forEach((el, i) => {
    el.style.transitionDelay = 450 + i * 110 + "ms";
  });
  const start = () => requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add("loaded")));
  const img = document.querySelector(".portrait");
  if (img && !img.complete) { img.addEventListener("load", start, { once: true }); setTimeout(start, 900); }
  else start();

  /* ---------- Split statements into words ---------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    let n = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "w";
            const s = document.createElement("span"); s.textContent = part; s.style.setProperty("--d", n++);
            w.appendChild(s); frag.appendChild(w);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) walk(c);
      });
    };
    walk(el);
  });

  /* ---------- Reveal on scroll ---------- */
  const groups = new Map();
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    const p = el.parentElement; const k = groups.get(p) || 0; groups.set(p, k + 1);
    el.style.setProperty("--rd", Math.min(k, 5) * 90 + "ms");
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      e.target.querySelectorAll("[data-count]").forEach(count);
      if (e.target.dataset.count) count(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll("[data-reveal],[data-split]").forEach((el) => io.observe(el));

  /* ---------- Count up ---------- */
  function count(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    const end = +el.dataset.count, suf = el.dataset.suffix || "";
    if (reduce) { el.textContent = end.toLocaleString("en-US") + suf; return; }
    const t0 = performance.now(), dur = 1800;
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 4)));
      el.textContent = v.toLocaleString("en-US") + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Scroll-driven: bar, header, cards, timeline ---------- */
  const bar = document.querySelector(".progress");
  const top = document.querySelector(".top");
  const hero = document.querySelector(".hero");
  const cards = [...document.querySelectorAll(".proj")];
  const tl = document.querySelector(".tl"), tlLine = document.querySelector(".tl-line i");
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    top.classList.toggle("scrolled", y > hero.offsetHeight - 70);

    if (!reduce) {
      cards.forEach((c, i) => {
        const next = cards[i + 1]; const card = c.firstElementChild;
        if (!next) { card.style.setProperty("--s", 1); card.style.setProperty("--b", 1); return; }
        const a = c.getBoundingClientRect(), b = next.getBoundingClientRect();
        const p = Math.min(Math.max(1 - (b.top - a.top) / a.height, 0), 1);
        card.style.setProperty("--s", (1 - p * 0.06).toFixed(4));
        card.style.setProperty("--b", (1 - p * 0.35).toFixed(3));
      });
    }
    if (tl) {
      const r = tl.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight * 0.65 - r.top) / r.height, 0), 1);
      tlLine.style.setProperty("--p", p.toFixed(3));
    }
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Active section in dock + top nav ---------- */
  const links = [...document.querySelectorAll('.dock a, .top-nav a')];
  const secIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = "#" + e.target.id;
      links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach((s) => secIO.observe(s));

  /* ---------- Subtle photo parallax (fine pointers) ---------- */
  const portrait = document.querySelector(".portrait");

  /* photo-only parallax: mouse on desktop, gentle drift on scroll */
  let mx = 0, my = 0, sy = 0;
  const paint = () => { portrait.style.translate = `${mx}px ${my + sy}px`; };
  if (!reduce && matchMedia("(pointer:fine)").matches) {
    hero.addEventListener("mousemove", (e) => {
      mx = (e.clientX / innerWidth - 0.5) * -14; my = (e.clientY / innerHeight - 0.5) * -8; paint();
    });
  }
  if (!reduce) addEventListener("scroll", () => {
    if (scrollY < innerHeight) { sy = scrollY * 0.12; paint(); }
  }, { passive: true });

  /* ---------- Clock + year ---------- */
  const clock = document.getElementById("clock");
  const upd = () => { clock.textContent = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }); };
  upd(); setInterval(upd, 30000);
  document.getElementById("yr").textContent = new Date().getFullYear();
})();
