// display.js - Enhanced dynamic portfolio loader for new sections
// Handles About, Resume, Connections, Certifications, Contact form

async function loadDynamicContent() {
  try {
    const response = await fetch("./Config/display.json");
    if (!response.ok) throw new Error("Failed to load display.json");

    const data = await response.json();

    // -----------------------------
    // About/Hero
    // -----------------------------
    const heroContent = document.getElementById("hero-content");
    if (heroContent && data.hero) {
      heroContent.innerHTML = `
        ${
          data.hero.profileImage
            ? `
        <div class="hero-profile">
          <img src="${data.hero.profileImage}" alt="${data.hero.name}" loading="eager" />
        </div>
        `
            : ""
        }
        <h1>Hi, I'm <span class="accent">${data.hero.name}</span></h1>
        <p class="hero-description">
          <strong>${data.hero.title}</strong><br />
          ${data.hero.description}
        </p>
      `;
      const interestsEl = document.getElementById("about-interests");
      if (interestsEl && data.hero.interests) {
        interestsEl.innerHTML = `<h3>Interests</h3><ul>${data.hero.interests.map((i) => `<li>${i}</li>`).join("")}</ul>`;
      }
    }

    // -----------------------------
    // Social links
    // -----------------------------
    const heroSocial = document.getElementById("hero-social");
    if (heroSocial && Array.isArray(data.social)) {
      heroSocial.innerHTML = "";

      data.social.forEach((link) => {
        const li = document.createElement("li");
        const a = document.createElement("a");

        a.href = link.href;
        a.target = link.href.startsWith("mailto:") ? "_self" : "_blank";
        a.rel = link.href.startsWith("mailto:") ? "" : "noopener";
        a.setAttribute("aria-label", link.label);

        if (link.href.startsWith("tel:")) {
          a.addEventListener("click", (e) => {
            e.preventDefault();
            const phone = link.href.replace("tel:", "");
            if (confirm(`Call ${phone}? Choose app:`)) {
              window.location.href = link.href;
            }
          });
        }

        a.innerHTML = `<i class="${link.icon}"></i>`;
        li.appendChild(a);
        heroSocial.appendChild(li);
      });
    }

    // -----------------------------
    // Resume
    // -----------------------------
    if (data.resume) {
      // Education
      const eduEl = document.getElementById("resume-education");
      if (eduEl && data.resume.education) {
        eduEl.innerHTML = `<h3>Education</h3>${data.resume.education.map((e) => `<div class="timeline-item"><h4>${e.name} - ${e.inst}</h4><span>${e.dates}</span><p>${e.percentage}</p></div>`).join("")}`;
      }

      // Experience + Resume Image
      const expEl = document.getElementById("resume-experience");
      if (expEl && data.resume.experience) {
        expEl.innerHTML = `
          <h3>Experience</h3>
          ${data.resume.experience.map((x) => `
            <div class="timeline-item">
              <h4>${x.role} @ ${x.company}</h4>
              <span>${x.dates}</span>
              <p>${x.desc}</p>
            </div>
          `).join("")}

          ${
  data.resume.pdfUrl
    ? `
  <div style="margin-top:30px; text-align:center;">
    <a href="${data.resume.pdfUrl}" target="_blank" rel="noopener" style="text-decoration:none;">
      
      <div style="
        position:relative;
        display:inline-block;
        border-radius:20px;
        overflow:hidden;
      "
      onmouseenter="this.querySelector('.resume-img').style.filter='blur(1px)';
                    this.querySelector('.resume-overlay').style.opacity='0.3';"
      onmouseleave="this.querySelector('.resume-img').style.filter='blur(2px)';
                    this.querySelector('.resume-overlay').style.opacity='1';"
      >

        <img 
          src="${data.resume.pdfPreview || "assets/preview.webp"}"
          alt="Resume Preview"
          class="resume-img"
          style="
            width:100%;
            max-width:500px;
            display:block;
            border-radius:20px;
            filter:blur(1px);
            transition:0.3s;
          "
        />

        <!-- Overlay -->
        <div class="resume-overlay"
          style="
            position:absolute;
            inset:0;
            display:flex;
            align-items:center;
            justify-content:center;
            opacity:1;
            transition:0.3s;
          "
        >
          <i class="fas fa-eye" style="
            color:grey;
            font-size:32px;
          "></i>
        </div>

      </div>
    </a>
  </div>
`
    : ""
}
        `;
      }
      
document.querySelectorAll('.resume-overlay').forEach(el => {
  const parent = el.parentElement;

  parent.addEventListener('mouseenter', () => {
    el.style.opacity = '1';
  });

  parent.addEventListener('mouseleave', () => {
    el.style.opacity = '0';
  });
});
      // Technical Skills (UNCHANGED)
      const techSkillsGrid = document.getElementById("technical-skills-grid");
      if (techSkillsGrid && data.resume.technicalSkills) {
        data.resume.technicalSkills.forEach((skill) => {
          const skillDiv = document.createElement("div");
          skillDiv.className = "skill";
          skillDiv.innerHTML = `<i class="${skill.icon}"></i><span>${skill.name}</span>`;
          techSkillsGrid.appendChild(skillDiv);
        });
      }
    }

    // -----------------------------
    // Connections
    // -----------------------------
    if (data.connections) {
      const catEl = document.getElementById("connections-categories");
      if (catEl) {
        const categories = Array.isArray(data.connections.categories)
          ? data.connections.categories
          : ["All"];

        window.connectionsCategories = categories;

        catEl.innerHTML = categories
          .map(
            (cat, index) =>
              `<button class="cat-tab ${index === 0 ? "active" : ""}" data-category="${cat}">${cat}</button>`
          )
          .join("");
      }

      const connGrid = document.getElementById("connections-grid");
      if (connGrid && data.connections.colleagues) {
        window.connectionsData = data.connections.colleagues;
        window.connectionsPriorityMap = data.connections.priority || {};

        renderConnections(data.connections.colleagues, connGrid, "All");
        initSliderControls();
      }
    }

    // -----------------------------
    // Certifications
    // -----------------------------
    if (data.certifications && Array.isArray(data.certifications)) {
      renderCertifications(data.certifications);
    }

    if (data.seo) {
      document.title = data.seo.title;
      document.querySelector('meta[name="description"]').content =
        data.seo.description;
      document.querySelector('meta[name="author"]').content =
        data.seo.author;
    }

    setupContactForm(data.contact?.email);
    setupConnectionsFilter();

    console.log("✅ Portfolio loaded");
  } catch (error) {
    console.error("❌ Load error:", error);
  }
}

