(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

  const revealFailSafe = () => document.querySelectorAll("[data-reveal]").forEach((item) => item.classList.add("is-revealed"));
  window.addEventListener("error", revealFailSafe, { once: true });
  window.addEventListener("unhandledrejection", revealFailSafe, { once: true });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const scenarios = {
    r: {
      label: "R cơ bản",
      code: "PTCBR01.27",
      date: "08–10/01/2027",
      duration: "03 ngày",
      format: "R / RStudio",
      topicCount: "07",
      level: "Nền tảng",
      title: "Đặt nền tảng để tự tin làm việc với dữ liệu.",
      description: "Khóa học cho nhà nghiên cứu, nghiên cứu sinh, giảng viên và người mới R; không cần kinh nghiệm lập trình trước đó.",
      prompt: "Chuẩn bị dữ liệu, chọn biểu đồ và kiểm tra mối liên quan bằng R.",
      outputTitle: "Quy trình phân tích sẵn sàng để kiểm tra.",
      output: [
        "Nhập và kiểm tra cấu trúc dữ liệu",
        "Chọn biểu đồ theo câu hỏi nghiên cứu",
        "Diễn giải output cùng bối cảnh",
      ],
      skills: [
        "Nhập, quản lý và mô tả dữ liệu",
        "Hiển thị dữ liệu theo câu hỏi",
        "Kiểm định, hồi quy và diễn giải",
      ],
      codeLines: [
        "library(tidyverse)",
        "data |>",
        "  glimpse() |>",
        "  ggplot(aes(x = group, y = outcome))",
      ],
      windowLabel: "Research question",
    },
    cea: {
      label: "Chi phí - hiệu quả",
      code: "PTHQR01.27",
      date: "12–13/01/2027",
      duration: "02 ngày",
      format: "CEA / R",
      topicCount: "08",
      level: "Chuyên sâu",
      title: "Đọc bài toán kinh tế y tế bằng một mô hình có thể giải thích.",
      description: "Dành cho người làm chính sách y tế, chuyên môn y tế, nghiên cứu y tế - kinh tế, dược phẩm, công nghệ y tế và HTA.",
      prompt: "Từ chi phí và utility, tính QALY, ICER và kiểm tra bất định của quyết định.",
      outputTitle: "Một khung CEA để đọc và kiểm tra.",
      output: [
        "Tách chi phí, utility và QALY",
        "Tính và diễn giải ICER",
        "Kiểm tra sensitivity và mô hình Markov",
      ],
      skills: [
        "Tính và diễn giải ICER/QALY",
        "Xây dựng decision tree hoặc Markov model",
        "Kiểm tra độ nhạy của giả định",
      ],
      codeLines: [
        "cea <- model |>",
        "  calculate_qaly() |>",
        "  calculate_icer()",
        "plot_sensitivity(cea)",
      ],
      windowLabel: "Health economics question",
    },
    time: {
      label: "Chuỗi thời gian",
      code: "PTTGR01.27",
      date: "14–16/01/2027",
      duration: "03 ngày",
      format: "R / forecast",
      topicCount: "08",
      level: "Chuyên sâu",
      title: "Biến dữ liệu theo thời gian thành một dự báo có căn cứ.",
      description: "Dành cho người làm dữ liệu theo thời gian trong y học, y tế công cộng, sinh học, kinh tế, tài chính, môi trường, kỹ thuật và khoa học xã hội.",
      prompt: "Kiểm tra tính dừng, đọc ACF/ADF và so sánh độ chính xác của forecast.",
      outputTitle: "Quy trình dự báo có thể so sánh.",
      output: [
        "Tạo time index và kiểm tra tín hiệu",
        "Đọc ACF/ADF trước khi chọn mô hình",
        "So sánh forecast accuracy ngoài mẫu",
      ],
      skills: [
        "Kiểm tra ACF/ADF và tính dừng",
        "Xây dựng và so sánh mô hình ARIMA",
        "Diễn giải forecast accuracy",
      ],
      codeLines: [
        "fit <- data |>",
        "  model(ARIMA(value))",
        "report(accuracy(fit))",
        "forecast(fit, h = 12)",
      ],
      windowLabel: "Time-series question",
    },
  };

  const tabs = [...document.querySelectorAll("[data-scenario-tab]")];
  const panel = document.querySelector("[data-scenario-panel]");
  let activeScenario = "r";

  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };

  const setList = (selector, values) => {
    const list = document.querySelector(selector);
    if (!list) return;
    list.replaceChildren(...values.map((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      return item;
    }));
  };

  const setWorkbenchNav = (key) => {
    document.querySelectorAll("[data-workbench-nav]").forEach((button) => {
      const isActive = button.dataset.workbenchNav === key;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  };

  const setScenario = (key) => {
    const safeKey = Object.prototype.hasOwnProperty.call(scenarios, key) ? key : "r";
    const scenario = scenarios[safeKey];
    activeScenario = safeKey;

    tabs.forEach((tab) => {
      const isActive = tab.dataset.scenarioTab === safeKey;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.setAttribute("aria-controls", panel?.id || "scenario-panel");
      tab.tabIndex = isActive ? 0 : -1;
    });

    if (panel) {
      const activeTab = document.querySelector(`[data-scenario-tab="${safeKey}"]`);
      panel.setAttribute("aria-labelledby", activeTab?.id || `tab-${safeKey}`);
      panel.classList.remove("is-swapping");
      if (!reducedMotion.matches) {
        void panel.offsetWidth;
        panel.classList.add("is-swapping");
      }
    }

    setText("[data-scenario-kicker]", `${scenario.code} · ${scenario.date} · ${scenario.duration}`);
    setText("[data-scenario-title]", scenario.title);
    setText("[data-scenario-description]", scenario.description);
    setText("[data-scenario-format]", scenario.format);
    setText("[data-scenario-topic-count]", scenario.topicCount);
    setText("[data-scenario-level]", scenario.level);
    setList("[data-scenario-skills]", scenario.skills);
    setText("[data-scenario-window-title]", `${scenario.label} / Analysis workspace`);
    setText("[data-scenario-window-label]", scenario.windowLabel);
    setText("[data-scenario-prompt]", scenario.prompt);
    setText("[data-scenario-output-title]", scenario.outputTitle);
    setList("[data-scenario-output]", scenario.output);

    setText("[data-workbench-label]", `Scenario / ${scenario.label}`);
    setText("[data-workbench-prompt]", scenario.prompt);
    setText("[data-workbench-code]", scenario.codeLines.join("\n"));
    setList("[data-workbench-output]", scenario.output);

    setWorkbenchNav(safeKey);
  };

  const setupScenarioTabs = () => {
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => setScenario(tab.dataset.scenarioTab));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let nextIndex = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        tabs[nextIndex].focus();
        setScenario(tabs[nextIndex].dataset.scenarioTab);
      });
    });
  };

  const setupWorkbenchNav = () => {
    document.querySelectorAll("[data-workbench-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.workbenchNav;
        if (key === "overview") {
          setWorkbenchNav("overview");
          document.querySelector("#top")?.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
          return;
        }
        if (key === "schedule") {
          setWorkbenchNav("schedule");
          document.querySelector("#schedule")?.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
          return;
        }
        setScenario(key);
        document.querySelector("#programs")?.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
      });
    });
  };

  const setupMobileNav = () => {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector("#primary-nav");
    const header = document.querySelector(".site-header");
    if (!toggle || !nav || !header) return;

    const closeMenu = ({ restoreFocus = false } = {}) => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
      if (restoreFocus) toggle.focus();
    };

    toggle.addEventListener("click", () => {
      if (toggle.getAttribute("aria-expanded") === "true") {
        closeMenu({ restoreFocus: true });
        return;
      }
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("menu-open");
      nav.querySelector("a")?.focus();
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") closeMenu({ restoreFocus: true });
    });
    document.addEventListener("click", (event) => {
      if (toggle.getAttribute("aria-expanded") !== "true" || header.contains(event.target)) return;
      closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeMenu();
    }, { passive: true });
  };

  const setupRevealObserver = () => {
    const items = [...document.querySelectorAll("[data-reveal]")];
    if (!items.length) return;
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-revealed"));
      return;
    }
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        currentObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((item) => observer.observe(item));
  };

  const setupBackToTop = () => {
    const button = document.querySelector("[data-back-top]");
    if (!button) return;
    const sync = () => button.classList.toggle("is-visible", window.scrollY > 520);
    window.addEventListener("scroll", sync, { passive: true });
    sync();
    button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" }));
  };

  const setupConsultationForm = () => {
    const form = document.querySelector("#consultation-form");
    const error = document.querySelector("#consultation-error");
    const status = document.querySelector("#consultation-status");
    if (!form || !error || !status) return;

    const phone = form.elements.namedItem("phone");
    const clearFeedback = () => {
      error.hidden = true;
      status.hidden = true;
      error.textContent = "";
      status.textContent = "";
    };

    form.addEventListener("input", clearFeedback);
    form.addEventListener("change", clearFeedback);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFeedback();

      if (phone) {
      const normalizedPhone = phone.value.replace(/[\s\-]/g, "");
        phone.setCustomValidity(
          normalizedPhone.length >= 9 && normalizedPhone.length <= 11 && /^\d+$/.test(normalizedPhone)
            ? ""
            : "Số điện thoại cần có từ 9 đến 11 chữ số."
        );
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        error.textContent = "Vui lòng kiểm tra các trường bắt buộc và số điện thoại trước khi tiếp tục.";
        error.hidden = false;
        form.querySelector(":invalid")?.focus();
        return;
      }

      if (phone) phone.setCustomValidity("");
      status.textContent = "Trang giới thiệu chưa kết nối bộ xử lý đăng ký trực tuyến. Vui lòng gọi (028) 2242 6789 để xác nhận chỗ, tổ hợp khóa và thông tin thanh toán.";
      status.hidden = false;
      status.focus();
    });
  };

  const setupHashState = () => {
    const syncHash = () => {
      if (window.location.hash.toLowerCase() === "#course-cea") setScenario("cea");
    };
    window.addEventListener("hashchange", syncHash);
    syncHash();
  };

  setupScenarioTabs();
  setupWorkbenchNav();
  setupMobileNav();
  setupRevealObserver();
  setupBackToTop();
  setupConsultationForm();
  setupHashState();
  setScenario(activeScenario);
})();
