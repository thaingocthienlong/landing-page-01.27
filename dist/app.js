(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scrollBehavior = () => (reducedMotion.matches ? "auto" : "smooth");

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
      const r = rng(21);
      const n = 260;
      const lambda = 80;
      const pts = Array.from({ length: n }, () => {
        const g1 = gauss(r);
        const g2 = gauss(r);
        return { e: Math.min(0.68, Math.max(-0.08, 0.3 + 0.11 * g1)), c: Math.min(48, Math.max(-8, 20 + 9 * (0.4 * g1 + 0.917 * g2))) };
      });
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
      const r = rng(5);
      const total = 72;
      const train = 60;
      const y = Array.from({ length: total }, (_, t) => 48 + 0.42 * t + 9 * Math.sin((2 * Math.PI * t) / 12 + 0.9) + gauss(r) * 2.4);
      const tm = (train - 1) / 2;
      const sxx = Array.from({ length: train }, (_, t) => (t - tm) ** 2).reduce((s, v) => s + v, 0);
      const yb = mean(y.slice(0, train));
      const b = y.slice(0, train).reduce((s, v, t) => s + (t - tm) * (v - yb), 0) / sxx;
      const a = yb - b * tm;
      const seas = Array.from({ length: 12 }, (_, m) => mean(y.slice(0, train).map((v, t) => (t % 12 === m ? v - a - b * t : null)).filter((v) => v !== null)));
      const fit = (t) => a + b * t + seas[t % 12];
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
  };

  const figureLabels = {
    r: "Biểu đồ phân tán với đường hồi quy tuyến tính và khoảng tin cậy 95%, dữ liệu mô phỏng",
    cea: "Mặt phẳng chi phí - hiệu quả với ICER và ngưỡng sẵn lòng chi trả, dữ liệu mô phỏng",
    time: "Chuỗi thời gian với phần dự báo ngoài mẫu và dải dự báo 80%, dữ liệu mô phỏng",
  };

  const renderFigure = (svg, kind) => {
    const safe = Object.prototype.hasOwnProperty.call(figures, kind) ? kind : "r";
    svg.classList.remove("is-plotted");
    svg.replaceChildren();
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("aria-label", figureLabels[safe]);
    figures[safe](svg);
  };

  const plot = (svg) => {
    void svg.getBoundingClientRect();
    svg.classList.add("is-plotted");
  };

  const setupFigures = () => {
    const svgs = [...document.querySelectorAll("[data-plot]")];
    svgs.forEach((svg) => {
      if (svg.dataset.figure) renderFigure(svg, svg.dataset.figure);
    });
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
      kind: "r",
      date: "Từ 08/01 đến 10/01/2027",
      duration: "03 ngày",
      title: "Xây dựng nền tảng phân tích dữ liệu bằng R.",
      description: "Dành cho nhà nghiên cứu, học viên sau đại học, giảng viên và người mới bắt đầu sử dụng R; không cần kinh nghiệm lập trình.",
      skills: ["Nhập, quản lý, mô tả và hiển thị dữ liệu", "Chọn biểu đồ theo câu hỏi nghiên cứu", "Diễn giải kết quả trong bối cảnh nghiên cứu"],
      figure: "Hình 1.",
      caption: " Hồi quy tuyến tính: đường phù hợp và khoảng tin cậy 95% trên 48 điểm dữ liệu mô phỏng. Dữ liệu minh họa, không phải kết quả nghiên cứu.",
    },
    cea: {
      kind: "cea",
      date: "Ngày 12/01 và 13/01/2027",
      duration: "02 ngày",
      title: "Từ câu hỏi nghiên cứu đến mô hình và từ mô hình đến quyết định.",
      description: "Dành cho nhà quản lý, hoạch định chính sách y tế, bác sĩ, dược sĩ, chuyên viên y tế, nghiên cứu viên y tế và kinh tế y tế, cùng nhân sự dược phẩm và công nghệ y tế.",
      skills: ["Tính và diễn giải ICER/QALY", "Xây dựng cây quyết định hoặc mô hình Markov", "Kiểm tra độ nhạy của các giả định"],
      figure: "Hình 2.",
      caption: " Mặt phẳng chi phí - hiệu quả: 260 lần mô phỏng, ICER và ngưỡng sẵn lòng chi trả. Dữ liệu minh họa, không phải kết quả nghiên cứu.",
    },
    time: {
      kind: "time",
      date: "Từ 15/01 đến 17/01/2027",
      duration: "03 ngày",
      title: "Nhận diện, xây dựng và đánh giá mô hình dự báo chuỗi thời gian.",
      description: "Dành cho nhà nghiên cứu, nghiên cứu sinh, giảng viên và người làm việc với dữ liệu ghi nhận theo thời gian trong y học, y tế công cộng, sinh học, kinh tế, tài chính, môi trường, kỹ thuật, khoa học xã hội và các lĩnh vực liên quan.",
      skills: ["Kiểm tra ACF/ADF và tính dừng", "Xây dựng và so sánh các mô hình dự báo, gồm ARIMA", "Diễn giải độ chính xác dự báo"],
      figure: "Hình 3.",
      caption: " Dự báo chuỗi thời gian: 60 tháng huấn luyện, 12 tháng ngoài mẫu, dải dự báo 80%. Dữ liệu minh họa, không phải kết quả nghiên cứu.",
    },
  };

  const scenarioKeys = Object.keys(scenarios);

  const setupHero = () => {
    const svg = document.querySelector("#hero-figure");
    const caption = document.querySelector("#hero-figure-caption");
    const plateEl = document.querySelector(".hero-plate");
    if (!svg || !caption || !plateEl) return;
    let index = 0;

    const show = (next, { animate = true } = {}) => {
      index = (next + scenarioKeys.length) % scenarioKeys.length;
      const scenario = scenarios[scenarioKeys[index]];
      renderFigure(svg, scenario.kind);
      const strong = document.createElement("strong");
      strong.textContent = scenario.figure;
      caption.replaceChildren(strong, document.createTextNode(scenario.caption));
      if (animate) {
        plateEl.classList.remove("is-swapping");
        if (!reducedMotion.matches) {
          void plateEl.offsetWidth;
          plateEl.classList.add("is-swapping");
        }
        plot(svg);
      }
    };

    makeCycle(plateEl, () => show(index + 1));
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

    const setScenario = (key, { animate = true } = {}) => {
      const safeKey = Object.prototype.hasOwnProperty.call(scenarios, key) ? key : "r";
      const scenario = scenarios[safeKey];

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

      const caption = document.querySelector("[data-scenario-caption]");
      if (caption) {
        const strong = document.createElement("strong");
        strong.textContent = scenario.figure;
        caption.replaceChildren(strong, document.createTextNode(scenario.caption));
      }

      renderFigure(svg, scenario.kind);
      if (animate) plot(svg);
    };

    const cycle = makeCycle(document.querySelector("#programs .shell"), () => {
      const current = tabs.findIndex((tab) => tab.classList.contains("is-active"));
      setScenario(tabs[(current + 1) % tabs.length].dataset.scenarioTab);
    });

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
      scenarioKeys.forEach((key) => {
        setScenario(key, { animate: false });
        tallest = Math.max(tallest, panel.offsetHeight);
      });
      setScenario(active, { animate: false });
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
    const note = document.querySelector("#registration-note");
    if (endpoint) {
      if (note) note.textContent = "Vui lòng để lại thông tin để Viện Phương Nam hỗ trợ xác nhận khóa học, lịch học, ưu đãi và hình thức thanh toán. Thông tin được gửi trực tiếp tới Viện; nếu cần gấp, vui lòng gọi (028) 2242 6789.";
      submitButton.firstChild.textContent = "Gửi đăng ký ";
    }

    const hints = {
      emailcontact: "Ví dụ: ten@donvi.vn",
      ngay_sinh: "Nhập theo dạng ngày/tháng/năm, ví dụ 01/01/1990",
      phoneregister: "Số điện thoại chỉ gồm 9 đến 11 chữ số, có thể cách nhau bằng khoảng trắng hoặc dấu gạch nối",
    };

    const labelOf = (control) => {
      const group = control.closest("fieldset.choice-group");
      const source = group ? group.querySelector("legend") : form.querySelector(`label[for="${control.id}"]`);
      return (source?.textContent || control.name).replace(/\*/g, "").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
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

    const problemWith = (control) => {
      const label = labelOf(control);
      if (control.validity.valueMissing) {
        const verb = control.matches('input[type="radio"], select, input[type="checkbox"]') ? "chọn" : "nhập";
        return control.type === "checkbox" ? "Vui lòng xác nhận đã đọc và đồng ý với Chính sách bảo mật thông tin của Viện Phương Nam." : `Vui lòng ${verb} “${label}”.`;
      }
      return `“${label}” chưa đúng định dạng. ${hints[control.name] || ""}`.trim();
    };

    const validateStep = (index) => {
      syncPhoneValidity();
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
    nextButton.addEventListener("click", () => {
      clearFeedback();
      if (validateStep(current)) show(current + 1, { focus: true });
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
      const course = form.querySelector('input[name="course_id"]:checked')?.closest(".choice")?.querySelector("strong")?.textContent.trim() || "";
      return {
        course_id: get("course_id"), course, ho_lot: get("ho_lot"), ten: get("ten"), emailcontact: get("emailcontact"),
        phoneregister: get("phoneregister"), gioi_tinh: get("gioi_tinh"), ngay_sinh: get("ngay_sinh"), tinh_thanh: get("tinh_thanh"),
        vi_tri: get("vi_tri"), don_vi: get("don_vi"),
        biet_qua: get("biet_qua"), biet_qua_other: get("biet_qua_other"), agreement: form.agreement.checked,
        page: window.location.href.split("#")[0], elapsed: Math.round((Date.now() - openedAt) / 1000), website: get("website"),
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
      submitButton.disabled = true;
      form.setAttribute("aria-busy", "true");
      try {
        const response = await fetch(form.dataset.endpoint.trim(), { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(collect()) });
        const result = await response.json();
        if (!result.ok) throw new Error(result.error || "rejected");
        form.reset();
        syncSourceOther();
        show(0);
        showMessage("Đã gửi đăng ký thành công. Viện Phương Nam sẽ liên hệ qua điện thoại hoặc email để xác nhận chỗ, gói học và thông tin thanh toán. Cần gấp, vui lòng gọi (028) 2242 6789.");
      } catch {
        error.textContent = "Chưa gửi được thông tin đăng ký. Dữ liệu bạn đã nhập vẫn được giữ lại; vui lòng thử lại hoặc gọi (028) 2242 6789 / 0949 761 636.";
        error.hidden = false;
      } finally {
        submitButton.disabled = false;
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

  setupBackdrop();
  setupFigures();
  setupHero();
  setupTabs();
  setupSideNav();
  setupMobileNav();
  setupForm();
  setupCopy();
})();