function renderConnections(colleagues, container, catFilter = "all") {
  const normalize = normalizeCategory(catFilter || "all");
  const filtered =
    normalize === "all"
      ? [...colleagues]
      : colleagues.filter(
          (col) => normalizeCategory(col.category) === normalize,
        );

  const sorted = sortConnections(filtered, catFilter || "all");
  const slider = container.querySelector("#connections-slider");
  const visible = getItemsPerSlide();
  const totalItems = sorted.length;

  const makeSlideItem = (col) => {
    const icons = window.globalSocialIcons || {};

    let socialHTML = "";

    if (col.email) {
      socialHTML += `<a href="mailto:${col.email}" aria-label="Email ${col.name}">
                      <i class="${icons.email || "fas fa-envelope"}"></i>
                    </a>`;
    }

    if (col.phone) {
      socialHTML += `<a href="tel:${col.phone}" aria-label="Call ${col.name}">
                      <i class="${icons.phone || "fas fa-phone"}"></i>
                    </a>`;
    }

    if (col.linkedin) {
      socialHTML += `<a href="${col.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn ${col.name}">
                      <i class="${icons.linkedin || "fab fa-linkedin-in"}"></i>
                    </a>`;
    }

    if (col.facebook) {
      socialHTML += `<a href="${col.facebook}" target="_blank" rel="noopener" aria-label="Facebook ${col.name}">
                      <i class="${icons.facebook || "fab fa-facebook-f"}"></i>
                    </a>`;
    }

    if (col.instagram) {
      socialHTML += `<a href="${col.instagram}" target="_blank" rel="noopener" aria-label="Instagram ${col.name}">
                      <i class="${icons.instagram || "fab fa-instagram"}"></i>
                    </a>`;
    }

    if (col.x) {
      socialHTML += `<a href="${col.x}" target="_blank" rel="noopener" aria-label="X ${col.name}">
                      <i class="${icons.x || "fab fa-x-twitter"}"></i>
                    </a>`;
    }

    if (col.href) {
      socialHTML += `<a href="${col.href}" target="_blank" rel="noopener" aria-label="Website ${col.name}">
                      <i class="${icons.website || "fas fa-globe"}"></i>
                    </a>`;
    }

    return `
    <div class="slide-item">
      <div class="colleague-card">
        <div class="colleague-img-container">
          <img src="${col.image || "assets/codeLogo.webp"}" alt="${col.name}" loading="lazy" />
        </div>
        <div class="colleague-info">
          <h4>${col.name}</h4>
          <p class="single-line">${col.spec}</p>
          <p class="work-details">
            <strong>Work:</strong> ${col.working} • ${col.exp}
            ${col.workDesc ? `<br><small>${col.workDesc}</small>` : ""}
          </p>
          <div class="col-social">
            ${socialHTML}
          </div>
        </div>
      </div>
    </div>
  `;
  };

  const coreSlides = sorted.map(makeSlideItem).join("");

  if (totalItems === 0) {
    slider.innerHTML = "";
    window.loopSlider = null;
    updateSliderDots(totalItems);
    return;
  }

  if (totalItems <= visible) {
    slider.innerHTML = coreSlides;
    window.loopSlider = null;
    currentSlideIndex = 0;
    slider.style.transition = "none";
    slider.style.transform = "translateX(0px)";

    setTimeout(() => {
      slider.style.transition =
        "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    }, 20);

    updateSliderDots(totalItems);
    console.log(
      "Rendered",
      totalItems,
      "connections (static). Slide width:",
      getSlideWidth(),
      "visible",
      visible,
    );
    return;
  }

  const clonesBefore = sorted.slice(-visible).map(makeSlideItem).join("");
  const clonesAfter = sorted.slice(0, visible).map(makeSlideItem).join("");

  slider.innerHTML = clonesBefore + coreSlides + clonesAfter;

  window.loopSlider = {
    totalItems,
    visible,
    baseIndex: visible,
    maxIndex: visible + totalItems - 1,
  };

  currentSlideIndex = window.loopSlider.baseIndex;
  slider.style.transition = "none";
  slider.style.transform = `translateX(-${currentSlideIndex * getSlideWidth()}px)`;

  setTimeout(() => {
    slider.style.transition =
      "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  }, 20);

  resetSlider();
  updateSliderDots(totalItems);
  console.log(
    "Rendered",
    totalItems,
    "connections. Slide width:",
    getSlideWidth(),
    "visible",
    visible,
  );
}

// Certifications slider state
let certCurrentIndex = 0;
let certTotalItems = 0;

function getCertSlideWidth() {
  const slider = document.getElementById("certifications-slider");
  if (slider) {
    const firstCard = slider.querySelector(".cert-card");
    if (firstCard) {
      const w = firstCard.getBoundingClientRect().width;
      const gap = parseFloat(window.getComputedStyle(slider).gap || "0");
      return w + (isNaN(gap) ? 0 : gap);
    }
  }
  return 320;
}

function updateCertSliderDots() {
  const dotsContainer = document.getElementById("cert-slider-dots");
  if (!dotsContainer) return;

  const dots = Array.from(dotsContainer.querySelectorAll("button"));
  const activePage = Math.floor(certCurrentIndex / getItemsPerSlide());

  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === activePage);
  });
}

function certGoToSlide(index) {
  const slider = document.getElementById("certifications-slider");
  if (!slider) return;

  certTotalItems = slider.querySelectorAll(".cert-card").length;
  const maxIndex = Math.max(0, certTotalItems - getItemsPerSlide());
  certCurrentIndex = Math.max(0, Math.min(index, maxIndex));

  const offset = certCurrentIndex * getCertSlideWidth();
  slider.scrollTo({ left: offset, behavior: "smooth" });
  updateCertSliderDots();
}

function certNextSlide() {
  certGoToSlide(certCurrentIndex + 1);
}

function certPrevSlide() {
  certGoToSlide(certCurrentIndex - 1);
}

function renderCertifications(certifications) {
  const certGrid = document.getElementById("certifications-grid");
  if (!certGrid || !Array.isArray(certifications)) return;

  certTotalItems = certifications.length;
  certCurrentIndex = 0;

  const slides = certifications
    .map(
      (cert) => `
      <div class="cert-card">
        <div class="cert-card-image-wrapper">
          <img src="${cert.image || "assets/cert-placeholder.png"}" alt="${cert.name}" loading="lazy" />
        </div>
        <div class="cert-card-body">
          <h4>${cert.name}</h4>
          <p class="cert-provider"><strong>${cert.provider}</strong> • ${cert.date}</p>
          <p>${cert.desc}</p>
        </div>
      </div>
    `,
    )
    .join("");

  certGrid.innerHTML = `
    <div class="cert-slider-container">
      <div class="certifications-slider" id="certifications-slider">
        ${slides}
      </div>
      <div class="cert-slider-controls">
        <button class="slider-btn cert-prev-btn" aria-label="Previous certificate">‹</button>
        <button class="slider-btn cert-next-btn" aria-label="Next certificate">›</button>
      </div>
      <div class="cert-slider-dots" id="cert-slider-dots"></div>
    </div>
  `;

  const prev = document.querySelector(".cert-prev-btn");
  const next = document.querySelector(".cert-next-btn");
  if (prev) prev.addEventListener("click", certPrevSlide);
  if (next) next.addEventListener("click", certNextSlide);

  const dotsContainer = document.getElementById("cert-slider-dots");
  if (dotsContainer) {
    dotsContainer.innerHTML = "";
    const totalPages = Math.ceil(certTotalItems / getItemsPerSlide());
    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement("button");
      dot.className = i === 0 ? "dot active" : "dot";
      dot.setAttribute("aria-label", `Go to certificate page ${i + 1}`);
      dot.addEventListener("click", () => certGoToSlide(i * getItemsPerSlide()));
      dotsContainer.appendChild(dot);
    }
  }

  certGoToSlide(0);
}

