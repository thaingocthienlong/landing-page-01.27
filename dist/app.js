(() => {
  const root = document.documentElement;
  root.classList.add("js");

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#primary-nav");
  const header = document.querySelector("[data-header]");
  if (!toggle || !nav) return;

  let lastFocused = null;

  const closeMenu = ({ restoreFocus = false } = {}) => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    if (restoreFocus) toggle.focus();
  };

  const openMenu = () => {
    lastFocused = document.activeElement;
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

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      closeMenu({ restoreFocus: true });
    }
  });

  document.addEventListener("click", (event) => {
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    if (!header.contains(event.target)) closeMenu({ restoreFocus: false });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 680 && toggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    }
  });

  const currentYear = new Date().getFullYear();
  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(currentYear);
  });
})();
