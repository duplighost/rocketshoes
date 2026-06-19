// Qualiacology — shared interactions for the dedicated sub-pages (/music/, /toys/).
// A trimmed version of the homepage script: nav scrolled-state, mobile menu, scroll
// progress, scroll-reveal, and runtime email assembly. No homepage-only logic.
(function () {
  const nav = document.getElementById("site-nav");
  const progress = document.querySelector(".scroll-progress");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const revealItems = Array.from(document.querySelectorAll(".reveal"));

  const closeMenu = () => {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  };
  const openMenu = () => {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.add("open");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  };

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeMenu(); else openMenu();
    });
    navLinks.forEach((link) => {
      link.addEventListener("click", () => { if (window.innerWidth < 900) closeMenu(); });
    });
    window.addEventListener("resize", () => { if (window.innerWidth >= 900) closeMenu(); });
  }

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    revealItems.forEach((item, index) => {
      item.style.transitionDelay = Math.min(index % 6, 4) * 45 + "ms";
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add("in-view"));
  }

  const updateNavState = () => {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 10);
    if (progress) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0) + "%";
    }
  };
  updateNavState();
  window.addEventListener("scroll", updateNavState, { passive: true });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  document.addEventListener("click", (e) => {
    const insideNav = e.target.closest(".site-nav");
    if (!insideNav && mobileMenu && mobileMenu.classList.contains("open")) closeMenu();
  });

  // Anti-obfuscation: assemble the email at runtime (matches the homepage footer).
  (function () {
    const full = "alexdguitar" + "@" + "gmail.com";
    const mailto = "mai" + "lto:" + full;
    ["email-btn-1", "email-btn-2"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.href = mailto;
    });
    ["email-text-1", "email-text-2"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = full;
    });
  })();
})();