let activeConnectionCategory = "all";

function normalizeCategory(cat) {
  return String(cat || "").toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
}

function getRecommendedPriorityCodes(catFilter) {
  const priorityMap = window.connectionsPriorityMap || {};
  const normalizedFilter = normalizeCategory(catFilter || "all");

  for (const key of Object.keys(priorityMap)) {
    if (normalizeCategory(key) === normalizedFilter) {
      return Array.isArray(priorityMap[key]) ? priorityMap[key] : [];
    }
  }

  // fall back to All if category-specific does not exist
  if (normalizedFilter !== "all") {
    return getRecommendedPriorityCodes("all");
  }

  return [];
}

function sortConnections(items, catFilter = "all") {
  const priorityCodes = getRecommendedPriorityCodes(catFilter).map((x) => String(x).toUpperCase());

  const alphanumericRank = (code) => {
    const normalized = String(code || "").toUpperCase();
    const match = normalized.match(/^([A-Z]+)(\d+)$/);
    if (!match) return Number.MAX_SAFE_INTEGER;

    const charPrefix = match[1];
    const num = Number(match[2]);
    // fallback prefix sorting order: B, E, M (or choose natural alphabetical if not mapped)
    const prefixOrder = { B: 0, E: 1, M: 2 };
    const groupRank = prefixOrder[charPrefix] ?? 99;
    return groupRank * 10000 + num;
  };

  const prioritySet = new Set(priorityCodes);
  const hasSinglePriority = priorityCodes.length === 1;

  const prefixOrderFromData = () => {
    const order = new Map();
    let idx = 0;

    // From priority order first
    for (const code of priorityCodes) {
      const match = String(code || "").toUpperCase().match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const prefix = match[1];
        if (!order.has(prefix)) {
          order.set(prefix, idx++);
        }
      }
    }

    // All others from item codes
    for (const item of items) {
      const match = String(item.code || "").toUpperCase().match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const prefix = match[1];
        if (!order.has(prefix)) {
          order.set(prefix, idx++);
        }
      }
    }

    return order;
  };

  const prefixOrder = prefixOrderFromData();

  const legacyAlphanumericRank = (code) => {
    const normalized = String(code || "").toUpperCase();
    const match = normalized.match(/^([A-Z]+)(\d+)$/);
    if (!match) return Number.MAX_SAFE_INTEGER;

    const charPrefix = match[1];
    const num = Number(match[2]);
    const groupRank = prefixOrder.get(charPrefix) ?? 99;
    return groupRank * 10000 + num;
  };

  return [...items]
    .sort((a, b) => {
      const aCode = String(a.code || "").toUpperCase();
      const bCode = String(b.code || "").toUpperCase();

      if (prioritySet.size > 0) {
        const aPrior = priorityCodes.indexOf(aCode);
        const bPrior = priorityCodes.indexOf(bCode);
        if (aPrior >= 0 || bPrior >= 0) {
          if (aPrior === bPrior) {
            // both have identical priority index or -1. continue to fallback.
          } else {
            if (aPrior === -1) return 1;
            if (bPrior === -1) return -1;
            return aPrior - bPrior;
          }
        }
      }

      if (hasSinglePriority) {
        if (aCode === priorityCodes[0] && bCode !== priorityCodes[0]) return -1;
        if (bCode === priorityCodes[0] && aCode !== priorityCodes[0]) return 1;
      }

      const aRank = legacyAlphanumericRank(aCode);
      const bRank = legacyAlphanumericRank(bCode);
      if (aRank !== bRank) return aRank - bRank;

      if (a.code && b.code) {
        if (aCode !== bCode) return aCode.localeCompare(bCode, undefined, { numeric: true });
      }
      if (a.name && b.name) return String(a.name).localeCompare(String(b.name));
      return 0;
    })
    .sort((a, b) => {
      const aCode = String(a.code || "").toUpperCase();
      const bCode = String(b.code || "").toUpperCase();
      const aPrior = priorityCodes.indexOf(aCode);
      const bPrior = priorityCodes.indexOf(bCode);
      if (aPrior >= 0 || bPrior >= 0) {
        if (aPrior === -1) return 1;
        if (bPrior === -1) return -1;
        return aPrior - bPrior;
      }
      return 0;
    });
}

