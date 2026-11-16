(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scrollBehavior = () => (reducedMotion.matches ? "auto" : "smooth");

  /* ---------- analytics: no-ops until window.VPN_TRACKING has IDs ---------- */

  const track = (name, params = {}, fb) => {
    if (typeof window.gtag === "function") window.gtag("event", name, params);
    if (fb && typeof window.fbq === "function") window.fbq("track", fb.name, fb.params || {});
  };

  // The registration form is the only form, and the Meta ads optimise for Lead, so a registration reports Lead as well as CompleteRegistration.
  const trackRegistration = (payload) => {
    const value = Number(((payload.package.match(/(\d{1,3}(?:\.\d{3})+)/) || [])[1] || "0").replace(/\./g, ""));
    track("generate_lead", { form_id: "consultation-form", currency: "VND", value, package: payload.package_id }, { name: "Lead", params: { currency: "VND", value, content_name: payload.package_id } });
    track("registration_complete", { currency: "VND", value, package: payload.package_id }, { name: "CompleteRegistration", params: { currency: "VND", value, content_name: payload.package_id } });
    const t = window.VPN_TRACKING || {};
    if (t.adsId && t.adsLeadLabel && typeof window.gtag === "function") {
      window.gtag("event", "conversion", { send_to: `${t.adsId}/${t.adsLeadLabel}`, currency: "VND", value });
    }
  };

  /* ---------- ad attribution: the first UTM set seen in this tab session, sent with the registration form ---------- */

  const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];
  const attribution = (() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = {};
    ATTRIBUTION_KEYS.forEach((key) => { const value = params.get(key); if (value) fromUrl[key] = value.slice(0, 200); });
    try {
      const saved = JSON.parse(window.sessionStorage.getItem("vpn_attribution") || "null");
      if (saved) return saved;
      if (Object.keys(fromUrl).length) window.sessionStorage.setItem("vpn_attribution", JSON.stringify(fromUrl));
    } catch {
      // storage blocked (private mode): fall back to this URL's parameters
    }
    return fromUrl;
  })();
  const withAttribution = (formType, payload) => ({ ...payload, form_type: formType, ...Object.fromEntries(ATTRIBUTION_KEYS.map((key) => [key, attribution[key] || ""])) });

  // While a form waits on the server its button says so and shows a small spinner; the label comes back after.
  const setSending = (button, on) => {
    const label = button.firstChild;
    if (on) {
      button.dataset.label = label.textContent;
      label.textContent = "Đang gửi ";
    } else if (button.dataset.label) {
      label.textContent = button.dataset.label;
    }
    button.disabled = on;
    button.classList.toggle("is-sending", on);
  };

  const setupTracking = () => {
    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      link.addEventListener("click", () => track("phone_click", { phone_number: link.getAttribute("href").slice(4) }, { name: "Contact" }));
    });
  };

  /* ---------- Messenger and Zalo: a round button opens the two links ---------- */

  const setupContact = () => {
    const root = document.querySelector("[data-contact]");
    const toggle = root?.querySelector(".contact-toggle");
    const menu = root?.querySelector(".contact-menu");
    if (!toggle || !menu) return;
    const setOpen = (open) => {
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => setOpen(menu.hidden));
    root.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || menu.hidden) return;
      setOpen(false);
      toggle.focus();
    });
    document.addEventListener("click", (event) => { if (!menu.hidden && !root.contains(event.target)) setOpen(false); });
    menu.querySelectorAll("[data-contact-link]").forEach((link) => {
      link.addEventListener("click", () => {
        const method = link.dataset.contactLink;
        track("contact_click", { method }, { name: "Contact", params: { content_name: method } });
        setOpen(false);
      });
    });
  };

  /* ---------- figures: seeded synthetic data, drawn as SVG ---------- */

  const NS = "http://www.w3.org/2000/svg";
  const W = 560;
  const H = 400;
  const M = { l: 58, r: 18, t: 18, b: 54 };

  const rng = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const fmt = (value, digits = 2) => value.toFixed(digits).replace(".", ",");
  const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

  const node = (parent, name, attrs = {}, text) => {
    const element = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    if (text !== undefined) element.textContent = text;
    parent.append(element);
    return element;
  };

  const frame = (svg, { x, y, xt, yt, xl, yl, xf = (v) => String(v), yf = (v) => String(v) }) => {
    const sx = (v) => M.l + ((v - x[0]) / (x[1] - x[0])) * (W - M.l - M.r);
    const sy = (v) => H - M.b - ((v - y[0]) / (y[1] - y[0])) * (H - M.t - M.b);
    yt.forEach((v) => {
      node(svg, "line", { class: "f-grid", x1: M.l, x2: W - M.r, y1: sy(v), y2: sy(v) });
      node(svg, "text", { class: "f-tick", x: M.l - 10, y: sy(v) + 4, "text-anchor": "end" }, yf(v));
    });
    xt.forEach((v) => {
      node(svg, "line", { class: "f-grid", x1: sx(v), x2: sx(v), y1: M.t, y2: H - M.b });
      node(svg, "text", { class: "f-tick", x: sx(v), y: H - M.b + 20, "text-anchor": "middle" }, xf(v));
    });
    node(svg, "line", { class: "f-axis", x1: M.l, x2: M.l, y1: M.t, y2: H - M.b });
    node(svg, "line", { class: "f-axis", x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b });
    node(svg, "text", { class: "f-label", x: M.l + (W - M.l - M.r) / 2, y: H - 8, "text-anchor": "middle" }, xl);
    node(svg, "text", { class: "f-label", transform: `translate(16 ${M.t + (H - M.t - M.b) / 2}) rotate(-90)`, "text-anchor": "middle" }, yl);
    return { sx, sy };
  };

  const callout = (svg, { text, sub, tx, ty, anchor = "start", from, to }) => {
    node(svg, "polyline", { class: "f-leader", points: `${from[0]},${from[1]} ${to[0]},${to[1]}` });
    node(svg, "circle", { class: "f-mark", cx: to[0], cy: to[1], r: 3.6 });
    node(svg, "text", { class: "f-note", x: tx, y: ty, "text-anchor": anchor }, text);
    if (sub) node(svg, "text", { class: "f-note-sub", x: tx, y: ty + 20, "text-anchor": anchor }, sub);
  };

  const seq = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const sdev = (values) => {
    const m = mean(values);
    return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1));
  };
  const quantile = (values, p) => {
    const sorted = [...values].sort((a, b) => a - b);
    const i = (sorted.length - 1) * p;
    const lo = Math.floor(i);
    return sorted[lo] + (sorted[Math.ceil(i)] - sorted[lo]) * (i - lo);
  };
  const pathOf = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  // shared synthetic inputs, so figures of the same course agree with each other
  const treeModel = { cNew: 30, cStd: 12, cFail: 15, pNew: 0.8, pStd: 0.6, uCure: 0.95, uFail: 0.55 };
  const evalTree = (p) => {
    const cN = p.cNew + (1 - p.pNew) * p.cFail;
    const cS = p.cStd + (1 - p.pStd) * p.cFail;
    const qN = p.pNew * p.uCure + (1 - p.pNew) * p.uFail;
    const qS = p.pStd * p.uCure + (1 - p.pStd) * p.uFail;
    return { cN, cS, qN, qS, icer: (cN - cS) / (qN - qS) };
  };
  const psaSample = () => {
    const r = rng(21);
    return seq(260, () => {
      const g1 = gauss(r);
      const g2 = gauss(r);
      return { e: Math.min(0.68, Math.max(-0.08, 0.3 + 0.11 * g1)), c: Math.min(48, Math.max(-8, 20 + 9 * (0.4 * g1 + 0.917 * g2))) };
    });
  };
  const tsSeries = () => {
    const r = rng(5);
    return seq(72, (t) => 48 + 0.42 * t + 9 * Math.sin((2 * Math.PI * t) / 12 + 0.9) + gauss(r) * 2.4);
  };
  const fitTrendSeason = (y, train) => {
    const tm = (train - 1) / 2;
    const sxx = Array.from({ length: train }, (_, t) => (t - tm) ** 2).reduce((s, v) => s + v, 0);
    const yb = mean(y.slice(0, train));
    const b = y.slice(0, train).reduce((s, v, t) => s + (t - tm) * (v - yb), 0) / sxx;
    const a = yb - b * tm;
    const seas = Array.from({ length: 12 }, (_, m) => mean(y.slice(0, train).map((v, t) => (t % 12 === m ? v - a - b * t : null)).filter((v) => v !== null)));
    return (t) => a + b * t + seas[t % 12];
  };
  const holtWinters = (y, a = 0.3, b = 0.05, g = 0.3) => {
    let level = mean(y.slice(0, 12));
    let trend = (mean(y.slice(12, 24)) - level) / 12;
    const season = y.slice(0, 12).map((v) => v - level);
    for (let t = 12; t < y.length; t += 1) {
      const s = season[t % 12];
      const prev = level;
      level = a * (y[t] - s) + (1 - a) * (level + trend);
      trend = b * (level - prev) + (1 - b) * trend;
      season[t % 12] = g * (y[t] - level) + (1 - g) * s;
    }
    return (h) => level + h * trend + season[(y.length - 1 + h) % 12];
  };

  const figures = {
    r(svg) {
      const r = rng(7);
      const n = 48;
      const pts = Array.from({ length: n }, () => {
        const x = 0.4 + r() * 9.2;
        return { x, y: Math.min(9.8, Math.max(0.2, 2.0 + 0.55 * x + gauss(r) * 1.1)) };
      });
      const xb = mean(pts.map((p) => p.x));
      const yb = mean(pts.map((p) => p.y));
      const sxx = pts.reduce((s, p) => s + (p.x - xb) ** 2, 0);
      const slope = pts.reduce((s, p) => s + (p.x - xb) * (p.y - yb), 0) / sxx;
      const icpt = yb - slope * xb;
      const sd = Math.sqrt(pts.reduce((s, p) => s + (p.y - icpt - slope * p.x) ** 2, 0) / (n - 2));
      const half = (x) => 2.013 * sd * Math.sqrt(1 / n + (x - xb) ** 2 / sxx);
      const { sx, sy } = frame(svg, { x: [0, 10], y: [0, 10], xt: [0, 2, 4, 6, 8, 10], yt: [0, 2, 4, 6, 8, 10], xl: "Biến giải thích (đơn vị tùy ý)", yl: "Kết cục", xf: (v) => String(v), yf: (v) => String(v) });
      const xs = Array.from({ length: 25 }, (_, i) => 0.4 + (i * 9.2) / 24);
      const upper = xs.map((x) => `${sx(x)},${sy(icpt + slope * x + half(x))}`);
      const lower = xs.map((x) => `${sx(x)},${sy(icpt + slope * x - half(x))}`).reverse();
      node(svg, "polygon", { class: "f-band", points: [...upper, ...lower].join(" ") });
      pts.forEach((p, i) => node(svg, "circle", { class: "f-pt", cx: sx(p.x), cy: sy(p.y), r: 4.2, style: `--i:${i}` }));
      node(svg, "path", { class: "f-fit f-draw", pathLength: 1, d: `M${sx(0.4)},${sy(icpt + slope * 0.4)} L${sx(9.6)},${sy(icpt + slope * 9.6)}` });
      callout(svg, { text: `Hệ số góc = ${fmt(slope)}`, sub: `ước lượng từ ${n} điểm mô phỏng`, tx: M.l + 16, ty: M.t + 22, from: [M.l + 96, M.t + 48], to: [sx(6.2), sy(icpt + slope * 6.2)] });
      callout(svg, { text: "Khoảng tin cậy 95%", tx: W - M.r - 6, ty: H - M.b - 28, anchor: "end", from: [sx(8.6), H - M.b - 48], to: [sx(8.6), sy(icpt + slope * 8.6 - half(8.6))] });
    },

    cea(svg) {
      const pts = psaSample();
      const n = pts.length;
      const lambda = 80;
      const me = mean(pts.map((p) => p.e));
      const mc = mean(pts.map((p) => p.c));
      const icer = mc / me;
      const below = Math.round((pts.filter((p) => p.c < lambda * p.e).length / n) * 100);
      const { sx, sy } = frame(svg, { x: [-0.1, 0.7], y: [-10, 50], xt: [0, 0.2, 0.4, 0.6], yt: [0, 10, 20, 30, 40, 50], xl: "Chênh lệch hiệu quả (QALY)", yl: "Chênh lệch chi phí (triệu đồng)", xf: (v) => fmt(v, 1), yf: (v) => String(v) });
      node(svg, "line", { class: "f-axis", x1: sx(0), x2: sx(0), y1: M.t, y2: H - M.b });
      node(svg, "line", { class: "f-axis", x1: M.l, x2: W - M.r, y1: sy(0), y2: sy(0) });
      pts.forEach((p, i) => node(svg, "circle", { class: "f-pt", cx: sx(p.e), cy: sy(p.c), r: 3.4, style: `--i:${Math.min(i, 120) * 0.5}` }));
      node(svg, "path", { class: "f-thr f-late", d: `M${sx(-0.1)},${sy(-0.1 * lambda)} L${sx(50 / lambda)},${sy(50)}` });
      node(svg, "path", { class: "f-mark f-late", d: `M${sx(me)},${sy(mc) - 8} l8,8 l-8,8 l-8,-8 z` });
      callout(svg, { text: `ICER ≈ ${fmt(icer, 1)} triệu đồng/QALY`, sub: `${below}% lần mô phỏng nằm dưới ngưỡng`, tx: sx(0.04), ty: M.t + 22, from: [sx(0.1), M.t + 48], to: [sx(me), sy(mc)] });
      callout(svg, { text: "Ngưỡng sẵn lòng chi trả (minh họa)", sub: `${lambda} triệu đồng/QALY`, tx: W - M.r - 6, ty: H - M.b - 26, anchor: "end", from: [sx(0.52), H - M.b - 44], to: [sx(0.52), sy(0.52 * lambda)] });
    },

    time(svg) {
      const y = tsSeries();
      const total = y.length;
      const train = 60;
      const fit = fitTrendSeason(y, train);
      const sd = Math.sqrt(mean(y.slice(0, train).map((v, t) => (v - fit(t)) ** 2)));
      const rmse = Math.sqrt(mean(y.slice(train).map((v, i) => (v - fit(train + i)) ** 2)));
      const lo = Math.floor((Math.min(...y) - 6) / 10) * 10;
      const hi = Math.ceil((Math.max(...y) + 10) / 10) * 10;
      const yt = [];
      for (let v = lo; v <= hi; v += 20) yt.push(v);
      const { sx, sy } = frame(svg, { x: [0, 71], y: [lo, hi], xt: [0, 12, 24, 36, 48, 60], yt, xl: "Thời gian (tháng)", yl: "Giá trị quan sát" });
      node(svg, "rect", { class: "f-zone", x: sx(train - 0.5), y: M.t, width: sx(71.5) - sx(train - 0.5), height: H - M.t - M.b });
      const fut = Array.from({ length: total - train }, (_, i) => train + i);
      const up = fut.map((t) => `${sx(t)},${sy(fit(t) + 1.28 * sd * (1 + 0.015 * (t - train)))}`);
      const dn = fut.map((t) => `${sx(t)},${sy(fit(t) - 1.28 * sd * (1 + 0.015 * (t - train)))}`).reverse();
      node(svg, "polygon", { class: "f-band", points: [...up, ...dn].join(" ") });
      node(svg, "path", { class: "f-line f-draw", pathLength: 1, d: y.map((v, t) => `${t ? "L" : "M"}${sx(t)},${sy(v)}`).join(" ") });
      node(svg, "path", { class: "f-fit dash f-late", d: fut.map((t, i) => `${i ? "L" : "M"}${sx(t)},${sy(fit(t))}`).join(" ") });
      node(svg, "text", { class: "f-note-sub f-late", x: (sx(train - 0.5) + sx(71.5)) / 2, y: H - M.b - 10, "text-anchor": "middle" }, "ngoài mẫu");
      callout(svg, { text: `Sai số ngoài mẫu: RMSE = ${fmt(rmse, 1)}`, sub: "xu hướng + mùa vụ, huấn luyện trên 60 tháng đầu", tx: sx(58), ty: M.t + 22, anchor: "end", from: [sx(58) - 8, M.t + 34], to: [sx(65), sy(fit(65))] });
    },
    r_ci(svg) {
      const r = rng(41);
      const mu = 50;
      const cis = seq(20, () => {
        const s = seq(25, () => mu + 10 * gauss(r));
        const m = mean(s);
        const h = (2.064 * sdev(s)) / 5;
        return { m, lo: m - h, hi: m + h, hit: Math.abs(m - mu) <= h };
      });
      const hits = cis.filter((c) => c.hit).length;
      const { sx, sy } = frame(svg, { x: [40, 60], y: [0, 21], xt: [40, 45, 50, 55, 60], yt: [1, 5, 10, 15, 20], xl: "Trung bình mẫu và khoảng tin cậy 95%", yl: "Mẫu lặp thứ" });
      node(svg, "line", { class: "f-thr", x1: sx(mu), x2: sx(mu), y1: M.t, y2: H - M.b });
      cis.forEach((c, i) => {
        const y = sy(i + 1);
        const miss = c.hit ? "" : " is-miss";
        node(svg, "path", { class: `f-ci f-draw${miss}`, pathLength: 1, d: `M${sx(c.lo)},${y} L${sx(c.hi)},${y}`, style: `--d:${(0.15 + i * 0.07).toFixed(2)}s;--dur:0.45s` });
        node(svg, "circle", { class: `f-pt${miss}`, cx: sx(c.m), cy: y, r: 3.6, style: `--i:${Math.round(40 + i * 6.4)}` });
      });
      const miss = cis.findIndex((c) => !c.hit);
      const target = miss >= 0 ? [sx(cis[miss].hi), sy(miss + 1)] : [sx(mu), M.t + 4];
      callout(svg, { text: `${hits}/20 khoảng chứa μ = 50`, sub: "mỗi mẫu 25 quan sát", tx: W - M.r - 6, ty: M.t + 22, anchor: "end", from: [W - M.r - 60, M.t + 46], to: target });
    },

    r_hist(svg) {
      const r = rng(3);
      const v = seq(300, () => Math.min(35.9, Math.exp(2.3 + 0.45 * gauss(r))));
      const counts = seq(18, (b) => v.filter((x) => x >= b * 2 && x < b * 2 + 2).length);
      const top = Math.ceil(Math.max(...counts) / 20) * 20;
      const md = quantile(v, 0.5);
      const mn = mean(v);
      const { sx, sy } = frame(svg, { x: [0, 36], y: [0, top], xt: [0, 6, 12, 18, 24, 30, 36], yt: seq(top / 20 + 1, (i) => i * 20), xl: "Giá trị quan sát (đơn vị tùy ý)", yl: "Số quan sát" });
      counts.forEach((c, b) => {
        if (!c) return;
        node(svg, "rect", { class: "f-bar", x: sx(b * 2) + 1, y: sy(c), width: sx(2) - sx(0) - 2, height: sy(0) - sy(c), style: `--i:${b}` });
      });
      node(svg, "line", { class: "f-thr f-late", x1: sx(md), x2: sx(md), y1: M.t + 70, y2: H - M.b });
      node(svg, "line", { class: "f-fit f-late", x1: sx(mn), x2: sx(mn), y1: M.t + 30, y2: H - M.b });
      node(svg, "text", { class: "f-note-sub f-late", x: sx(md) - 6, y: M.t + 84, "text-anchor": "end" }, `Trung vị = ${fmt(md, 1)}`);
      callout(svg, { text: `Trung bình = ${fmt(mn, 1)}`, sub: "lệch phải: trung bình > trung vị", tx: sx(mn) + 10, ty: M.t + 22, from: [sx(mn) + 8, M.t + 30], to: [sx(mn), M.t + 30] });
    },

    r_box(svg) {
      const r = rng(9);
      const groups = [seq(40, () => 52 + 9 * gauss(r)), seq(40, () => 58 + 9 * gauss(r))];
      const { sx, sy } = frame(svg, { x: [0.4, 2.6], y: [25, 85], xt: [], yt: [30, 40, 50, 60, 70, 80], xl: "Nhóm so sánh", yl: "Giá trị đo (đơn vị tùy ý)" });
      groups.forEach((g, gi) => {
        const cx = gi + 1;
        const [q1, q2, q3] = [0.25, 0.5, 0.75].map((p) => quantile(g, p));
        const iqr = q3 - q1;
        const lo = Math.min(...g.filter((x) => x >= q1 - 1.5 * iqr));
        const hi = Math.max(...g.filter((x) => x <= q3 + 1.5 * iqr));
        const half = sx(0.22) - sx(0);
        node(svg, "text", { class: "f-tick", x: sx(cx), y: H - M.b + 20, "text-anchor": "middle" }, gi ? "Nhóm B" : "Nhóm A");
        node(svg, "line", { class: "f-whisk f-in", x1: sx(cx), x2: sx(cx), y1: sy(hi), y2: sy(q3), style: "--d:0.9s" });
        node(svg, "line", { class: "f-whisk f-in", x1: sx(cx), x2: sx(cx), y1: sy(q1), y2: sy(lo), style: "--d:0.9s" });
        node(svg, "rect", { class: "f-box f-in", x: sx(cx) - half, y: sy(q3), width: half * 2, height: sy(q1) - sy(q3), style: "--d:0.8s" });
        node(svg, "line", { class: "f-med f-in", x1: sx(cx) - half, x2: sx(cx) + half, y1: sy(q2), y2: sy(q2), style: "--d:1s" });
        g.forEach((x, i) => node(svg, "circle", { class: "f-pt", cx: sx(cx + (r() - 0.5) * 0.3), cy: sy(x), r: 3.2, style: `--i:${i + gi * 40}` }));
      });
      const [a, b] = groups;
      const d = mean(b) - mean(a);
      const se = Math.sqrt(sdev(a) ** 2 / a.length + sdev(b) ** 2 / b.length);
      callout(svg, { text: `Chênh lệch trung bình = ${fmt(d, 1)}`, sub: `KTC 95%: ${fmt(d - 1.99 * se, 1)} đến ${fmt(d + 1.99 * se, 1)} (t-test)`, tx: sx(1.5), ty: M.t + 22, anchor: "middle", from: [sx(1.5), M.t + 46], to: [sx(2) - (sx(0.22) - sx(0)), sy(mean(b))] });
    },

    r_logit(svg) {
      const r = rng(17);
      const pts = seq(80, () => {
        const x = r() * 10;
        return { x, y: r() < 1 / (1 + Math.exp(4 - 0.8 * x)) ? 1 : 0 };
      });
      let b0 = 0;
      let b1 = 0;
      for (let k = 0; k < 25; k += 1) {
        let g0 = 0; let g1 = 0; let h00 = 0; let h01 = 0; let h11 = 0;
        pts.forEach(({ x, y }) => {
          const p = 1 / (1 + Math.exp(-(b0 + b1 * x)));
          const w = p * (1 - p);
          g0 += y - p; g1 += (y - p) * x; h00 += w; h01 += w * x; h11 += w * x * x;
        });
        const det = h00 * h11 - h01 * h01;
        b0 += (h11 * g0 - h01 * g1) / det;
        b1 += (h00 * g1 - h01 * g0) / det;
      }
      const prob = (x) => 1 / (1 + Math.exp(-(b0 + b1 * x)));
      const { sx, sy } = frame(svg, { x: [0, 10], y: [-0.08, 1.08], xt: [0, 2, 4, 6, 8, 10], yt: [0, 0.5, 1], xl: "Biến giải thích (đơn vị tùy ý)", yl: "Xác suất kết cục", yf: (v) => (v === 0.5 ? "0,5" : String(v)) });
      pts.forEach((p, i) => node(svg, "circle", { class: "f-pt", cx: sx(p.x), cy: sy(p.y + (r() - 0.5) * 0.07), r: 3.6, style: `--i:${i}` }));
      node(svg, "path", { class: "f-fit f-draw", pathLength: 1, d: pathOf(seq(41, (i) => [sx(i / 4), sy(prob(i / 4))])) });
      const x50 = -b0 / b1;
      callout(svg, { text: `OR = ${fmt(Math.exp(b1))} cho mỗi đơn vị tăng`, sub: `hồi quy logistic, ${pts.length} quan sát`, tx: M.l + 16, ty: M.t + 30, from: [M.l + 120, M.t + 56], to: [sx(x50), sy(0.5)] });
    },

    cea_tree(svg) {
      const p = treeModel;
      const v = evalTree(p);
      const tri = (x, y) => `M${x},${y} l14,-8 l0,16 z`;
      const edge = (x1, y1, x2, y2, d) => node(svg, "path", { class: "f-edge f-draw", pathLength: 1, d: `M${x1},${y1} L${x1 + 24},${y2} L${x2},${y2}`, style: `--d:${d}s;--dur:0.5s` });
      const label = (x, y, text, d, cls = "f-note-sub") => node(svg, "text", { class: `${cls} f-in`, x, y, style: `--d:${d}s` }, text);
      node(svg, "rect", { class: "f-node f-pt", x: 18, y: 160, width: 20, height: 20, style: "--i:0" });
      const arms = [
        { name: "Điều trị mới", y: 82, cost: p.cNew, pc: p.pNew, c: v.cN, q: v.qN },
        { name: "Điều trị chuẩn", y: 258, cost: p.cStd, pc: p.pStd, c: v.cS, q: v.qS },
      ];
      arms.forEach((a, ai) => {
        edge(38, 170, 182, a.y, 0.2);
        label(68, a.y - 9, a.name, 0.5, "f-cat");
        node(svg, "circle", { class: "f-node-c f-pt", cx: 191, cy: a.y, r: 9, style: `--i:${70 + ai * 4}` });
        [[a.pc, "Khỏi bệnh", a.cost, p.uCure, -40], [1 - a.pc, "Không khỏi", a.cost + p.cFail, p.uFail, 40]].forEach(([pr, out, cost, u, dy], oi) => {
          const ty = a.y + dy;
          edge(200, a.y, 322, ty, 0.85);
          label(232, ty - 8, `p = ${fmt(pr)}`, 1.15);
          node(svg, "path", { class: "f-node f-pt", d: tri(324, ty), style: `--i:${130 + ai * 6 + oi * 3}` });
          label(346, ty - 3, out, 1.45, "f-cat");
          label(346, ty + 16, `${fmt(cost, 0)} triệu · ${fmt(u)} QALY`, 1.55);
        });
      });
      label(18, 336, `Mới: chi phí kỳ vọng ${fmt(v.cN, 0)} triệu, ${fmt(v.qN)} QALY`, 1.9);
      label(18, 358, `Chuẩn: chi phí kỳ vọng ${fmt(v.cS, 0)} triệu, ${fmt(v.qS)} QALY`, 2);
      label(18, 390, `ICER = ${fmt(v.icer, 1)} triệu đồng/QALY`, 2.2, "f-note");
    },

    cea_markov(svg) {
      const P = [[0.85, 0.1, 0.05], [0, 0.8, 0.2], [0, 0, 1]];
      let s = [1, 0, 0];
      const trace = [s];
      for (let t = 0; t < 30; t += 1) {
        s = [0, 1, 2].map((j) => s.reduce((sum, v, i) => sum + v * P[i][j], 0));
        trace.push(s);
      }
      const { sx, sy } = frame(svg, { x: [0, 30], y: [0, 100], xt: [0, 5, 10, 15, 20, 25, 30], yt: [0, 25, 50, 75, 100], xl: "Chu kỳ (năm)", yl: "Tỷ lệ đoàn hệ (%)" });
      const cum = trace.map(([h, k]) => [0, h, h + k, 1]);
      ["f-s1", "f-s2", "f-s3"].forEach((cls, band) => {
        const upper = cum.map((c, t) => [sx(t), sy(c[band + 1] * 100)]);
        const lower = cum.map((c, t) => [sx(t), sy(c[band] * 100)]).reverse();
        node(svg, "polygon", { class: `f-area ${cls} f-wipe`, points: [...upper, ...lower].map((q) => q.join(",")).join(" "), style: `--d:${0.15 + band * 0.25}s` });
      });
      node(svg, "text", { class: "f-cat f-on-dark f-in", x: sx(1.2), y: sy(12), style: "--d:1.4s" }, "Khỏe");
      node(svg, "text", { class: "f-cat f-in", x: sx(7), y: sy((cum[7][1] + cum[7][2]) * 50) + 5, style: "--d:1.5s" }, "Bệnh");
      node(svg, "text", { class: "f-cat f-in", x: sx(21), y: sy(78), style: "--d:1.6s" }, "Tử vong");
      const h10 = trace[10][0] * 100;
      callout(svg, { text: `Sau 10 chu kỳ: ${fmt(h10, 0)}% còn khỏe`, sub: "3 trạng thái, xác suất chuyển tiếp minh họa", tx: W - M.r - 6, ty: M.t + 26, anchor: "end", from: [sx(16), M.t + 50], to: [sx(10), sy(h10)] });
    },

    cea_tornado(svg) {
      const base = evalTree(treeModel).icer;
      const names = { pNew: "Xác suất khỏi (mới)", pStd: "Xác suất khỏi (chuẩn)", uCure: "Utility khi khỏi", cNew: "Chi phí điều trị mới", uFail: "Utility khi không khỏi", cStd: "Chi phí điều trị chuẩn", cFail: "Chi phí khi không khỏi" };
      const vary = (k, f) => evalTree({ ...treeModel, [k]: Math.min(k[0] === "c" ? Infinity : 1, treeModel[k] * f) }).icer;
      const rows = Object.keys(names).map((k) => ({ k, lo: vary(k, 0.9), hi: vary(k, 1.1) })).sort((a, b) => Math.abs(b.hi - b.lo) - Math.abs(a.hi - a.lo));
      const L = 200;
      const x0 = 100;
      const x1 = 350;
      const sx = (v) => L + ((v - x0) / (x1 - x0)) * (W - M.r - L);
      const top = 58;
      const row = (H - M.b - top) / rows.length;
      [100, 150, 200, 250, 300, 350].forEach((t) => {
        node(svg, "line", { class: "f-grid", x1: sx(t), x2: sx(t), y1: top - 8, y2: H - M.b });
        node(svg, "text", { class: "f-tick", x: sx(t), y: H - M.b + 20, "text-anchor": "middle" }, String(t));
      });
      node(svg, "text", { class: "f-label", x: L + (W - M.r - L) / 2, y: H - 8, "text-anchor": "middle" }, "ICER (triệu đồng/QALY)");
      rows.forEach((d, i) => {
        const y = top + i * row + row / 2;
        node(svg, "text", { class: "f-cat", x: L - 10, y: y + 5, "text-anchor": "end" }, names[d.k]);
        [[d.lo, "f-s2"], [d.hi, "f-s1"]].forEach(([v, cls]) => {
          const left = v < base;
          node(svg, "rect", { class: `f-barx ${cls}`, x: left ? sx(v) : sx(base), y: y - 11, width: Math.abs(sx(v) - sx(base)), height: 22, style: `--i:${i};transform-origin:${left ? "right" : "left"} center` });
        });
      });
      node(svg, "line", { class: "f-thr", x1: sx(base), x2: sx(base), y1: top - 12, y2: H - M.b });
      node(svg, "text", { class: "f-note f-late", x: sx(base), y: top - 22, "text-anchor": "middle" }, `ICER cơ sở = ${fmt(base, 1)}`);
      [["f-s2", "−10%"], ["f-s1", "+10%"]].forEach(([cls, t], i) => {
        node(svg, "rect", { class: `${cls} f-in`, x: 12 + i * 72, y: 10, width: 12, height: 12, style: "--d:1.2s" });
        node(svg, "text", { class: "f-tick f-in", x: 29 + i * 72, y: 21, style: "--d:1.2s" }, t);
      });
    },

    cea_ceac(svg) {
      const pts = psaSample();
      const share = (l) => (pts.filter((p) => l * p.e - p.c > 0).length / pts.length) * 100;
      const lambda = 80;
      const at = share(lambda);
      const { sx, sy } = frame(svg, { x: [0, 200], y: [0, 100], xt: [0, 50, 100, 150, 200], yt: [0, 25, 50, 75, 100], xl: "Ngưỡng sẵn lòng chi trả (triệu đồng/QALY)", yl: "Khả năng chi phí - hiệu quả (%)" });
      node(svg, "path", { class: "f-fit f-draw", pathLength: 1, d: pathOf(seq(101, (i) => [sx(i * 2), sy(share(i * 2))])), style: "--dur:1.5s;--d:0.3s" });
      node(svg, "line", { class: "f-thr f-late", x1: sx(lambda), x2: sx(lambda), y1: M.t, y2: H - M.b });
      callout(svg, { text: `${fmt(at, 0)}% tại ${lambda} triệu đồng/QALY`, sub: "tỷ lệ mô phỏng có lợi ích ròng dương", tx: sx(lambda) + 14, ty: sy(at) + 46, from: [sx(lambda) + 12, sy(at) + 32], to: [sx(lambda), sy(at)] });
    },

    ts_acf(svg) {
      const y = tsSeries();
      const d = y;
      const m = mean(d);
      const den = d.reduce((s, v) => s + (v - m) ** 2, 0);
      const acf = seq(24, (k) => d.slice(0, d.length - k - 1).reduce((s, v, t) => s + (v - m) * (d[t + k + 1] - m), 0) / den);
      const bound = 1.96 / Math.sqrt(d.length);
      const { sx, sy } = frame(svg, { x: [0, 25], y: [-0.5, 1], xt: [1, 6, 12, 18, 24], yt: [-0.5, 0, 0.5, 1], xl: "Độ trễ (tháng)", yl: "Tự tương quan (ACF)", yf: (v) => (v === 0 ? "0" : fmt(v, 1)) });
      node(svg, "line", { class: "f-axis", x1: M.l, x2: W - M.r, y1: sy(0), y2: sy(0) });
      [bound, -bound].forEach((b) => node(svg, "line", { class: "f-thr f-late", x1: M.l, x2: W - M.r, y1: sy(b), y2: sy(b) }));
      acf.forEach((a, i) => {
        const k = i + 1;
        node(svg, "rect", { class: `f-bar${k % 12 ? "" : " is-key"}`, x: sx(k) - 5, y: Math.min(sy(a), sy(0)), width: 10, height: Math.abs(sy(a) - sy(0)), style: `--i:${i};transform-origin:50% ${a < 0 ? "0%" : "100%"}` });
      });
      callout(svg, { text: "ACF giảm chậm: chuỗi chưa dừng", sub: `nhô lại ở độ trễ 12 (${fmt(acf[11])}): mùa vụ`, tx: sx(13.5), ty: M.t + 24, from: [sx(13.2), M.t + 30], to: [sx(12), sy(acf[11])] });
    },

    ts_decomp(svg) {
      const y = tsSeries();
      const n = y.length;
      const trend = y.map((_, t) => (t < 6 || t > n - 7 ? null : (0.5 * y[t - 6] + y.slice(t - 5, t + 6).reduce((s, v) => s + v, 0) + 0.5 * y[t + 6]) / 12));
      const raw = seq(12, (mo) => mean(y.map((v, t) => (trend[t] === null || t % 12 !== mo ? null : v - trend[t])).filter((v) => v !== null)));
      const seas = raw.map((v) => v - mean(raw));
      const rest = y.map((v, t) => (trend[t] === null ? null : v - trend[t] - seas[t % 12]));
      const L = 104;
      const sx = (t) => L + (t / (n - 1)) * (W - M.r - L);
      const amp = Math.max(...seas.map(Math.abs)) * 1.15;
      const lo = Math.min(...y);
      const hi = Math.max(...y);
      const panels = [
        { name: "Quan sát", vals: y, range: [lo, hi], cls: "f-line" },
        { name: "Xu hướng", vals: trend, range: [lo, hi], cls: "f-fit" },
        { name: "Mùa vụ", vals: y.map((_, t) => seas[t % 12]), range: [-amp, amp], cls: "f-fit" },
        { name: "Phần dư", vals: rest, range: [-amp, amp], cls: "f-line" },
      ];
      const ph = 66;
      const gap = 14;
      panels.forEach((p, i) => {
        const y0 = M.t + i * (ph + gap);
        const sy = (v) => y0 + ph - ((v - p.range[0]) / (p.range[1] - p.range[0])) * ph;
        node(svg, "line", { class: "f-grid", x1: L, x2: W - M.r, y1: i > 1 ? sy(0) : y0 + ph, y2: i > 1 ? sy(0) : y0 + ph });
        node(svg, "text", { class: "f-cat", x: L - 12, y: y0 + ph / 2 + 5, "text-anchor": "end" }, p.name);
        const pts = p.vals.map((v, t) => (v === null ? null : [sx(t), sy(v)])).filter(Boolean);
        node(svg, "path", { class: `${p.cls} f-draw`, pathLength: 1, d: pathOf(pts), style: `--d:${0.15 + i * 0.4}s;--dur:1s` });
      });
      const base = M.t + 4 * (ph + gap) - gap;
      [0, 12, 24, 36, 48, 60, 71].forEach((t) => node(svg, "text", { class: "f-tick", x: sx(t), y: base + 20, "text-anchor": "middle" }, String(t)));
      node(svg, "text", { class: "f-label", x: L + (W - M.r - L) / 2, y: base + 44, "text-anchor": "middle" }, "Thời gian (tháng)");
      node(svg, "text", { class: "f-note-sub f-late", x: W - M.r, y: H - 6, "text-anchor": "end" }, "quan sát = xu hướng + mùa vụ + phần dư");
    },

    ts_err(svg) {
      const y = tsSeries();
      const train = 60;
      const test = y.slice(train);
      const reg = fitTrendSeason(y, train);
      const hw = holtWinters(y.slice(0, train));
      const models = [
        { name: "Naive", f: (h) => y[train + h - 12] },
        { name: "Holt-Winters", f: (h) => hw(h + 1) },
        { name: "Hồi quy", f: (h) => reg(train + h) },
      ].map((m) => {
        const e = test.map((v, h) => v - m.f(h));
        return { ...m, mae: mean(e.map(Math.abs)), rmse: Math.sqrt(mean(e.map((v) => v * v))), mape: mean(e.map((v, h) => Math.abs(v / test[h]))) * 100 };
      });
      const metrics = [["mae", "MAE"], ["rmse", "RMSE"], ["mape", "MAPE (%)"]];
      const pw = (W - M.l - M.r) / 3;
      const top = 64;
      const bottom = H - M.b - 14;
      metrics.forEach(([key, title], mi) => {
        const x0 = M.l + mi * pw;
        const max = Math.max(...models.map((m) => m[key])) * 1.18;
        const best = Math.min(...models.map((m) => m[key]));
        node(svg, "text", { class: "f-label", x: x0 + pw / 2, y: top - 26, "text-anchor": "middle" }, title);
        node(svg, "line", { class: "f-axis", x1: x0 + 10, x2: x0 + pw - 10, y1: bottom, y2: bottom });
        models.forEach((m, i) => {
          const bw = (pw - 40) / 3;
          const x = x0 + 20 + i * bw;
          const h = (m[key] / max) * (bottom - top);
          node(svg, "rect", { class: `f-bar${m[key] === best ? " is-key" : ""}`, x: x + 3, y: bottom - h, width: bw - 6, height: h, style: `--i:${mi * 4 + i}` });
          node(svg, "text", { class: "f-tick f-late", x: x + bw / 2, y: bottom - h - 8, "text-anchor": "middle" }, fmt(m[key], 1));
          node(svg, "text", { class: "f-cat f-small", x: x + bw / 2, y: bottom + 18, "text-anchor": "middle" }, m.name === "Holt-Winters" ? "H-W" : m.name);
        });
      });
      node(svg, "text", { class: "f-note-sub f-late", x: W / 2, y: H - 8, "text-anchor": "middle" }, "12 tháng kiểm tra · cột đậm: sai số thấp nhất");
    },
  };

  const renderFigure = (svg, kind, label) => {
    const safe = Object.prototype.hasOwnProperty.call(figures, kind) ? kind : "r";
    svg.classList.remove("is-plotted");
    svg.replaceChildren();
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("aria-label", label);
    figures[safe](svg);
  };

  const plot = (svg) => {
    void svg.getBoundingClientRect();
    svg.classList.add("is-plotted");
  };

  const setupFigures = () => {
    const svgs = [...document.querySelectorAll("[data-plot]")];
    if (!("IntersectionObserver" in window)) {
      svgs.forEach(plot);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        plot(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.25 });
    svgs.forEach((svg) => observer.observe(svg));
  };

  /* ---------- endless 5s loops ---------- */

  const makeCycle = (area, advance, ms = 5000) => {
    let timer = 0;
    let visible = false;
    const restart = () => {
      window.clearTimeout(timer);
      if (reducedMotion.matches || !visible || document.hidden) return;
      timer = window.setTimeout(() => { advance(); restart(); }, ms);
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; restart(); }, { threshold: 0.3 }).observe(area);
    } else {
      visible = true;
      restart();
    }
    document.addEventListener("visibilitychange", restart);
    return { restart };
  };

  /* ---------- course tabs ---------- */

  const scenarios = {
    r: {
      figures: [
        { kind: "r_ci", figure: "Hình 1.1.", caption: " Khoảng tin cậy 95%." },
        { kind: "r_hist", figure: "Hình 1.2.", caption: " Histogram." },
        { kind: "r_box", figure: "Hình 1.3.", caption: " Boxplot và t-test." },
        { kind: "r", figure: "Hình 1.4.", caption: " Hồi quy tuyến tính." },
        { kind: "r_logit", figure: "Hình 1.5.", caption: " Hồi quy logistic." },
      ],
      date: "Từ 08/01 đến 10/01/2027",
      duration: "03 ngày",
      title: "Phân tích dữ liệu với R cơ bản",
      description: "Đối tượng: nhà nghiên cứu, nghiên cứu sinh và học viên sau đại học, giảng viên cao đẳng và đại học, người mới bắt đầu sử dụng R. Không cần kinh nghiệm lập trình.",
      skills: ["Sử dụng R và RStudio cho những phân tích dữ liệu thông dụng", "Nhập, quản lí, mô tả và hiển thị dữ liệu", "Thực hiện các phân tích so sánh và phân tích mối liên quan"],
    },
    cea: {
      figures: [
        { kind: "cea_tree", figure: "Hình 2.1.", caption: " Cây quyết định (decision tree)." },
        { kind: "cea_markov", figure: "Hình 2.2.", caption: " Mô hình Markov." },
        { kind: "cea_tornado", figure: "Hình 2.3.", caption: " Biểu đồ tornado." },
        { kind: "cea", figure: "Hình 2.4.", caption: " Mặt phẳng chi phí - hiệu quả." },
        { kind: "cea_ceac", figure: "Hình 2.5.", caption: " Đường CEAC." },
      ],
      date: "Ngày 12/01 và 13/01/2027",
      duration: "02 ngày",
      title: "Phân tích chi phí - hiệu quả trong y tế",
      description: "Đối tượng: người làm việc trong lĩnh vực y tế và dược phẩm, gồm nhà quản lí và hoạch định chính sách y tế, bác sĩ, dược sĩ, chuyên viên y tế, nghiên cứu viên.",
      skills: ["Xác định và đo lường chi phí và hiệu quả; hiểu utility và QALY", "Tính và diễn giải ICER; xây dựng decision tree và Markov model", "Thực hiện sensitivity analysis và diễn giải kết quả trong bối cảnh ra quyết định y tế"],
    },
    time: {
      figures: [
        { kind: "ts_acf", figure: "Hình 3.1.", caption: " Hàm tự tương quan (ACF)." },
        { kind: "ts_decomp", figure: "Hình 3.2.", caption: " Phân rã chuỗi thời gian." },
        { kind: "time", figure: "Hình 3.3.", caption: " Dự báo ngoài mẫu." },
        { kind: "ts_err", figure: "Hình 3.4.", caption: " So sánh MAE, RMSE, MAPE." },
      ],
      date: "Từ 15/01 đến 17/01/2027",
      duration: "03 ngày",
      title: "Phân tích dữ liệu chuỗi thời gian với R",
      description: "Đối tượng: nhà nghiên cứu, nghiên cứu sinh, giảng viên và người làm việc với dữ liệu ghi nhận theo thời gian trong y học, kinh tế, tài chính, môi trường và các lĩnh vực liên quan.",
      skills: ["Nhận diện đặc điểm chính của dữ liệu chuỗi thời gian; hiểu tính dừng, tự tương quan và các thành phần của chuỗi", "Xây dựng mô hình dự báo từ exponential smoothing đến ARIMA", "Đánh giá và so sánh các mô hình bằng những thước đo sai số"],
    },
  };

  const scenarioKeys = Object.keys(scenarios);

  // hero plays every course figure in turn, 4s each, starting on the linear regression
  const setupHero = () => {
    const svg = document.querySelector("#hero-figure");
    const caption = document.querySelector("#hero-figure-caption");
    const sheetEl = document.querySelector(".hero-plate");
    if (!svg || !caption || !sheetEl) return;
    const list = scenarioKeys.flatMap((key) => scenarios[key].figures);
    let index = 0;

    const show = (next, { animate = true } = {}) => {
      index = (next + list.length) % list.length;
      const fig = list[index];
      renderFigure(svg, fig.kind, fig.figure + fig.caption);
      const strong = document.createElement("strong");
      strong.textContent = fig.figure;
      caption.replaceChildren(strong, document.createTextNode(fig.caption));
      if (!animate) return;
      sheetEl.classList.remove("is-swapping");
      if (!reducedMotion.matches) {
        void sheetEl.offsetWidth;
        sheetEl.classList.add("is-swapping");
      }
      plot(svg);
    };

    // reserve the tallest caption so the hero does not shift as figures change
    const lockCaption = () => {
      const current = caption.innerHTML;
      caption.style.minHeight = "";
      let tallest = 0;
      list.forEach((fig) => {
        caption.textContent = fig.figure + fig.caption;
        tallest = Math.max(tallest, caption.offsetHeight);
      });
      caption.innerHTML = current;
      caption.style.minHeight = `${tallest}px`;
    };

    show(Math.max(0, list.findIndex((fig) => fig.kind === "r")), { animate: false });
    lockCaption();
    document.fonts?.ready.then(lockCaption);
    let lockTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(lockTimer);
      lockTimer = window.setTimeout(lockCaption, 200);
    }, { passive: true });
    makeCycle(sheetEl, () => show(index + 1), 4000);
  };

  const setupTabs = () => {
    const tabs = [...document.querySelectorAll("[data-scenario-tab]")];
    const panel = document.querySelector("[data-scenario-panel]");
    const svg = document.querySelector("#panel-figure");
    if (!tabs.length || !panel || !svg) return;

    const setText = (selector, value) => {
      const target = document.querySelector(selector);
      if (target) target.textContent = value;
    };

    const sheet = svg.closest(".sheet");
    let activeKey = "r";
    let figIndex = 0;

    const showFigure = (index, { animate = true } = {}) => {
      const list = scenarios[activeKey].figures;
      figIndex = (index + list.length) % list.length;
      const fig = list[figIndex];
      const caption = document.querySelector("[data-scenario-caption]");
      if (caption) {
        const strong = document.createElement("strong");
        strong.textContent = fig.figure;
        caption.replaceChildren(strong, document.createTextNode(fig.caption));
      }
      renderFigure(svg, fig.kind, fig.figure + fig.caption);
      if (!animate) return;
      sheet?.classList.remove("is-swapping");
      if (!reducedMotion.matches) {
        void sheet?.offsetWidth;
        sheet?.classList.add("is-swapping");
      }
      plot(svg);
    };

    const setScenario = (key, { animate = true, fig = 0 } = {}) => {
      const safeKey = Object.prototype.hasOwnProperty.call(scenarios, key) ? key : "r";
      const scenario = scenarios[safeKey];
      activeKey = safeKey;

      tabs.forEach((tab) => {
        const active = tab.dataset.scenarioTab === safeKey;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active) panel.setAttribute("aria-labelledby", tab.id);
      });

      panel.classList.remove("is-swapping");
      if (animate && !reducedMotion.matches) {
        void panel.offsetWidth;
        panel.classList.add("is-swapping");
      }

      setText("[data-scenario-date]", scenario.date);
      setText("[data-scenario-duration]", scenario.duration);
      setText("[data-scenario-title]", scenario.title);
      setText("[data-scenario-description]", scenario.description);

      const list = document.querySelector("[data-scenario-skills]");
      list?.replaceChildren(...scenario.skills.map((skill) => Object.assign(document.createElement("li"), { textContent: skill })));

      figIndex = fig;
      showFigure(fig, { animate: false });
      if (animate) plot(svg);
    };

    // each figure plays for 4s; after a course's last figure the next course tab opens
    const cycle = makeCycle(document.querySelector("#programs .shell"), () => {
      if (figIndex + 1 < scenarios[activeKey].figures.length) {
        showFigure(figIndex + 1);
        return;
      }
      const current = tabs.findIndex((tab) => tab.classList.contains("is-active"));
      setScenario(tabs[(current + 1) % tabs.length].dataset.scenarioTab);
    }, 4000);

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => { setScenario(tab.dataset.scenarioTab); cycle.restart(); });
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        tabs[next].focus();
        setScenario(tabs[next].dataset.scenarioTab);
      });
    });

    const syncHash = () => {
      if (window.location.hash.toLowerCase() === "#course-cea") setScenario("cea");
    };
    window.addEventListener("hashchange", syncHash);

    const lockHeight = () => {
      const active = tabs.find((tab) => tab.classList.contains("is-active"))?.dataset.scenarioTab || "r";
      panel.style.minHeight = "";
      let tallest = 0;
      const activeFig = figIndex;
      scenarioKeys.forEach((key) => {
        scenarios[key].figures.forEach((_, i) => {
          setScenario(key, { animate: false, fig: i });
          tallest = Math.max(tallest, panel.offsetHeight);
        });
      });
      setScenario(active, { animate: false, fig: activeFig });
      panel.style.minHeight = `${tallest}px`;
    };

    setScenario("r", { animate: false });
    syncHash();
    lockHeight();
    document.fonts?.ready.then(lockHeight);
    let lockTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(lockTimer);
      lockTimer = window.setTimeout(lockHeight, 200);
    }, { passive: true });
  };

  /* ---------- particle backdrop ---------- */

  const setupBackdrop = () => {
    const canvas = document.querySelector("#bg-canvas");
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const link = 150;
    const near = 120;
    let width = 1;
    let height = 1;
    let particles = [];
    let frame = 0;

    const count = () => Math.min(90, Math.round((window.innerWidth * window.innerHeight) / 16000));

    const seed = () => {
      particles = Array.from({ length: count() }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.36,
        vy: (Math.random() - 0.5) * 0.36,
        r: Math.random() * 1.3 + 0.7,
      }));
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      seed();
    };

    const draw = () => {
      frame = 0;
      context.clearRect(0, 0, width, height);
      const neighbours = particles.map(() => []);
      particles.forEach((p, i) => {
        if (!reducedMotion.matches) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }
        for (let k = i + 1; k < particles.length; k += 1) {
          const q = particles[k];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d > link) continue;
          context.strokeStyle = `rgba(10, 61, 145, ${0.28 * (1 - d / link)})`;
          context.lineWidth = 0.8;
          context.beginPath();
          context.moveTo(p.x, p.y);
          context.lineTo(q.x, q.y);
          context.stroke();
          if (d < near) { neighbours[i].push(k); neighbours[k].push(i); }
        }
      });
      context.fillStyle = "rgba(10, 61, 145, 0.035)";
      neighbours.forEach((list, i) => {
        for (let a = 0; a < list.length; a += 1) {
          for (let b = a + 1; b < list.length; b += 1) {
            const m = list[a];
            const n = list[b];
            if (i > m || i > n || !neighbours[m].includes(n)) continue;
            context.beginPath();
            context.moveTo(particles[i].x, particles[i].y);
            context.lineTo(particles[m].x, particles[m].y);
            context.lineTo(particles[n].x, particles[n].y);
            context.closePath();
            context.fill();
          }
        }
      });
      context.fillStyle = "rgba(10, 61, 145, 0.6)";
      particles.forEach((p) => {
        context.beginPath();
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fill();
      });
      if (!reducedMotion.matches && !document.hidden) frame = window.requestAnimationFrame(draw);
    };

    const restart = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      draw();
    };

    resize();
    draw();
    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => { resize(); restart(); }, 150);
    }, { passive: true });
    document.addEventListener("visibilitychange", () => { if (!document.hidden && !frame) restart(); });
    reducedMotion.addEventListener?.("change", restart);
  };

  /* ---------- side navigation ---------- */

  const setupSideNav = () => {
    const links = [...document.querySelectorAll("[data-side-target]")];
    const pairs = links.map((link) => ({ link, section: document.getElementById(link.dataset.sideTarget) })).filter(({ section }) => section);
    if (!pairs.length) return;
    const activate = (id) => pairs.forEach(({ link, section }) => {
      const on = section.id === id;
      link.classList.toggle("is-active", on);
      if (on) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    activate("top");
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio).slice(0, 1).forEach((entry) => activate(entry.target.id));
    }, { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.2, 0.5] });
    pairs.forEach(({ section }) => observer.observe(section));
  };

  /* ---------- navigation ---------- */

  const setupMobileNav = () => {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector("#primary-nav");
    const header = document.querySelector(".site-header");
    if (!toggle || !nav || !header) return;

    const close = ({ restoreFocus = false } = {}) => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (restoreFocus) toggle.focus();
    };

    toggle.addEventListener("click", () => {
      if (toggle.getAttribute("aria-expanded") === "true") {
        close({ restoreFocus: true });
        return;
      }
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      nav.querySelector("a")?.focus();
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => close()));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") close({ restoreFocus: true });
    });
    document.addEventListener("click", (event) => {
      if (toggle.getAttribute("aria-expanded") === "true" && !header.contains(event.target)) close();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) close();
    }, { passive: true });
  };

  /* ---------- registration form: three steps, local validation only ---------- */

  const setupForm = () => {
    const form = document.querySelector("#consultation-form");
    const error = document.querySelector("#consultation-error");
    const status = document.querySelector("#consultation-status");
    if (!form || !error || !status) return;

    const steps = [...form.querySelectorAll(".step")];
    const stepperItems = [...document.querySelectorAll("[data-stepper-item]")];
    const stepCount = form.querySelector("[data-step-count]");
    const prevButton = form.querySelector("[data-step-prev]");
    const nextButton = form.querySelector("[data-step-next]");
    const submitButton = form.querySelector("[data-step-submit]");
    const phone = form.elements.namedItem("phoneregister");
    const sourceRadios = [...form.querySelectorAll('input[name="biet_qua"]')];
    const sourceOther = form.elements.namedItem("biet_qua_other");
    const sourceOtherField = sourceOther?.closest(".consultation-other-field") || null;
    let current = 0;
    const endpoint = (form.dataset.endpoint || "").trim();
    const openedAt = Date.now();

    const hints = {
      emailcontact: "Ví dụ: ten@donvi.vn",
      ngay_sinh_ngay: "Ngày sinh không hợp lệ: tháng đã chọn không có ngày này.",
      phoneregister: "Số điện thoại chỉ gồm 9 đến 11 chữ số, có thể cách nhau bằng khoảng trắng hoặc dấu gạch nối",
    };

    const labelOf = (control) => {
      const group = control.closest("fieldset.choice-group");
      const source = group ? group.querySelector("legend") : form.querySelector(`label[for="${control.id}"]`);
      return (source?.textContent || control.getAttribute("aria-label") || control.name).replace(/\*/g, "").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
    };

    const clearFeedback = () => {
      error.hidden = true;
      status.hidden = true;
      error.textContent = "";
      status.replaceChildren();
      form.querySelectorAll(".is-invalid").forEach((item) => {
        item.classList.remove("is-invalid");
        item.removeAttribute("aria-invalid");
      });
    };

    const syncPhoneValidity = () => {
      if (!phone) return;
      const normalized = phone.value.replace(/[\s-]/g, "");
      const valid = !phone.value || (/^(?:\d[\s-]*){9,11}$/.test(phone.value.trim()) && /^\d{9,11}$/.test(normalized));
      phone.setCustomValidity(valid ? "" : hints.phoneregister);
    };

    // three selects for the birth date; reject days the chosen month does not have (31/04, 29/02/1990)
    const birth = ["ngay_sinh_ngay", "ngay_sinh_thang", "ngay_sinh_nam"].map((name) => form.elements.namedItem(name));
    const syncBirthValidity = () => {
      const [day, month, year] = birth;
      if (!day || !month || !year) return;
      const last = new Date(Number(year.value) || 2000, Number(month.value) || 1, 0).getDate();
      day.setCustomValidity(day.value && Number(day.value) > last ? hints.ngay_sinh_ngay : "");
    };
    const birthText = () => (birth.every((select) => select?.value) ? birth.map((select) => select.value).join("/") : "");

    const problemWith = (control) => {
      const label = labelOf(control);
      if (control.validity.valueMissing) {
        const verb = control.matches('input[type="radio"], select, input[type="checkbox"]') ? "chọn" : "nhập";
        return control.type === "checkbox" ? "Vui lòng xác nhận đã đọc và đồng ý với Chính sách bảo mật thông tin của Viện Phương Nam." : `Vui lòng ${verb} “${label}”.`;
      }
      if (control.name === "ngay_sinh_ngay") return hints.ngay_sinh_ngay;
      return `“${label}” chưa đúng định dạng. ${hints[control.name] || ""}`.trim();
    };

    const validateStep = (index) => {
      syncPhoneValidity();
      syncBirthValidity();
      const controls = [...steps[index].querySelectorAll("input, select")].filter((control) => !control.disabled);
      const bad = controls.find((control) => !control.checkValidity());
      if (!bad) return true;
      const mark = bad.type === "radio" ? bad.closest(".choice-group") : bad;
      mark?.classList.add("is-invalid");
      if (bad.type !== "radio") bad.setAttribute("aria-invalid", "true");
      error.textContent = problemWith(bad);
      error.hidden = false;
      bad.focus();
      return false;
    };

    const show = (index, { focus = false } = {}) => {
      current = index;
      steps.forEach((step, i) => { step.hidden = i !== index; });
      stepperItems.forEach((item, i) => {
        item.classList.toggle("is-current", i === index);
        item.classList.toggle("is-done", i < index);
        if (i === index) item.setAttribute("aria-current", "step");
        else item.removeAttribute("aria-current");
      });
      if (stepCount) stepCount.textContent = `Bước ${index + 1} / ${steps.length}`;
      prevButton.hidden = index === 0;
      nextButton.hidden = index === steps.length - 1;
      submitButton.hidden = index !== steps.length - 1;
      if (focus) {
        form.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
        steps[index].querySelector("input:not([disabled]), select")?.focus({ preventScroll: true });
      }
    };

    const syncSourceOther = () => {
      const needsOther = sourceRadios.some((radio) => radio.checked && radio.value === "Khác");
      if (!sourceOther) return;
      sourceOther.required = needsOther;
      sourceOther.disabled = !needsOther;
      sourceOtherField?.toggleAttribute("hidden", !needsOther);
      sourceOtherField?.setAttribute("aria-hidden", String(!needsOther));
    };

    form.addEventListener("input", clearFeedback);
    form.addEventListener("change", (event) => {
      clearFeedback();
      if (event.target?.name === "biet_qua") syncSourceOther();
    });
    let started = false;
    nextButton.addEventListener("click", () => {
      clearFeedback();
      if (!validateStep(current)) return;
      if (!started) {
        started = true;
        track("form_start", { form_id: form.id });
      }
      show(current + 1, { focus: true });
    });
    prevButton.addEventListener("click", () => {
      clearFeedback();
      show(current - 1, { focus: true });
    });
    stepperItems.forEach((item, i) => {
      item.addEventListener("click", () => {
        if (i >= current) return;
        clearFeedback();
        show(i, { focus: true });
      });
    });

    const collect = () => {
      const data = new FormData(form);
      const get = (name) => String(data.get(name) || "").trim();
      const choice = form.querySelector('input[name="goi_dang_ky"]:checked')?.closest(".choice");
      const packageLabel = choice ? `${choice.querySelector("strong").textContent.trim()} (${choice.querySelector("small").textContent.trim()})` : "";
      return {
        package_id: get("goi_dang_ky"), package: packageLabel, ho_lot: get("ho_lot"), ten: get("ten"), emailcontact: get("emailcontact"),
        phoneregister: get("phoneregister"), gioi_tinh: get("gioi_tinh"), ngay_sinh: birthText(), tinh_thanh: get("tinh_thanh"),
        vi_tri: get("vi_tri"), don_vi: get("don_vi"),
        biet_qua: get("biet_qua"), biet_qua_other: get("biet_qua_other"), agreement: form.agreement.checked,
        page: window.location.href.split("#")[0], elapsed: Math.round((Date.now() - openedAt) / 1000), website: get("website"), dot: get("dot"),
      };
    };

    const showMessage = (text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      status.replaceChildren(paragraph);
      status.hidden = false;
      status.focus({ preventScroll: true });
    };

    const send = async () => {
      setSending(submitButton, true);
      form.setAttribute("aria-busy", "true");
      try {
        const payload = withAttribution("dang_ky", collect());
        const response = await fetch(form.dataset.endpoint.trim(), { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!result.ok) throw new Error(result.error || "rejected");
        // A repeat within ten minutes is answered ok but was already counted.
        if (!result.duplicate) trackRegistration(payload);
        form.reset();
        syncSourceOther();
        show(0);
        showMessage("Đã gửi đăng ký thành công. Viện Phương Nam sẽ liên hệ qua điện thoại hoặc email để xác nhận chỗ, gói học và thông tin thanh toán.");
      } catch {
        error.textContent = "Chưa gửi được thông tin đăng ký. Dữ liệu bạn đã nhập vẫn được giữ lại; vui lòng thử lại hoặc gọi (028) 2242 6789 / 0949 761 636.";
        error.hidden = false;
      } finally {
        setSending(submitButton, false);
        form.removeAttribute("aria-busy");
      }
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFeedback();
      for (let i = 0; i < steps.length; i += 1) {
        if (validateStep(i)) continue;
        if (i !== current) show(i);
        const bad = [...steps[i].querySelectorAll("input, select")].find((control) => !control.checkValidity());
        bad?.focus();
        return;
      }
      if ((form.dataset.endpoint || "").trim()) {
        send();
        return;
      }
      showMessage("Thông tin hợp lệ nhưng chưa được gửi đi: trang này chưa kết nối bộ xử lý đăng ký trực tuyến. Vui lòng gọi (028) 2242 6789 hoặc 0949 761 636 để xác nhận chỗ, gói đăng ký và thông tin thanh toán. Dữ liệu bạn đã nhập vẫn được giữ lại trong biểu mẫu.");
    });

    syncSourceOther();
    show(0);
  };

  /* ---------- tuition packages accordion ---------- */

  const setupPackages = () => {
    const items = [...document.querySelectorAll("[data-packages] .pkg")];
    if (!items.length) return;
    const wide = window.matchMedia("(min-width: 1061px)");
    const open = (item) => items.forEach((other) => {
      const on = other === item;
      other.classList.toggle("is-open", on);
      other.querySelector(".pkg-head").setAttribute("aria-expanded", String(on));
    });
    items.forEach((item) => {
      item.querySelector(".pkg-head").addEventListener("click", () => open(item));
      item.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse" && wide.matches) open(item); });
    });
    document.querySelectorAll("[data-pick-package]").forEach((link) => {
      link.addEventListener("click", () => {
        const radio = [...document.querySelectorAll('input[name="goi_dang_ky"]')].find((input) => input.value === link.dataset.pickPackage);
        if (!radio) return;
        radio.checked = true;
        radio.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
  };

  /* ---------- date helpers and expiring offers ---------- */

  // today's calendar date in Vietnam, independent of the visitor's time zone
  const vnToday = () => {
    const [y, m, d] = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).split("-").map(Number);
    return { y, m, d };
  };

  // offers tagged data-expires="YYYY-MM-DD" are struck through and greyed once that day has passed
  const setupExpiry = () => {
    const { y, m, d } = vnToday();
    const today = Date.UTC(y, m - 1, d);
    document.querySelectorAll("[data-expires]").forEach((el) => {
      const [ey, em, ed] = el.dataset.expires.split("-").map(Number);
      if (today <= Date.UTC(ey, em - 1, ed)) return;
      el.classList.add("is-past");
      if (el.textContent.trim()) el.append(Object.assign(document.createElement("span"), { className: "sr-only", textContent: " (đã hết hạn)" }));
    });
    const line = document.querySelector(".timeline");
    if (line?.querySelector(".tl-before.is-past")) line.setAttribute("aria-label", line.getAttribute("aria-label") + ". Mốc ưu đãi 08/12/2026 đã qua");
    if (line?.querySelector(".tl-after.is-past")) line.setAttribute("aria-label", line.getAttribute("aria-label") + ". Hạn chót 28/12/2026 đã qua");
  };

  /* ---------- "today" pointer on the discount timeline ---------- */

  const setupTimelineNow = () => {
    const pointer = document.querySelector("[data-timeline-now]");
    const line = pointer?.closest(".timeline");
    if (!pointer || !line) return;
    // scale runs 01/10/2026 to the 28/12/2026 deadline, matching the bar proportions in CSS
    const start = Date.UTC(2026, 9, 1);
    const end = Date.UTC(2026, 11, 28);
    const { y, m, d } = vnToday();
    const ratio = Math.min(1, Math.max(0, (Date.UTC(y, m - 1, d) - start) / (end - start)));
    const label = [d, m].map((n) => String(n).padStart(2, "0")).join("/") + "/" + y;
    line.style.setProperty("--now", (ratio * 100).toFixed(2) + "%");
    if (ratio < 0.1) pointer.dataset.edge = "start";
    else if (ratio > 0.9) pointer.dataset.edge = "end";
    const time = pointer.querySelector("time");
    time.textContent = label;
    time.dateTime = [y, m, d].map((n) => String(n).padStart(2, "0")).join("-");
    line.setAttribute("aria-label", line.getAttribute("aria-label") + ". Hôm nay là " + label);
    pointer.hidden = false;
  };

  /* ---------- course outline: tabs, lesson accordion ---------- */

  const setupOutline = () => {
    const tabs = [...document.querySelectorAll("[data-outline-tab]")];
    if (!tabs.length) return;
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));
    const select = (index, focus) => {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      if (focus) tabs[index].focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(i));
      tab.addEventListener("keydown", (event) => {
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        select((next + tabs.length) % tabs.length, true);
      });
    });

    const setLesson = (lesson, open) => {
      lesson.classList.toggle("is-open", open);
      lesson.querySelector(".lesson-head").setAttribute("aria-expanded", String(open));
    };
    document.querySelectorAll(".lesson-head").forEach((head) => {
      head.addEventListener("click", () => {
        const lesson = head.closest(".lesson");
        setLesson(lesson, !lesson.classList.contains("is-open"));
        const panel = lesson.closest(".outline-panel");
        const lessons = [...panel.querySelectorAll(".lesson")];
        const all = lessons.every((item) => item.classList.contains("is-open"));
        const toggle = panel.querySelector("[data-outline-toggle]");
        toggle.setAttribute("aria-pressed", String(all));
        toggle.textContent = all ? "Thu gọn tất cả" : "Mở tất cả";
      });
    });
    document.querySelectorAll("[data-outline-toggle]").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const on = toggle.getAttribute("aria-pressed") !== "true";
        toggle.closest(".outline-panel").querySelectorAll(".lesson").forEach((lesson) => setLesson(lesson, on));
        toggle.setAttribute("aria-pressed", String(on));
        toggle.textContent = on ? "Thu gọn tất cả" : "Mở tất cả";
      });
    });
  };

  /* ---------- hero title sparkles: stars pop at random spots around the series name ---------- */

  const setupSparkle = () => {
    if (reducedMotion.matches) return;
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    document.querySelectorAll(".magic-star").forEach((star, index) => {
      const pop = () => {
        star.style.setProperty("--star-left", `${rand(-6, 96)}%`);
        star.style.setProperty("--star-top", `${rand(-30, 70)}%`);
        star.style.animation = "none";
        void star.offsetHeight;
        star.style.animation = "";
      };
      window.setTimeout(() => { pop(); window.setInterval(pop, 1000); }, index * 333);
    });
  };

  /* ---------- copy account number ---------- */

  const setupCopy = () => {
    document.querySelectorAll("[data-copy]").forEach((button) => {
      const note = document.getElementById(button.dataset.copyStatus);
      const label = button.lastChild;
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copy);
          if (note) note.textContent = "Đã sao chép số tài khoản";
          label.textContent = " Đã sao chép";
        } catch {
          if (note) note.textContent = "Không sao chép được, vui lòng chép thủ công";
          label.textContent = " Chép thủ công";
        }
        window.setTimeout(() => { label.textContent = " Sao chép"; }, 2200);
      });
    });
  };

  /* ---------- learner-care chat: questions go to the Apps Script endpoint, which asks the AI model ---------- */

  const setupChat = () => {
    const panel = document.getElementById("chat-panel");
    if (!panel) return;
    const log = panel.querySelector(".chat-log");
    const suggest = panel.querySelector(".chat-suggest");
    const form = panel.querySelector(".chat-form");
    const input = form.querySelector("textarea");
    const sendButton = form.querySelector('button[type="submit"]');
    const title = document.getElementById("chat-title");
    const launcher = document.querySelector(".chat-launcher");
    const openers = [...document.querySelectorAll("[data-chat-open]")];
    const endpoint = (panel.dataset.endpoint || "").trim();
    const compact = window.matchMedia("(max-width: 900px)");
    const STORE = "vpn-chat";
    const PHONES = { "(028) 2242 6789": "02822426789", "0949 761 636": "0949761636", "0912 114 511": "0912114511" };
    const HOSTS = ["vienphuongnam.com.vn", "cran.r-project.org", "posit.co", "zalo.me"];
    const ERRORS = {
      "not-configured": "Trợ lý AI chưa hoạt động. Anh/chị vui lòng gọi (028) 2242 6789, hoặc gọi/Zalo Ms. Vy 0949 761 636, Ms. Thảo 0912 114 511.",
      "rate-limited": "Anh/chị đã hỏi nhiều câu trong giờ này. Vui lòng thử lại vào đầu giờ sau, hoặc gọi (028) 2242 6789.",
      overloaded: "Trợ lý đang nhận quá nhiều câu hỏi. Anh/chị vui lòng thử lại sau, hoặc gọi (028) 2242 6789, gọi/Zalo Ms. Vy 0949 761 636, Ms. Thảo 0912 114 511.",
      unavailable: "Trợ lý AI đang tạm ngừng. Anh/chị vui lòng gọi (028) 2242 6789, hoặc gọi/Zalo Ms. Vy 0949 761 636, Ms. Thảo 0912 114 511.",
      other: "Chưa nhận được câu trả lời. Anh/chị bấm Thử lại, hoặc gọi (028) 2242 6789, gọi/Zalo Ms. Vy 0949 761 636, Ms. Thảo 0912 114 511.",
    };
    const newSession = () => window.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
    const validTurn = (turn, i) => turn && turn.role === (i % 2 ? "assistant" : "user") && typeof turn.content === "string" && turn.content.length > 0;

    let state = null;
    try { state = JSON.parse(window.sessionStorage.getItem(STORE)); } catch { state = null; }
    if (!state || !/^[A-Za-z0-9_-]{8,64}$/.test(state.session || "") || !Array.isArray(state.messages) || !state.messages.every(validTurn)) {
      state = { session: newSession(), messages: [] };
    }
    // a question cut off by a reload has no answer, so it is not resent as history
    if (state.messages.length % 2) state.messages.pop();
    const save = () => {
      try { window.sessionStorage.setItem(STORE, JSON.stringify({ session: state.session, messages: state.messages.slice(-24) })); } catch { /* storage blocked: the chat still works for this page view */ }
    };

    let opener = null;
    let pending = false;
    let rendered = false;

    const inline = (parent, text) => {
      const pattern = /\*\*([^*]+)\*\*|(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)])|(\(028\) 2242 6789|0949 761 636|0912 114 511)|(Đăng ký khóa học)/g;
      let last = 0;
      for (const match of text.matchAll(pattern)) {
        parent.append(text.slice(last, match.index));
        last = match.index + match[0].length;
        if (match[1]) {
          const strong = document.createElement("strong");
          strong.textContent = match[1];
          parent.append(strong);
          continue;
        }
        const link = document.createElement("a");
        link.textContent = match[0];
        if (match[2]) {
          let host = "";
          try { host = new URL(match[2]).hostname.replace(/^www\./, ""); } catch { host = ""; }
          if (!HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
            parent.append(match[2]);
            continue;
          }
          link.href = match[2];
          link.target = "_blank";
          link.rel = "noreferrer";
        } else if (match[3]) {
          link.href = `tel:${PHONES[match[3]]}`;
        } else {
          link.href = "#registration";
          link.dataset.chatJump = "";
        }
        parent.append(link);
      }
      parent.append(text.slice(last));
    };

    // Free models often send one long paragraph, a wall of text on a phone. A long line is set as
    // its first sentence (the answer), then two sentences per paragraph. "Ms. Vy", "TP. Hồ Chí Minh"
    // and "GS.TS." are not sentence ends.
    // a title before a name ("**GS.TS. Nguyễn Văn Tuấn**") is not a sentence end, and a split
    // inside **bold** would leave the markers unpaired
    const ABBR = /(?:^|[\s*("“])(?:GS\.TS|PGS|GS|TS|ThS|BS|Ms|Mr|TP)\.$/;
    const sentences = (line) => {
      const out = [];
      let start = 0;
      for (const match of line.matchAll(/[.!?](?:["”)])?\s+(?=[\p{Lu}\d“"(*])/gu)) {
        const end = match.index + match[0].trimEnd().length;
        if (ABBR.test(line.slice(start, end))) continue;
        if ((line.slice(0, end).match(/\*\*/g) || []).length % 2) continue;
        out.push(line.slice(start, end).trim());
        start = match.index + match[0].length;
      }
      out.push(line.slice(start).trim());
      return out.filter(Boolean);
    };
    const chunks = (line) => {
      if (line.length <= 170) return [line];
      const parts = sentences(line);
      if (parts.length < 2) return [line];
      const out = [parts[0]];
      for (let i = 1; i < parts.length; i += 2) out.push(parts.slice(i, i + 2).join(" "));
      return out;
    };

    // the model writes short paragraphs and "- " lists; everything is set as text, never as HTML
    const renderText = (container, text) => {
      let list = null;
      let paragraph = null;
      text.replace(/\r/g, "").split("\n").forEach((raw) => {
        const line = raw.replace(/^#+\s*/, "").trim();
        if (!line) {
          list = null;
          paragraph = null;
          return;
        }
        const item = line.match(/^(?:[-*•]|(\d+)[.)])\s+(.*)$/);
        if (item) {
          const ordered = Boolean(item[1]);
          if (!list || (list.tagName === "OL") !== ordered) {
            list = document.createElement(ordered ? "ol" : "ul");
            if (ordered && item[1] !== "1") list.start = Number(item[1]);
            container.append(list);
          }
          paragraph = null;
          const li = document.createElement("li");
          inline(li, item[2]);
          list.append(li);
          return;
        }
        list = null;
        const parts = chunks(line);
        if (parts.length > 1) {
          parts.forEach((part) => {
            const block = document.createElement("p");
            inline(block, part);
            container.append(block);
          });
          paragraph = null;
          return;
        }
        if (paragraph) paragraph.append(document.createElement("br"));
        else {
          paragraph = document.createElement("p");
          container.append(paragraph);
        }
        inline(paragraph, line);
      });
    };

    const addMessage = (role, text) => {
      const item = document.createElement("div");
      item.className = `chat-msg chat-msg-${role}`;
      const who = document.createElement("span");
      who.className = "sr-only";
      who.textContent = role === "user" ? "Anh/chị hỏi: " : "Trợ lý trả lời: ";
      if (role === "user") {
        const paragraph = document.createElement("p");
        paragraph.append(who, text);
        item.append(paragraph);
      } else {
        item.append(who);
        renderText(item, text);
      }
      log.append(item);
      return item;
    };

    // An answer is written out in word groups (at most ~3s in all) so the eye follows where it grows; returns when it ends.
    const stream = (item) => {
      const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) if (!walker.currentNode.parentElement.closest(".sr-only")) nodes.push(walker.currentNode);
      const words = nodes.reduce((sum, node) => sum + (node.data.match(/\S+/g) || []).length, 0);
      const size = Math.max(1, Math.ceil(words / 14));
      const chunk = new RegExp(`\\s*\\S+(?:\\s+\\S+){0,${size - 1}}\\s*`, "g");
      let count = 0;
      const spans = nodes.map((node) => {
        const parts = node.data.match(chunk) || [];
        const group = parts.map((part) => {
          const span = document.createElement("span");
          span.className = "chat-token";
          span.textContent = part;
          span.dataset.at = count++;
          return span;
        });
        if (group.length) node.replaceWith(...group);
        return group;
      }).flat();
      const step = Math.min(0.18, 3 / Math.max(count, 1));
      spans.forEach((span) => { span.style.animationDelay = `${(span.dataset.at * step).toFixed(2)}s`; delete span.dataset.at; });
      return count * step + 0.26;
    };

    const toBottom = () => { log.scrollTop = log.scrollHeight; };
    // a long answer opens at its first line rather than its last
    const toStart = (item) => { log.scrollTop = Math.max(0, item.offsetTop - 12); };

    const showError = (code) => {
      const item = document.createElement("div");
      item.className = "chat-msg chat-msg-bot chat-msg-error";
      renderText(item, ERRORS[code] || ERRORS.other);
      // a retry cannot help when the assistant is off, paused for the day or over its shared limit
      if (!["not-configured", "unavailable", "overloaded"].includes(code)) {
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "link-button";
        retry.textContent = "Thử lại";
        retry.addEventListener("click", () => {
          // the button goes with the message; keep focus in the panel, as for the suggestion buttons
          if (item.contains(document.activeElement)) (compact.matches ? log : input).focus({ preventScroll: true });
          item.remove();
          ask();
        });
        item.append(retry);
      }
      log.append(item);
      toBottom();
    };

    const ask = async () => {
      pending = true;
      sendButton.setAttribute("aria-disabled", "true");
      const typing = document.createElement("div");
      typing.className = "chat-msg chat-msg-bot chat-typing";
      typing.innerHTML = 'Đang soạn câu trả lời<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';
      log.append(typing);
      toBottom();
      let reply = "";
      let error = "";
      let options = [];
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 60000);
      try {
        if (!endpoint) throw new Error("not-configured");
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "chat", session: state.session, messages: state.messages.slice(-12), page: window.location.href.split("#")[0] }),
          signal: controller.signal,
        });
        const result = await response.json();
        if (!result.ok || typeof result.reply !== "string" || !result.reply.trim()) throw new Error(result.error || "rejected");
        reply = result.reply.trim();
        if (Array.isArray(result.suggestions)) options = result.suggestions.filter((text) => typeof text === "string" && text.trim()).slice(0, 3);
      } catch (err) {
        error = err.message;
      } finally {
        window.clearTimeout(timer);
      }
      typing.remove();
      pending = false;
      sendButton.removeAttribute("aria-disabled");
      if (reply) {
        state.messages.push({ role: "assistant", content: reply });
        save();
        const item = addMessage("bot", reply);
        const end = stream(item);
        // the closest FAQ questions, when the assistant could not tell which one was meant
        if (options.length) {
          const list = document.createElement("ul");
          list.className = "chat-options";
          options.forEach((text) => {
            const li = document.createElement("li");
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = text.trim();
            button.addEventListener("click", () => submitQuestion(button.textContent));
            li.append(button);
            list.append(li);
          });
          list.style.animation = `swap 0.28s var(--ease) ${end.toFixed(2)}s both`;
          item.append(list);
        }
        toStart(item);
        return;
      }
      // the server refused the history as sent; keep only the open question so a retry can pass
      if (error === "bad-request") state.messages = state.messages.slice(-1);
      // a backend without Chat.gs reads the question as an incomplete registration
      if (error.startsWith("missing-")) error = "not-configured";
      showError(error);
    };

    const autosize = () => {
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight + 2, 132)}px`;
    };

    const submitQuestion = (raw) => {
      const text = raw.trim().slice(0, 1000);
      if (!text || pending) return;
      // a suggestion button is about to be hidden; keep focus in the panel
      const chosen = document.activeElement?.closest?.(".chat-suggest, .chat-options");
      if (chosen && panel.contains(chosen)) (compact.matches ? log : input).focus({ preventScroll: true });
      log.querySelector(".chat-msg-error")?.remove();
      log.querySelectorAll(".chat-options").forEach((list) => list.remove());
      // an unanswered question is replaced by the new one so turns keep alternating
      if (state.messages.length % 2) state.messages.pop();
      state.messages.push({ role: "user", content: text });
      save();
      suggest.hidden = true;
      input.value = "";
      autosize();
      addMessage("user", text);
      toBottom();
      track("chat_question", { question_number: Math.ceil(state.messages.length / 2) });
      ask();
    };

    // full screen below 900px: the page behind is inert and follows the on-screen keyboard
    const fit = () => {
      const view = window.visualViewport;
      if (!panel.hidden && compact.matches && view) {
        panel.style.height = `${view.height}px`;
        panel.style.top = `${view.offsetTop}px`;
      } else {
        panel.style.height = "";
        panel.style.top = "";
      }
    };
    const syncInert = () => {
      const on = !panel.hidden && compact.matches;
      [...document.body.children].forEach((node) => {
        if (node !== panel && node instanceof HTMLElement && node.tagName !== "SCRIPT") node.inert = on;
      });
      fit();
    };

    const CLOSED = "vpn-chat-closed";
    const setOpen = (open, trigger, quiet) => {
      if (open === !panel.hidden) return;
      panel.hidden = !open;
      openers.forEach((button) => button.setAttribute("aria-expanded", String(open)));
      if (launcher) launcher.hidden = open;
      document.documentElement.classList.toggle("chat-open", open);
      syncInert();
      if (!open) {
        // an answer is written out once: a hidden panel shown again restarts its animations, so they come off here
        log.querySelectorAll(".chat-token").forEach((span) => span.replaceWith(span.textContent));
        log.normalize();
        log.querySelectorAll(".chat-options").forEach((list) => { list.style.animation = ""; });
        try { window.sessionStorage.setItem(CLOSED, "1"); } catch { /* storage blocked: it opens again on the next page view */ }
        const inside = panel.contains(document.activeElement) || document.activeElement === document.body;
        if (opener && opener.isConnected && opener.getClientRects().length) opener.focus();
        else if (inside && launcher) launcher.focus();
        opener = null;
        return;
      }
      opener = trigger || null;
      if (!rendered) {
        rendered = true;
        state.messages.forEach((turn) => addMessage(turn.role === "user" ? "user" : "bot", turn.content));
        if (state.messages.length) suggest.hidden = true;
      }
      // a fresh chat opens on the greeting and suggestions, a running one on its latest turn
      if (state.messages.length) toBottom();
      else log.scrollTop = 0;
      // opened by the page itself: the visitor keeps their place and focus
      if (quiet) return;
      // on phones, focusing the field would raise the keyboard over the suggestions
      (compact.matches ? title : input).focus({ preventScroll: true });
      track("chat_open");
    };

    openers.forEach((button) => button.addEventListener("click", () => setOpen(panel.hidden, button)));
    panel.querySelector("[data-chat-close]").addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", (event) => {
      const active = document.activeElement;
      if (event.key === "Escape" && !panel.hidden && (panel.contains(active) || active === document.body)) setOpen(false);
    });
    panel.querySelectorAll("[data-chat-question]").forEach((button) => button.addEventListener("click", () => submitQuestion(button.textContent)));
    log.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!link) return;
      if (link.getAttribute("href").startsWith("tel:")) track("phone_click", { phone_number: link.getAttribute("href").slice(4) }, { name: "Contact" });
      if (link.hasAttribute("data-chat-jump") && compact.matches) {
        opener = null;
        setOpen(false);
      }
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitQuestion(input.value);
    });
    input.addEventListener("input", autosize);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        submitQuestion(input.value);
      }
    });
    compact.addEventListener("change", syncInert);
    window.visualViewport?.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("scroll", fit);

    // Wide screens open on the chat; phones get the floating button, since the panel there covers the page.
    let closedBefore = false;
    try { closedBefore = window.sessionStorage.getItem(CLOSED) === "1"; } catch { closedBefore = false; }
    if (!compact.matches && !closedBefore) setOpen(true, null, true);
  };

  setupBackdrop();
  setupFigures();
  setupHero();
  setupSparkle();
  setupTabs();
  setupPackages();
  setupOutline();
  setupTimelineNow();
  setupExpiry();
  setupSideNav();
  setupMobileNav();
  setupForm();
  setupCopy();
  setupChat();
  setupContact();
  setupTracking();
})();
