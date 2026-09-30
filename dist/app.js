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
      title: "Xây dựng nền tảng phân tích dữ liệu bằng R.",
      description: "Dành cho nhà nghiên cứu, học viên sau đại học, giảng viên và người mới bắt đầu sử dụng R; không cần kinh nghiệm lập trình.",
      prompt: "Nhập, quản lý, hiển thị dữ liệu và lựa chọn phương pháp theo câu hỏi nghiên cứu.",
      outputTitle: "Thực hiện phân tích bằng R và diễn giải kết quả.",
      output: [
        "Nhập, quản lý, mô tả và hiển thị dữ liệu",
        "Hiểu kiểm định giả thuyết, trị số P và khoảng tin cậy",
        "Thực hiện các phân tích so sánh và phân tích mối liên quan",
      ],
      skills: [
        "Nhập, quản lý, mô tả và hiển thị dữ liệu",
        "Chọn biểu đồ theo câu hỏi nghiên cứu",
        "Diễn giải kết quả trong bối cảnh nghiên cứu",
      ],
      codeLines: [
        "library(tidyverse)",
        "data |>",
        "  glimpse() |>",
        "  ggplot(aes(x = group, y = outcome))",
      ],
      windowLabel: "Câu hỏi nghiên cứu",
    },
    cea: {
      label: "Chi phí - hiệu quả",
      code: "PTHQR01.27",
      date: "12–13/01/2027",
      duration: "02 ngày",
      format: "CEA / R",
      topicCount: "08",
      level: "Chuyên sâu",
      title: "Từ câu hỏi nghiên cứu đến mô hình và từ mô hình đến quyết định.",
      description: "Dành cho nhà quản lý, hoạch định chính sách y tế, bác sĩ, dược sĩ, chuyên viên y tế, nghiên cứu viên y tế và kinh tế y tế, cùng nhân sự dược phẩm và công nghệ y tế.",
      prompt: "Từ chi phí và chỉ số lợi ích sức khỏe (utility) đến QALY, ICER và phân tích độ nhạy.",
      outputTitle: "Hiểu cấu trúc nghiên cứu CEA và diễn giải kết quả.",
      output: [
        "Xác định và đo lường chi phí, hiệu quả, chỉ số lợi ích sức khỏe (utility) và QALY",
        "Tính và diễn giải ICER",
        "Xây dựng mô hình Markov và thực hiện phân tích độ nhạy.",
      ],
      skills: [
        "Tính và diễn giải ICER/QALY",
        "Xây dựng cây quyết định hoặc mô hình Markov",
        "Kiểm tra độ nhạy của các giả định",
      ],
      codeLines: [
        "cea <- model |>",
        "  calculate_qaly() |>",
        "  calculate_icer()",
        "plot_sensitivity(cea)",
      ],
      windowLabel: "Câu hỏi kinh tế y tế",
    },
    time: {
      label: "Chuỗi thời gian",
      code: "PTTGR01.27",
      date: "14–16/01/2027",
      duration: "03 ngày",
      format: "R / dự báo",
      topicCount: "08",
      level: "Chuyên sâu",
      title: "Nhận diện, xây dựng và đánh giá mô hình dự báo chuỗi thời gian.",
      description: "Dành cho nhà nghiên cứu, nghiên cứu sinh, giảng viên và người làm việc với dữ liệu ghi nhận theo thời gian trong y học, y tế công cộng, sinh học, kinh tế, tài chính, môi trường, kỹ thuật, khoa học xã hội và các lĩnh vực liên quan.",
      prompt: "Kiểm tra tính dừng, đọc ACF/ADF và so sánh độ chính xác dự báo.",
      outputTitle: "Đánh giá và so sánh các mô hình dự báo.",
      output: [
        "Tổ chức, nhập, hiển thị và khám phá dữ liệu theo thời gian",
        "Đánh giá tính dừng bằng ACF/ADF trước khi chọn mô hình",
        "So sánh độ chính xác dự báo trên dữ liệu ngoài mẫu",
      ],
      skills: [
        "Kiểm tra ACF/ADF và tính dừng",
        "Xây dựng và so sánh các mô hình dự báo, gồm ARIMA",
        "Diễn giải độ chính xác dự báo",
      ],
      codeLines: [
        "fit <- data |>",
        "  model(ARIMA(value))",
        "report(accuracy(fit))",
        "forecast(fit, h = 12)",
      ],
      windowLabel: "Câu hỏi chuỗi thời gian",
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
    setText("[data-scenario-window-title]", `${scenario.label} / Bảng phân tích`);
    setText("[data-scenario-window-label]", scenario.windowLabel);
    setText("[data-scenario-prompt]", scenario.prompt);
    setText("[data-scenario-output-title]", scenario.outputTitle);
    setList("[data-scenario-output]", scenario.output);

    setText("[data-workbench-label]", `Tình huống / ${scenario.label}`);
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
    const dialog = document.querySelector("#consultation-dialog");
    if (!form || !error || !status) return;

    const phone = form.elements.namedItem("phoneregister");
    const sourceRadios = [...form.querySelectorAll('input[name="biet_qua"]')];
    const sourceOther = form.elements.namedItem("biet_qua_other");
    const sourceOtherField = sourceOther?.closest(".consultation-other-field") || null;
    const certificateList = form.querySelector("[data-certificate-list]");
    const addCertificateButton = form.querySelector("[data-add-certificate]");
    let lastTrigger = null;
    let fallbackDialogOpen = false;
    let fallbackInertElements = [];
    const initialCertificateIndexes = [...(certificateList?.querySelectorAll('input[name="cc_loai[]"]') || [])]
      .map((input) => Number((input.id.match(/-(\d+)$/) || [])[1] || 0));
    let nextCertificateIndex = Math.max(0, ...initialCertificateIndexes) + 1;
    const dialogFocusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const syncSourceOther = () => {
      const requiresOther = sourceRadios.some((radio) => radio.checked && radio.value === "Khác");
      if (!sourceOther) return;
      sourceOther.required = requiresOther;
      sourceOther.setAttribute("aria-required", String(requiresOther));
      sourceOther.disabled = !requiresOther;
      sourceOtherField?.toggleAttribute("hidden", !requiresOther);
      sourceOtherField?.setAttribute("aria-hidden", String(!requiresOther));
    };
    const syncCertificateButtons = () => {
      if (!certificateList) return;
      const rows = [...certificateList.querySelectorAll(".certificate-row")];
      rows.forEach((row) => {
        const removeButton = row.querySelector("[data-remove-certificate]");
        if (removeButton) removeButton.hidden = rows.length === 1;
      });
    };
    const addCertificate = () => {
      if (!certificateList) return;
      const firstRow = certificateList.querySelector(".certificate-row");
      if (!firstRow) return;
      const row = firstRow.cloneNode(true);
      const nextIndex = nextCertificateIndex;
      nextCertificateIndex += 1;
      row.querySelectorAll("input").forEach((input) => {
        input.value = "";
      });
      const certificateInput = row.querySelector('input[name="cc_loai[]"]');
      const certificateDateInput = row.querySelector('input[name="cc_ngay[]"]');
      if (certificateInput) certificateInput.id = `consultation-certificate-${nextIndex}`;
      if (certificateDateInput) certificateDateInput.id = `consultation-certificate-date-${nextIndex}`;
      row.querySelector('label[for^="consultation-certificate-date-"]')?.setAttribute("for", `consultation-certificate-date-${nextIndex}`);
      row.querySelector('label[for^="consultation-certificate-"]:not([for*="date"])')?.setAttribute("for", `consultation-certificate-${nextIndex}`);
      const removeButton = row.querySelector("[data-remove-certificate]");
      if (removeButton) removeButton.hidden = false;
      certificateList.append(row);
      syncCertificateButtons();
      row.querySelector("input")?.focus();
    };
    const clearFeedback = () => {
      error.hidden = true;
      status.hidden = true;
      error.textContent = "";
      status.textContent = "";
    };

    const getDialogFocusables = () => [...(dialog?.querySelectorAll(dialogFocusableSelector) || [])]
      .filter((element) => !element.hidden && element.getClientRects().length > 0);

    const setFallbackInert = (isOpen) => {
      if (isOpen) {
        fallbackInertElements = [];
        let current = dialog;
        while (current?.parentElement) {
          const parent = current.parentElement;
          [...parent.children]
            .filter((element) => element !== current && !element.hasAttribute("inert"))
            .forEach((element) => fallbackInertElements.push(element));
          if (parent === document.body) break;
          current = parent;
        }
        fallbackInertElements.forEach((element) => element.setAttribute("inert", ""));
        return;
      }
      fallbackInertElements.forEach((element) => element.removeAttribute("inert"));
      fallbackInertElements = [];
    };

    const closeDialog = () => {
      if (!dialog) return;
      if (typeof dialog.close === "function" && dialog.open && !fallbackDialogOpen) {
        dialog.close();
        return;
      }
      dialog.removeAttribute("open");
      dialog.classList.remove("is-fallback-open");
      document.body.classList.remove("dialog-open");
      setFallbackInert(false);
      fallbackDialogOpen = false;
      lastTrigger?.focus();
    };

    document.querySelectorAll("[data-open-consultation]").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        if (trigger.matches("a")) event.preventDefault();
        lastTrigger = trigger;
        clearFeedback();
        if (typeof dialog?.showModal === "function") {
          dialog.showModal();
        } else if (dialog) {
          fallbackDialogOpen = true;
          dialog.classList.add("is-fallback-open");
          dialog.setAttribute("open", "");
          document.body.classList.add("dialog-open");
          setFallbackInert(true);
        }
        window.requestAnimationFrame(() => form.querySelector("input, select, button")?.focus());
      });
    });
    dialog?.querySelector("[data-close-consultation]")?.addEventListener("click", closeDialog);
    dialog?.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && fallbackDialogOpen) {
        event.preventDefault();
        closeDialog();
        return;
      }
      if (event.key !== "Tab" || !fallbackDialogOpen) return;
      const focusables = getDialogFocusables();
      if (!focusables.length) return;
      const currentIndex = focusables.indexOf(document.activeElement);
      if (event.shiftKey && (currentIndex <= 0 || currentIndex === -1)) {
        event.preventDefault();
        focusables[focusables.length - 1].focus();
      } else if (!event.shiftKey && (currentIndex === focusables.length - 1 || currentIndex === -1)) {
        event.preventDefault();
        focusables[0].focus();
      }
    });
    dialog?.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
      setFallbackInert(false);
      fallbackDialogOpen = false;
      lastTrigger?.focus();
    });
    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });

    form.addEventListener("input", clearFeedback);
    form.addEventListener("change", (event) => {
      clearFeedback();
      if (event.target?.name === "biet_qua") syncSourceOther();
    });
    addCertificateButton?.addEventListener("click", addCertificate);
    certificateList?.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-remove-certificate]");
      if (!removeButton) return;
      const rows = certificateList.querySelectorAll(".certificate-row");
      if (rows.length <= 1) return;
      removeButton.closest(".certificate-row")?.remove();
      syncCertificateButtons();
    });
    syncSourceOther();
    syncCertificateButtons();
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFeedback();

      if (phone) {
        const normalizedPhone = phone.value.replace(/[\s-]/g, "");
        const phoneGrammar = /^(?:\d[\s-]*){9,11}$/;
        const isValidPhone = !phone.value || (phoneGrammar.test(phone.value.trim()) && /^\d{9,11}$/.test(normalizedPhone));
        phone.setCustomValidity(isValidPhone ? "" : "Số điện thoại chỉ được gồm 9 đến 11 chữ số, có thể cách nhau bằng khoảng trắng hoặc dấu gạch nối.");
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        error.textContent = "Vui lòng kiểm tra các trường bắt buộc và số điện thoại trước khi tiếp tục.";
        error.hidden = false;
        form.querySelector(":invalid")?.focus();
        return;
      }

      if (phone) phone.setCustomValidity("");
      status.textContent = "Trang giới thiệu hiện chưa kết nối bộ xử lý đăng ký trực tuyến. Vui lòng gọi (028) 2242 6789 hoặc 0949 761 636 để xác nhận chỗ, tổ hợp khóa và thông tin thanh toán. Dữ liệu bạn đã nhập vẫn được giữ lại trong biểu mẫu.";
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