function setupConnectionsFilter() {
  const catEl = document.getElementById("connections-categories");
  if (!catEl || !Array.isArray(window.connectionsCategories)) return;

  catEl.style.display = "flex";
  const buttons = Array.from(catEl.querySelectorAll(".cat-tab"));

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const selectedCategory = event.currentTarget.dataset.category;
      if (!selectedCategory) return;

      activeConnectionCategory = selectedCategory;

      buttons.forEach((btn) => {
        btn.classList.toggle("active", btn === event.currentTarget);
      });

      const connGrid = document.getElementById("connections-grid");
      if (!connGrid || !window.connectionsData) return;

      renderConnections(window.connectionsData, connGrid, selectedCategory);
      initSliderControls();
    });
  });
}

// Slider functionality
let currentSlideIndex = 0;

function getItemsPerSlide() {
  const width = window.innerWidth;
  if (width >= 900) return 3; // Desktop: show 3 at a time
  if (width >= 600) return 2; // Tablet: show 2 at a time
  return 1; // Mobile: show 1 at a time
}

function getSlideWidth() {
  const slider = document.getElementById("connections-slider");
  if (slider) {
    const firstSlide = slider.querySelector(".slide-item");
    if (firstSlide) {
      const slideWidth = firstSlide.getBoundingClientRect().width;
      const sliderStyle = window.getComputedStyle(slider);
      const gap = parseFloat(sliderStyle.gap || sliderStyle.columnGap || "0") || 0;
      return slideWidth + gap;
    }
  }

  const width = window.innerWidth;
  if (width <= 599) return window.innerWidth - 40;
  return 320; // fallback for desktop/tablet
}

