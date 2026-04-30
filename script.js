const header = document.querySelector("[data-header]");
const modal = document.querySelector("[data-project-modal]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalCopy = document.querySelector("[data-modal-copy]");
const modalKicker = document.querySelector("[data-modal-kicker]");
const modalStats = Array.from(
  document.querySelectorAll(
    "[data-modal-stat], [data-modal-stat-one], [data-modal-stat-two], [data-modal-stat-three]"
  )
);
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const copyEmailButton = document.querySelector("[data-copy-email]");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
const projectCards = Array.from(document.querySelectorAll(".lineup-card[data-category]"));
const navLinks = Array.from(
  document.querySelectorAll(
    [
      '.site-nav a[href^="#"]',
      '.global-nav a[href^="#"]',
      '[data-header] a[href^="#"]',
    ].join(", ")
  )
);
const revealTargets = Array.from(
  document.querySelectorAll(
    [
      "[data-reveal]",
      ".category-hero",
      ".lineup-card",
      ".benefit-card",
      ".feature-card",
      ".mini-card",
      ".note-card",
      ".contact-panel",
      ".site-footer",
    ].join(", ")
  )
);

let lastFocusedElement = null;
let copyEmailResetTimer = null;

const projects = {
  landmark: {
    kicker: "Brand & Product",
    title: "Landmark",
    copy:
      "A calm finance presence built around trust, product clarity, and a modular visual system that stretches from launch page to dashboard.",
    stats: ["Launch story", "Design system", "Product UI"],
  },
  circleback: {
    kicker: "AI Workflow",
    title: "Circleback",
    copy:
      "A workflow surface for busy teams: cleaner meeting context, faster follow-ups, and an interface that makes automation feel accountable.",
    stats: ["AI UX", "Task flows", "Prototype"],
  },
  sands: {
    kicker: "Interactive Story",
    title: "Secrets of Sands",
    copy:
      "A cinematic web experience with layered motion, immersive art direction, and a reading flow tuned for curiosity instead of noise.",
    stats: ["Motion", "Story UI", "Art direction"],
  },
  metric: {
    kicker: "Dashboard",
    title: "Metric",
    copy:
      "A lighter analytics dashboard that turns dense business signals into scan-friendly cards, charts, and quick decisions.",
    stats: ["Data design", "UI kit", "Responsive"],
  },
};

const parseProjectStats = (stats = "") =>
  stats
    .split("|")
    .map((stat) => stat.trim())
    .filter(Boolean);

const getProjectDetails = (trigger) => {
  const card = trigger.closest(".lineup-card");
  const source = trigger.dataset.projectTitle ? trigger : card || trigger;
  const fallbackProject = projects[trigger.dataset.project] || {};
  const stats = parseProjectStats(source.dataset.projectStats || "");
  const title =
    source.dataset.projectTitle ||
    fallbackProject.title ||
    card?.querySelector("h3")?.textContent.trim() ||
    trigger.textContent.trim();

  return {
    kicker: source.dataset.projectKicker || fallbackProject.kicker || "",
    title,
    copy: source.dataset.projectCopy || fallbackProject.copy || "",
    stats: stats.length ? stats : fallbackProject.stats || [],
  };
};

const writeClipboardText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.top = "0";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();

  try {
    return document.execCommand("copy");
  } finally {
    field.remove();
  }
};

const getLinkHash = (link) => {
  const href = link.getAttribute("href");

  return href && href.startsWith("#") && href.length > 1 ? href : "";
};

const getTargetFromHash = (hash) => {
  if (!hash || hash.length <= 1) {
    return null;
  }

  const id = hash.slice(1);
  const target = document.getElementById(id);

  if (target) {
    return target;
  }

  try {
    return document.getElementById(decodeURIComponent(id));
  } catch {
    return null;
  }
};

const navSections = Array.from(
  new Set(navLinks.map((link) => getTargetFromHash(getLinkHash(link))).filter(Boolean))
);

const setText = (element, text = "") => {
  if (element) {
    element.textContent = text;
  }
};

const focusElement = (element) => {
  if (!element || typeof element.focus !== "function") {
    return;
  }

  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }
};

