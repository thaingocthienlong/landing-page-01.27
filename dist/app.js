(() => {
  const root = document.documentElement;
  root.classList.add("js");

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#primary-nav");
  const header = document.querySelector("[data-header]");

  if (toggle && nav && header) {
    const closeMenu = ({ restoreFocus = false } = {}) => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
      if (restoreFocus) toggle.focus();
    };

    const openMenu = () => {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("menu-open");
      nav.querySelector("a")?.focus();
    };

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeMenu({ restoreFocus: true });
      else openMenu();
    });

    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        closeMenu({ restoreFocus: true });
      }
    });

    document.addEventListener("click", (event) => {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (!header.contains(event.target)) closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760 && toggle.getAttribute("aria-expanded") === "true") closeMenu();
    });
  }

  const courseData = {
    r: {
      title: "R CƠ BẢN",
      description: "Xây nền tảng từ câu hỏi nghiên cứu đến dữ liệu, R code và diễn giải.",
      code: "PTCBR01.27",
      meta: "08—10.01.27 / 03 ngày",
    },
    cea: {
      title: "CHI PHÍ - HIỆU QUẢ",
      description: "Đặt chi phí, hiệu quả và bất định trong cùng một mô hình quyết định y tế.",
      code: "PTHQR01.27",
      meta: "12—13.01.27 / 02 ngày",
    },
    time: {
      title: "CHUỖI THỜI GIAN",
      description: "Đọc tín hiệu phụ thuộc theo thời gian và xây dựng mô hình dự báo bằng R.",
      code: "PTTGR01.27",
      meta: "14—16.01.27 / 03 ngày",
    },
  };

  const navStops = [...document.querySelectorAll("[data-course-nav]")];
  const courses = [...document.querySelectorAll("[data-course]")];
  const activeSignal = document.querySelector("[data-active-signal]");
  const activeDescription = document.querySelector("[data-active-description]");
  const readoutCode = document.querySelector("[data-readout-code]");
  const readoutTitle = document.querySelector("[data-readout-title]");
  const readoutMeta = document.querySelector("[data-readout-meta]");
  let manualActiveUntil = 0;

  const setActiveCourse = (key, { manual = false } = {}) => {
    const course = courseData[key];
    if (!course) return;
    if (manual) manualActiveUntil = window.performance.now() + 1800;
    navStops.forEach((stop) => {
      const active = stop.dataset.courseNav === key;
      stop.classList.toggle("is-active", active);
      if (active) stop.setAttribute("aria-current", "true");
      else stop.removeAttribute("aria-current");
    });
    if (activeSignal) activeSignal.textContent = course.title;
    if (activeDescription) activeDescription.textContent = course.description;
    if (readoutCode) readoutCode.textContent = course.code;
    if (readoutTitle) readoutTitle.textContent = course.title.replace("CHI PHÍ - HIỆU QUẢ", "Chi phí - hiệu quả").replace("CHUỖI THỜI GIAN", "Chuỗi thời gian").replace("R CƠ BẢN", "R cơ bản");
    if (readoutMeta) readoutMeta.textContent = course.meta;
  };

  navStops.forEach((stop) => stop.addEventListener("click", () => setActiveCourse(stop.dataset.courseNav, { manual: true })));

  if ("IntersectionObserver" in window && courses.length) {
    const syncActiveCourse = () => {
      if (window.performance.now() < manualActiveUntil) return;
      const bandTop = window.innerHeight * 0.18;
      const bandBottom = window.innerHeight * 0.66;
      const visible = courses
        .map((course) => ({ course, rect: course.getBoundingClientRect() }))
        .filter(({ rect }) => rect.top < bandBottom && rect.bottom > bandTop)
        .sort((a, b) => Math.abs(a.rect.top - bandTop) - Math.abs(b.rect.top - bandTop));
      if (visible[0]) setActiveCourse(visible[0].course.dataset.course);
    };
    const courseObserver = new IntersectionObserver(() => window.requestAnimationFrame(syncActiveCourse), { rootMargin: "-18% 0px -34% 0px", threshold: [0.15, 0.4, 0.7] });
    courses.forEach((course) => courseObserver.observe(course));
    window.addEventListener("resize", syncActiveCourse, { passive: true });
  }

  const revealItems = [...document.querySelectorAll(".section-intro, .pipeline-nav, .course-overview, .module-list, .timeline-row, .fit-list > div, .discount-grid > div, .faculty-row, .contact-console")];
  if ("IntersectionObserver" in window && revealItems.length) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealItems.forEach((item) => {
      item.classList.add("reveal");
      revealObserver.observe(item);
    });
  }

  const panel = document.querySelector("[data-signal-panel]");
  const signalDot = document.querySelector("[data-signal-dot]");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (panel && signalDot && finePointer.matches && !reducedMotion.matches) {
    let frame = 0;
    let x = 0;
    let y = 0;
    panel.addEventListener("pointermove", (event) => {
      const rect = panel.getBoundingClientRect();
      x = Math.max(14, Math.min(rect.width - 14, event.clientX - rect.left));
      y = Math.max(14, Math.min(rect.height - 14, event.clientY - rect.top));
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        signalDot.style.transform = `translate3d(${x - rect.width * 0.68}px, ${y - rect.height * 0.46}px, 0)`;
        frame = 0;
      });
    });
    panel.addEventListener("pointerleave", () => {
      signalDot.style.transform = "translate3d(0, 0, 0)";
    });
  }
})();