function updateSliderDots(totalItems) {
  const sliderContainer = document.querySelector("#connections-grid .slider-container");
  if (!sliderContainer) return;

  const dotsContainer = document.getElementById("slider-dots");
  const sliderControls = sliderContainer.querySelector(".slider-controls");
  const sliderDotsCont = sliderContainer.querySelector(".slider-dots");

  const itemsPerSlide = getItemsPerSlide();
  const totalSlides = Math.ceil(totalItems / itemsPerSlide);
  const showControls = totalSlides > 1;

  if (sliderControls) sliderControls.style.display = showControls ? "flex" : "none";
  if (sliderDotsCont) sliderDotsCont.style.display = showControls ? "flex" : "none";

  if (dotsContainer) {
    dotsContainer.innerHTML = "";
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement("button");
      let activePage = 0;
      if (window.loopSlider) {
        const realIndex = (currentSlideIndex - window.loopSlider.baseIndex + window.loopSlider.totalItems) % window.loopSlider.totalItems;
        activePage = Math.floor(realIndex / itemsPerSlide);
      }
      dot.className = `dot ${i === activePage ? "active" : ""}`;
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => {
        const targetIndex = window.loopSlider ? window.loopSlider.baseIndex + i * itemsPerSlide : i;
        goToSlide(targetIndex);
      });
      dotsContainer.appendChild(dot);
    }
  }
}

