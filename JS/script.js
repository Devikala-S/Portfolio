// Theme Management - optimized to prevent layout thrashing
let themeInitialized = false;

const getPreferredTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    return savedTheme;
  }
  // Default to light theme instead of following system preference
  return "light";
};

const setTheme = (theme) => {
  // Batch DOM updates to prevent multiple reflows
  requestAnimationFrame(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    // Update theme icons visibility (JS backup for CSS)
    const lightIcon = document.querySelector(".light-icon");
    const darkIcon = document.querySelector(".dark-icon");
    if (lightIcon && darkIcon) {
      lightIcon.style.display = theme === "dark" ? "none" : "block";
      darkIcon.style.display = theme === "light" ? "none" : "block";
    }
  });
};

// Initialize theme immediately to prevent FOUC
const initialTheme = getPreferredTheme();
document.documentElement.setAttribute("data-theme", initialTheme);
localStorage.setItem("theme", initialTheme);

// Update theme icons visibility (JS backup for CSS)
const lightIcon = document.querySelector(".light-icon");
const darkIcon = document.querySelector(".dark-icon");
if (lightIcon && darkIcon) {
  lightIcon.style.display = initialTheme === "dark" ? "none" : "block";
  darkIcon.style.display = initialTheme === "light" ? "none" : "block";
}
themeInitialized = true;

// Watch for system theme changes - optimized
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
mediaQuery.addEventListener("change", (e) => {
  if (!localStorage.getItem("theme") || !themeInitialized) {
    setTheme(e.matches ? "dark" : "light");
  }
});

// Responsive navigation menu toggle
const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

if (menuBtn && navLinks) {
  // Use requestAnimationFrame to batch DOM updates and avoid forced reflow
  const toggleMenu = (isOpen) => {
    requestAnimationFrame(() => {
      menuBtn.setAttribute("aria-expanded", isOpen);
      if (isOpen) {
        navLinks.classList.add("active");
      } else {
        navLinks.classList.remove("active");
      }
    });
  };

  menuBtn.addEventListener("click", () => {
    const expanded = menuBtn.getAttribute("aria-expanded") === "true";
    toggleMenu(!expanded);
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      toggleMenu(false);
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".navbar")) {
      toggleMenu(false);
    }
  });
}

// Theme toggle functionality - optimized
const themeToggle = document.querySelector(".theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
  });
}

// Performance monitoring (optional - remove in production)
if (typeof PerformanceObserver !== "undefined") {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === "measure") {
        console.log(`${entry.name}: ${entry.duration}ms`);
      }
    }
  });
  observer.observe({ entryTypes: ["measure"] });
}