const getFocusableModalElements = () => {
  if (!modal) {
    return [];
  }

  return Array.from(
    modal.querySelectorAll(
      [
        'a[href]',
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        '[tabindex]:not([tabindex="-1"])',
      ].join(", ")
    )
  );
};

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

const setActiveNav = (hash = window.location.hash || "#top") => {
  const activeHash = hash || "#top";

  navLinks.forEach((link) => {
    const isActive = getLinkHash(link) === activeHash;
    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const updateActiveNavFromScroll = () => {
  if (!navSections.length) {
    setActiveNav();
    return;
  }

  const firstSection = document.getElementById("work") || navSections[0];
  const position = window.scrollY + window.innerHeight * 0.34;

  if (firstSection && position < firstSection.offsetTop) {
    setActiveNav("#top");
    return;
  }

  const currentSection = navSections.reduce((current, section) => {
    if (section.offsetTop <= position) {
      return section;
    }

    return current;
  }, navSections[0]);

  setActiveNav(currentSection ? `#${currentSection.id}` : "#top");
};

const applyFilter = (filter) => {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  projectCards.forEach((card) => {
    const categories = (card.dataset.category || "").split(/\s+/);
    const isVisible = filter === "all" || categories.includes(filter);
    card.classList.toggle("is-hidden", !isVisible);
  });
};

window.addEventListener(
  "scroll",
  () => {
    updateHeader();
    updateActiveNavFromScroll();
  },
  { passive: true }
);
window.addEventListener("hashchange", () => window.setTimeout(updateActiveNavFromScroll, 80));
navLinks.forEach((link) => {
  link.addEventListener("click", () => setActiveNav(getLinkHash(link)));
});
updateHeader();
updateActiveNavFromScroll();

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyFilter(button.dataset.filter || "all");
  });
});

revealTargets.forEach((target) => {
  target.classList.add("reveal");
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -9% 0px", threshold: 0.1 }
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}

document.querySelectorAll("[data-project]").forEach((button) => {
  button.addEventListener("click", () => {
    const project = getProjectDetails(button);

    if (!modal || !project.title) {
      return;
    }

    setText(modalKicker, project.kicker);
    setText(modalTitle, project.title);
    setText(modalCopy, project.copy);
    modalStats.forEach((stat, index) => {
      setText(stat, project.stats[index] || "");
    });
    lastFocusedElement = button;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    const firstModalControl =
      modal.querySelector(".modal-close, button[data-close-modal]") ||
      getFocusableModalElements()[0];

    window.requestAnimationFrame(() => focusElement(firstModalControl));
  });
});

const closeModal = () => {
  if (!modal || modal.hidden) {
    return;
  }

  modal.hidden = true;
  document.body.classList.remove("modal-open");

  if (lastFocusedElement?.isConnected) {
    focusElement(lastFocusedElement);
  }

  lastFocusedElement = null;
};

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

modal?.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  if (target.closest("[data-modal-panel], .modal-panel")) {
    return;
  }

  if (target === modal || target.closest("[data-modal-backdrop], .modal-backdrop")) {
    closeModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
    return;
  }

  if (event.key !== "Tab" || !modal || modal.hidden) {
    return;
  }

  const focusableElements = getFocusableModalElements();

  if (!focusableElements.length) {
    return;
  }

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  if (!modal.contains(document.activeElement)) {
    event.preventDefault();
    focusElement(firstFocusable);
  } else if (event.shiftKey && document.activeElement === firstFocusable) {
    event.preventDefault();
    focusElement(lastFocusable);
  } else if (!event.shiftKey && document.activeElement === lastFocusable) {
    event.preventDefault();
    focusElement(firstFocusable);
  }
});

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  setText(formStatus, "Nice - your project draft is ready.");
  contactForm.reset();
});

copyEmailButton?.addEventListener("click", async () => {
  const email = copyEmailButton.dataset.copyEmail;
  const defaultLabel = copyEmailButton.textContent.trim() || `Copy ${email}`;

  if (!email) {
    return;
  }

  window.clearTimeout(copyEmailResetTimer);
  copyEmailButton.textContent = "Copied email";

  writeClipboardText(email).catch(() => {
    copyEmailButton.textContent = email;
  });

  copyEmailResetTimer = window.setTimeout(() => {
    copyEmailButton.textContent = defaultLabel;
  }, 1800);
});