function nextSlide() {
  if (!window.loopSlider) return;
  const { maxIndex, baseIndex } = window.loopSlider;
  const nextIndex = currentSlideIndex + 1;
  let target = nextIndex;
  if (nextIndex > maxIndex) target = maxIndex + 1; // move into clone (will reset in transitionend)
  goToSlide(target);
}

function prevSlide() {
  if (!window.loopSlider) return;
  const { baseIndex } = window.loopSlider;
  const prevIndex = currentSlideIndex - 1;
  let target = prevIndex;
  if (prevIndex < baseIndex) target = baseIndex - 1; // move into left clone
  goToSlide(target);
}

// Support non-loop scenario (if items <= visible)
function goToSlide(index) {
  const slider = document.getElementById("connections-slider");
  if (!slider) return;

  if (!window.loopSlider) {
    // no movement needed for static view when there is only one page
    currentSlideIndex = 0;
    slider.style.transform = "translateX(0px)";
    updateDots();
    return;
  }

  currentSlideIndex = index;
  const slideWidth = getSlideWidth();

  slider.style.transform = `translateX(-${currentSlideIndex * slideWidth}px)`;

  const { baseIndex, maxIndex } = window.loopSlider;
  const onTransitionEnd = () => {
    slider.removeEventListener("transitionend", onTransitionEnd);

    if (currentSlideIndex > maxIndex) {
      slider.style.transition = "none";
      currentSlideIndex = baseIndex;
      slider.style.transform = `translateX(-${currentSlideIndex * slideWidth}px)`;
      requestAnimationFrame(() => {
        slider.style.transition = "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      });
    } else if (currentSlideIndex < baseIndex) {
      slider.style.transition = "none";
      currentSlideIndex = maxIndex;
      slider.style.transform = `translateX(-${currentSlideIndex * slideWidth}px)`;
      requestAnimationFrame(() => {
        slider.style.transition = "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      });
    }
    updateDots();
  };

  slider.addEventListener("transitionend", onTransitionEnd);

  updateDots();
}


function updateDots() {
  const dots = document.querySelectorAll(".dot");
  if (!dots.length || !window.loopSlider) return;

  const { totalItems, baseIndex } = window.loopSlider;
  const itemsPerSlide = getItemsPerSlide();
  const realIndex = (currentSlideIndex - baseIndex + totalItems) % totalItems;
  const activePage = Math.floor(realIndex / itemsPerSlide);

  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === activePage);
  });
}

function resetSlider() {
  const slider = document.getElementById("connections-slider");
  if (!slider || !window.loopSlider) return;

  currentSlideIndex = window.loopSlider.baseIndex;
  slider.style.transition = "none";
  slider.style.transform = `translateX(-${currentSlideIndex * getSlideWidth()}px)`;
  requestAnimationFrame(() => {
    slider.style.transition = "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  });
  updateDots();
}

// Debounced resize handler
let resizeTimeout;
let prevItemsPerSlide = getItemsPerSlide();
function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const newItemsPerSlide = getItemsPerSlide();
    const connGrid = document.getElementById("connections-grid");

    if (newItemsPerSlide !== prevItemsPerSlide && connGrid && window.connectionsData) {
      prevItemsPerSlide = newItemsPerSlide;
      renderConnections(window.connectionsData, connGrid, activeConnectionCategory);
      return;
    }

    if (connGrid) {
      resetSlider();
      updateSliderDots(window.loopSlider?.totalItems || (window.connectionsData || []).length);
    }
  }, 250);
}
window.addEventListener("resize", handleResize);


// Global slider state
// Removed 3+ toggle - pure slider with viewport-fit visible count


function toggleDesktopSlider() {
  console.log('Toggle clicked, current mode:', desktop3PlusMode);
  desktop3PlusMode = !desktop3PlusMode;
  const sliderContainer = document.querySelector('.slider-container');
  const moreIndicator = document.querySelector('.more-indicator');
  const slider = document.getElementById('connections-slider');
  
  if (desktop3PlusMode) {
    console.log('→ Full slider');
    sliderContainer.classList.remove('static-3-view');
    sliderContainer.classList.add('expanded-slider');
    moreIndicator.innerHTML = `Show less (${slider.children.length} connections) <i class="fas fa-chevron-left"></i>`;
    const sliderControls = sliderContainer.querySelector('.slider-controls');
    if (sliderControls) sliderControls.style.display = 'flex';
    updateSliderDots(slider.children.length);
    resetSlider();
  } else {
    console.log('→ Static 3 view');
    sliderContainer.classList.add('static-3-view');
    sliderContainer.classList.remove('expanded-slider');
    moreIndicator.innerHTML = `View all (${slider.children.length - 3}+ connections) <i class="fas fa-chevron-right"></i>`;
    const sliderControls = sliderContainer.querySelector('.slider-controls');
    const sliderDots = document.getElementById('slider-dots');
    if (sliderControls) sliderControls.style.display = 'none';
    if (sliderDots) sliderDots.style.display = 'none';
  }
  console.log('Toggle complete. Mode:', desktop3PlusMode, 'Classes:', sliderContainer.className);
}

// Event listeners for slider controls
function initSliderControls() {
  const nextBtn = document.querySelector(".next-btn");
  const prevBtn = document.querySelector(".prev-btn");
  if (nextBtn) nextBtn.addEventListener("click", nextSlide);
  if (prevBtn) prevBtn.addEventListener("click", prevSlide);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('#connections:hover, .slider-container:hover')) {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    }
  });

  console.log('Slider initialized. Items per slide:', getItemsPerSlide(), 'Window width:', window.innerWidth);
}


function setupContactForm(email) {
  const form = document.getElementById("contact-form");
  if (form && email) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const subjectRaw = String(formData.get("form-subject") || "").trim();
      const subject = subjectRaw
        .replace("-", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const name = String(formData.get("form-name") || "").trim();
      const senderEmail = String(formData.get("form-email") || "").trim();
      const phone = String(formData.get("form-phone") || "").trim();
      const message = String(formData.get("form-message") || "").trim();

      if (!name || !senderEmail || !subjectRaw || !message) {
        alert("Please fill in all required fields.");
        return;
      }

      const body =
        `Name: ${name}\n` +
        `Email: ${senderEmail}\n` +
        `Phone: ${phone || "-"}\n` +
        `Subject: ${subject}\n\n` +
        `Message:\n${message}`;

      alert("This will open your default email app to send the message.");
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      form.reset();
    });
  }
}

// Init
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadDynamicContent);
} else {
  loadDynamicContent();
}
