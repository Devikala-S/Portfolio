const E = {
  data: null,
  original: null,
  fileHandle: null,
};

const SOCIAL_CATALOG = [
  { key: "Email", title: "Email", label: "Email", href: "mailto:anuvarshini@example.com", icon: "fas fa-envelope" },
  { key: "Phone", title: "Phone", label: "Phone", href: "tel:+91-XXXXXXXXXX", icon: "fas fa-phone" },
  { key: "LinkedIn", title: "LinkedIn", label: "LinkedIn", href: "https://linkedin.com/in/anuvarshini", icon: "fab fa-linkedin-in" },
  { key: "Facebook", title: "Facebook", label: "Facebook", href: "https://facebook.com/anuvarshini", icon: "fab fa-facebook-f" },
  { key: "Instagram", title: "Instagram", label: "Instagram", href: "https://instagram.com/anuvarshini", icon: "fab fa-instagram" },
  { key: "GitHub", title: "GitHub", label: "GitHub", href: "https://github.com/anuvarshini", icon: "fab fa-github" },
];

async function initEditor() {
  try {
    const res = await fetch("./Config/display.json");
    if (!res.ok) throw new Error("Failed to load display.json");
    E.data = await res.json();
    E.original = JSON.parse(JSON.stringify(E.data));
    bindEditorShell();
    await waitForPortfolioRender();
    decorateEditor();
    setEditorStatus("Editor ready");
  } catch (error) {
    console.error(error);
    setEditorStatus("Editor failed to load");
  }
}

function bindEditorShell() {
  document.getElementById("editor-save")?.addEventListener("click", saveJson);
  document.getElementById("editor-reset")?.addEventListener("click", () => {
    if (!confirm("Reset all unsaved edits?")) return;
    E.data = JSON.parse(JSON.stringify(E.original));
    location.reload();
  });

  document.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-edit-kind]");
    if (btn) return openEditor(btn.dataset.editKind, Number(btn.dataset.editIndex));
    const deleteBtn = event.target.closest("[data-delete-kind]");
    if (deleteBtn) return handleDelete(deleteBtn.dataset.deleteKind, Number(deleteBtn.dataset.deleteIndex));
    const socialActionBtn = event.target.closest("[data-social-action]");
    if (socialActionBtn) return openSocialAction(Number(socialActionBtn.dataset.socialAction));
    const copyBtn = event.target.closest("[data-copy-text]");
    if (copyBtn) return copyToClipboard(copyBtn.dataset.copyText || "");
    if (event.target.closest("[data-close-editor-modal]")) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
}

function setEditorStatus(message) {
  const el = document.getElementById("editor-status");
  if (el) el.textContent = message;
}

function waitForPortfolioRender() {
  return new Promise((resolve) => {
    let tries = 0;
    const tick = () => {
      if (document.querySelector("#hero-content h1") || tries > 80) return resolve();
      tries += 1;
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function decorateEditor() {
  document.querySelectorAll(".editor-action-group").forEach((el) => el.remove());
  document.querySelectorAll(".editor-add-panel, .editor-add-slide, .editor-add-shortcut").forEach((el) => el.remove());
  addSectionButton("#hero-content", "hero");
  addSocialActionButtons();
  insertAddSocialShortcut();
  insertAddInterestShortcut();
  addItemButtons("#about-interests li", "interest");
  insertAddEducationShortcut();
  addItemButtons("#resume-education .timeline-item", "education");
  addSectionButton("#resume-experience", "resumeMedia");
  insertAddExperienceShortcut();
  addItemButtons("#resume-experience .timeline-item", "experience");
  insertAddSkillShortcut();
  addItemButtons("#technical-skills-grid .skill", "skill");
  insertAddCategoryShortcut();
  insertPriorityShortcut();
  insertAddConnectionShortcut();
  addItemButtons("#connections-slider .colleague-card", "connection", getConnectionIndexes());
  insertAddConnectionCard();
  addItemButtons("#certifications-grid .cert-card", "certification");
  insertAddCertificationCard();
  addSectionButton(".contact-section", "contact");
}

function addSectionButton(selector, kind) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.classList.add("editor-editable");
  el.insertAdjacentHTML("beforeend", actionMarkup(kind));
}

function addItemButtons(selector, kind, indexes) {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.classList.add("editor-editable");
    const index = Array.isArray(indexes) ? indexes[i] : i;
    if (index === undefined || index < 0) return;
    el.insertAdjacentHTML("beforeend", actionMarkup(kind, index, getItemActions(kind)));
  });
}

function addSocialActionButtons() {
  document.querySelectorAll("#hero-social > li").forEach((el, index) => {
    el.classList.add("editor-editable");
    el.insertAdjacentHTML(
      "beforeend",
      `
        <div class="editor-action-group editor-action-group--social">
          <button
            type="button"
            class="editor-icon-btn editor-icon-btn--social"
            data-social-action="${index}"
            aria-label="Social link actions"
          >
            <i class="fas fa-ellipsis-h"></i>
          </button>
        </div>
      `,
    );
  });
}

function getItemActions(kind) {
  const deletableKinds = new Set([
    "social",
    "interest",
    "education",
    "experience",
    "skill",
    "connection",
    "certification",
  ]);
  if (deletableKinds.has(kind)) {
    return ["edit", "delete"];
  }
  return ["edit"];
}

function actionMarkup(kind, index, actions = ["edit"]) {
  return `
    <div class="editor-action-group">
      ${actions
        .map((action) =>
          action === "delete"
            ? `<button type="button" class="editor-icon-btn editor-icon-btn--danger" data-delete-kind="${kind}" ${index !== undefined ? `data-delete-index="${index}"` : ""} aria-label="Delete ${kind}">
                <i class="fas fa-trash"></i>
                <span>Delete</span>
              </button>`
            : `<button type="button" class="editor-icon-btn" data-edit-kind="${kind}" ${index !== undefined ? `data-edit-index="${index}"` : ""} aria-label="Edit ${kind}">
                <i class="fas fa-pen"></i>
                <span>Edit</span>
              </button>`,
        )
        .join("")}
    </div>
  `;
}

function handleDelete(kind, index) {
  if (!confirm(`Are you sure you want to delete this ${kind}?`)) return;

  switch (kind) {
    case "social":
      E.data.social.splice(index, 1);
      return rerenderSocialEditor("Social link deleted");
    case "interest":
      E.data.hero.interests.splice(index, 1);
      return rerenderInterestsEditor("Interest deleted");
    case "education":
      E.data.resume.education.splice(index, 1);
      return rerenderEducationEditor("Education deleted");
    case "experience":
      E.data.resume.experience.splice(index, 1);
      return rerenderExperienceEditor("Experience deleted");
    case "skill":
      E.data.resume.technicalSkills.splice(index, 1);
      return rerenderSkillsEditor("Skill deleted");
    case "connection":
      E.data.connections.colleagues.splice(index, 1);
      return rerenderConnectionsEditor("Connection deleted");
    case "certification":
      E.data.certifications.splice(index, 1);
      return rerenderCertificationsEditor("Certification deleted");
  }
}

function openSocialAction(index) {
  openChoiceModal(
    "Social Link Actions",
    "Choose what you want to do with this social link.",
    [
      {
        label: "Edit",
        className: "editor-primary-btn",
        onClick: () => openEditor("social", index),
      },
      {
        label: "Delete",
        className: "editor-danger-btn",
        onClick: () => handleDelete("social", index),
      },
    ],
  );
}

function openChoiceModal(title, message, actions) {
  const modal = document.getElementById("editor-modal");
  const form = document.getElementById("editor-form");
  const titleEl = document.getElementById("editor-modal-title");
  const dialog = modal?.querySelector(".editor-modal__dialog");
  if (!modal || !form || !titleEl) return;

  titleEl.textContent = title;
  if (dialog) {
    dialog.classList.remove("editor-modal__dialog--wide");
  }

  form.onsubmit = null;
  form.innerHTML = `
    <p class="editor-helper">${message}</p>
    <div class="editor-choice-actions">
      ${actions
        .map(
          (action, index) => `
            <button
              type="button"
              class="${action.className}"
              data-choice-index="${index}"
            >
              ${action.label}
            </button>
          `,
        )
        .join("")}
      <button type="button" class="editor-secondary-btn" data-close-editor-modal>Discard</button>
    </div>
  `;

  form.querySelectorAll("[data-choice-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.getAttribute("data-choice-index"));
      closeModal();
      actions[index]?.onClick?.();
    });
  });

  modal.hidden = false;
}

function getConnectionIndexes() {
  return Array.from(document.querySelectorAll("#connections-slider .colleague-card")).map((card) => {
    const name = card.querySelector("h4")?.textContent?.trim();
    return E.data.connections.colleagues.findIndex((item) => item.name === name);
  });
}

function getMissingSocialLinks() {
  const currentKeys = new Set((E.data?.social || []).map(getSocialKey));
  return getSocialCatalog().filter((item) => !currentKeys.has(getSocialKey(item)));
}

function getSocialIdentity(item) {
  if (!item) return "";
  return [item.title || "", item.label || "", item.href || "", item.icon || ""].join("|");
}

function getSocialKey(item) {
  if (!item) return "";
  return String(item.label || item.title || item.key || item.href || "").trim().toLowerCase();
}

function getSocialCatalog() {
  return SOCIAL_CATALOG.map((social) => {
    const existing =
      (E.original?.social || []).find((item) => getSocialKey(item) === getSocialKey(social)) || {};

    return {
      ...social,
      ...existing,
      title: existing.title || social.title,
      label: existing.label || social.label,
      href: existing.href || social.href,
      icon: existing.icon || social.icon,
    };
  });
}

function getConnectionCategoryOptions() {
  return (E.data?.connections?.categories || []).filter((category) => category !== "All");
}

function getDefaultConnectionCategory() {
  return getConnectionCategoryOptions()[0] || "";
}

function getCategoryPrefix(category) {
  const normalized = String(category || "").trim();
  if (!normalized) return "C";

  const words = normalized
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean);

  if (!words.length) return "C";

  const categories = (E.data?.connections?.categories || []).filter((item) => item && item !== "All");
  const usedPrefixes = new Set(
    categories
      .filter((item) => item !== category)
      .map((item) => deriveCategoryPrefix(item)),
  );

  return deriveCategoryPrefix(normalized, usedPrefixes);
}

function deriveCategoryPrefix(category, usedPrefixes = new Set()) {
  const words = String(category || "")
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean);

  if (!words.length) return "C";

  const firstLetters = words.map((word) => word.charAt(0).toUpperCase()).join("");
  if (firstLetters && !usedPrefixes.has(firstLetters)) {
    return firstLetters;
  }

  if (words.length === 1) {
    const word = words[0].toUpperCase();
    for (let i = 1; i <= word.length; i += 1) {
      const candidate = word.slice(0, i);
      if (!usedPrefixes.has(candidate)) return candidate;
    }
    return word;
  }

  for (let take = 2; take <= words.length; take += 1) {
    const candidate = words
      .slice(0, take)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
    if (!usedPrefixes.has(candidate)) return candidate;
  }

  const expanded = words
    .map((word, index) => (index === 0 ? word.slice(0, 2) : word.charAt(0)).toUpperCase())
    .join("");

  return usedPrefixes.has(expanded) ? words.join("").toUpperCase() : expanded;
}

function generateConnectionCode(category) {
  const prefix = getCategoryPrefix(category);
  const colleagues = E.data?.connections?.colleagues || [];
  const usedNumbers = colleagues
    .map((item) => String(item.code || "").toUpperCase())
    .filter((code) => code.startsWith(prefix))
    .map((code) => Number(code.slice(prefix.length)))
    .filter((value) => Number.isFinite(value));

  const nextNumber = usedNumbers.length ? Math.max(...usedNumbers) + 1 : 1;
  return `${prefix}${nextNumber}`;
}

function openEditor(kind, index) {
  switch (kind) {
    case "hero":
      return openModal("Edit Hero", [
        field("profileImage", "Profile image"),
        field("name", "Name"),
        field("title", "Title"),
        field("description", "Description", "textarea"),
      ], E.data.hero, (values) => {
        Object.assign(E.data.hero, values);
        updateHero();
      });
    case "social":
      return openModal("Edit Social Link", [
        field("label", "Label"),
        field("title", "Title"),
        field("href", "URL / mailto / tel"),
        field("icon", "Icon class"),
      ], E.data.social[index], (values) => {
        E.data.social[index] = values;
        updateSocial(index);
      });
    case "restoreSocial":
      return openModal(
        "Add Social Link",
        [
          field("label", "Missing social link", "select", {
            options: getMissingSocialLinks().map((item) => item.label || item.title || item.href),
          }),
        ],
        { label: getMissingSocialLinks()[0]?.label || getMissingSocialLinks()[0]?.title || "" },
        (values) => {
          const picked = getMissingSocialLinks().find(
            (item) => (item.label || item.title || item.href) === values.label,
          );
          if (!picked) return;
          E.data.social.push(JSON.parse(JSON.stringify(picked)));
          rerenderSocialEditor("Social link restored");
        },
      );
    case "interest":
      return openModal("Edit Interest", [field("value", "Interest")], { value: E.data.hero.interests[index] }, (values) => {
        E.data.hero.interests[index] = values.value;
        rerenderInterestsEditor();
      });
    case "addInterest":
      return openModal("Add Interest", [field("value", "Interest")], { value: "" }, (values) => {
        if (!values.value) return;
        E.data.hero.interests.push(values.value);
        rerenderInterestsEditor();
      });
    case "education":
      return openModal("Edit Education", [
        field("name", "Course / Degree"),
        field("inst", "Institution"),
        field("dates", "Dates"),
        field("percentage", "Score"),
      ], E.data.resume.education[index], (values) => {
        E.data.resume.education[index] = values;
        rerenderEducationEditor();
      });
    case "addEducation":
      return openModal("Add Education", [
        field("name", "Course / Degree"),
        field("inst", "Institution"),
        field("dates", "Dates"),
        field("percentage", "Score"),
      ], {
        name: "",
        inst: "",
        dates: "",
        percentage: "",
      }, (values) => {
        E.data.resume.education.push(values);
        rerenderEducationEditor();
      });
    case "experience":
      return openModal("Edit Experience", [
        field("role", "Role"),
        field("company", "Company"),
        field("dates", "Dates"),
        field("desc", "Description", "textarea"),
      ], E.data.resume.experience[index], (values) => {
        E.data.resume.experience[index] = values;
        rerenderExperienceEditor();
      });
    case "addExperience":
      return openModal("Add Experience", [
        field("role", "Role"),
        field("company", "Company"),
        field("dates", "Dates"),
        field("desc", "Description", "textarea"),
      ], {
        role: "",
        company: "",
        dates: "",
        desc: "",
      }, (values) => {
        E.data.resume.experience.push(values);
        rerenderExperienceEditor();
      });
    case "resumeMedia":
      return openModal("Edit Resume Media", [
        field("pdfUrl", "Resume PDF"),
        field("pdfPreview", "Preview image"),
      ], E.data.resume, (values) => {
        E.data.resume.pdfUrl = values.pdfUrl;
        E.data.resume.pdfPreview = values.pdfPreview;
        updateResumeMedia();
      });
    case "skill":
      return openModal("Edit Skill", [
        field("name", "Skill name"),
        field("icon", "Icon class"),
      ], E.data.resume.technicalSkills[index], (values) => {
        E.data.resume.technicalSkills[index] = values;
        updateSkill(index);
      });
    case "addSkill":
      return openModal("Add Skill", [
        field("name", "Skill name"),
        field("icon", "Icon class"),
      ], {
        name: "",
        icon: "fas fa-star",
      }, (values) => {
        E.data.resume.technicalSkills.push(values);
        rerenderSkillsEditor();
      });
    case "connection":
      return openModal("Edit Connection", [
        field("code", "Code"),
        field("name", "Name"),
        field("spec", "Subtitle"),
        field("working", "Company"),
        field("exp", "Experience"),
        field("category", "Category"),
        field("image", "Image path"),
        field("workDesc", "Work description", "textarea"),
        field("email", "Email"),
        field("phone", "Phone"),
        field("linkedin", "LinkedIn"),
        field("facebook", "Facebook"),
        field("instagram", "Instagram"),
        field("x", "X"),
        field("href", "Website"),
      ], E.data.connections.colleagues[index], (values) => {
        const previousName = E.data.connections.colleagues[index]?.name;
        E.data.connections.colleagues[index] = values;
        updateConnection(index, previousName);
      });
    case "addCategory":
      return openModal("Add Category", [
        field("name", "Category name"),
      ], { name: "" }, (values) => {
        const name = values.name.trim();
        if (!name) return;
        if (!Array.isArray(E.data.connections.categories)) {
          E.data.connections.categories = ["All"];
        }
        if (!E.data.connections.categories.includes(name)) {
          E.data.connections.categories.push(name);
        }
        if (!E.data.connections.priority) {
          E.data.connections.priority = {};
        }
        if (!E.data.connections.priority[name]) {
          E.data.connections.priority[name] = [];
        }
        rerenderConnectionsEditor();
      });
    case "editPriority":
      return openPriorityEditor();
    case "certification":
      return openModal("Edit Certification", [
        field("name", "Certification"),
        field("provider", "Provider"),
        field("date", "Date"),
        field("image", "Image path"),
        field("desc", "Description", "textarea"),
      ], E.data.certifications[index], (values) => {
        E.data.certifications[index] = values;
        updateCertification(index);
      });
    case "addConnection":
      return openModal("Add New Connection", [
        field("code", "Code", "text", { readonly: true }),
        field("name", "Name"),
        field("spec", "Subtitle"),
        field("working", "Company"),
        field("exp", "Experience"),
        field("category", "Category", "select", {
          options: getConnectionCategoryOptions(),
        }),
        field("image", "Image path"),
        field("workDesc", "Work description", "textarea"),
        field("email", "Email"),
        field("phone", "Phone"),
        field("linkedin", "LinkedIn"),
        field("facebook", "Facebook"),
        field("instagram", "Instagram"),
        field("x", "X"),
        field("href", "Website"),
      ], {
        code: generateConnectionCode(getDefaultConnectionCategory()),
        name: "",
        spec: "",
        working: "",
        exp: "",
        category: getDefaultConnectionCategory(),
        image: "",
        workDesc: "",
        email: "",
        phone: "",
        linkedin: "",
        facebook: "",
        instagram: "",
        x: "",
        href: "",
      }, (values) => {
        E.data.connections.colleagues.push(values);
        rerenderConnectionsEditor();
      }, {
        onInit: (form) => {
          const categoryField = form.querySelector('[name="category"]');
          const codeField = form.querySelector('[name="code"]');
          const syncCode = () => {
            if (!categoryField || !codeField) return;
            codeField.value = generateConnectionCode(categoryField.value);
          };
          categoryField?.addEventListener("change", syncCode);
          syncCode();
        },
      });
    case "addCertification":
      return openModal("Add New Certification", [
        field("name", "Certification"),
        field("provider", "Provider"),
        field("date", "Date"),
        field("image", "Image path"),
        field("desc", "Description", "textarea"),
      ], {
        name: "",
        provider: "",
        date: "",
        image: "",
        desc: "",
      }, (values) => {
        E.data.certifications.push(values);
        rerenderCertificationsEditor();
      });
    case "contact":
      return openModal("Edit Contact", [field("email", "Contact email")], E.data.contact, (values) => {
        E.data.contact.email = values.email;
        setEditorStatus("Contact updated");
      });
    case "nav":
      return openModal("Edit Navigation", [
        field("about", "About"),
        field("resume", "Resume"),
        field("connections", "Connections"),
        field("certifications", "Certifications"),
        field("contact", "Contact"),
      ], E.data.nav, (values) => {
        Object.assign(E.data.nav, values);
        updateNav();
      });
  }
}

function field(name, label, type = "text", options = {}) {
  return { name, label, type, ...options };
}

function openModal(title, fields, values, onSave, options = {}) {
  const modal = document.getElementById("editor-modal");
  const form = document.getElementById("editor-form");
  const titleEl = document.getElementById("editor-modal-title");
  if (!modal || !form || !titleEl) return;

  titleEl.textContent = title;
  const dialog = modal.querySelector(".editor-modal__dialog");
  if (dialog) {
    dialog.classList.toggle("editor-modal__dialog--wide", Boolean(options.wide));
  }
  form.innerHTML = `
    <div class="editor-form__layout ${options.helperHtml ? "editor-form__layout--split" : ""}">
      <div class="editor-form__main">
        ${fields.map((f) => renderField(f, values?.[f.name] ?? "")).join("")}
      </div>
      ${
        options.helperHtml
          ? `<aside class="editor-form__aside">${options.helperHtml}</aside>`
          : ""
      }
    </div>
    <p class="editor-helper">Update the selected content here, then choose Save or Discard. Use Save JSON in the top bar when you want to write all changes to the JSON file.</p>
    <div class="editor-form__actions">
      <div></div>
      <div class="editor-form__actions-right">
        <button type="button" class="editor-secondary-btn" data-close-editor-modal>Discard</button>
        <button type="submit" class="editor-primary-btn">Save</button>
      </div>
    </div>
  `;

  form.onsubmit = (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    const next = {};
    fields.forEach((f) => next[f.name] = String(fd.get(f.name) ?? "").trim());
    if (!confirm("Are you sure you want to update these changes?")) {
      return;
    }
    onSave(next);
    closeModal();
    decorateEditor();
    setEditorStatus("Unsaved changes");
  };

  options.onInit?.(form);
  modal.hidden = false;
}

function renderField(fieldDef, value) {
  const safe = escapeHtml(String(value));
  if (fieldDef.type === "select") {
    const options = Array.isArray(fieldDef.options) ? fieldDef.options : [];
    return `
      <div class="editor-field">
        <label for="f-${fieldDef.name}">${fieldDef.label}</label>
        <select id="f-${fieldDef.name}" name="${fieldDef.name}" ${fieldDef.readonly ? "disabled" : ""}>
          ${options
            .map(
              (option) =>
                `<option value="${escapeHtml(String(option))}" ${String(option) === String(value) ? "selected" : ""}>${escapeHtml(String(option))}</option>`,
            )
            .join("")}
        </select>
      </div>
    `;
  }
  if (fieldDef.type === "textarea") {
    return `<div class="editor-field"><label for="f-${fieldDef.name}">${fieldDef.label}</label><textarea id="f-${fieldDef.name}" name="${fieldDef.name}" ${fieldDef.readonly ? "readonly" : ""}>${safe}</textarea></div>`;
  }
  return `<div class="editor-field"><label for="f-${fieldDef.name}">${fieldDef.label}</label><input id="f-${fieldDef.name}" name="${fieldDef.name}" type="${fieldDef.type}" value="${safe}" ${fieldDef.readonly ? "readonly" : ""} /></div>`;
}

function closeModal() {
  const modal = document.getElementById("editor-modal");
  const form = document.getElementById("editor-form");
  if (form) form.innerHTML = "";
  if (modal) modal.hidden = true;
}

function updateNav() {
  document.querySelectorAll("#main-nav a").forEach((a) => {
    const key = a.getAttribute("href")?.slice(1);
    const icon = a.querySelector("i");
    a.innerHTML = "";
    if (icon) a.appendChild(icon);
    if (key && E.data.nav[key]) a.append(E.data.nav[key]);
  });
}

function updateHero() {
  const hero = document.getElementById("hero-content");
  if (!hero) return;
  hero.innerHTML = `
    ${E.data.hero.profileImage ? `<div class="hero-profile"><img src="${E.data.hero.profileImage}" alt="${E.data.hero.name}" loading="eager" /></div>` : ""}
    <h1>Hi, I'm <span class="accent">${E.data.hero.name}</span></h1>
    <p class="hero-description"><strong>${E.data.hero.title}</strong><br />${E.data.hero.description}</p>
  `;
}

function updateSocial(index) {
  const item = document.querySelectorAll("#hero-social > li a")[index];
  const data = E.data.social[index];
  if (!item || !data) return;
  item.href = data.href;
  item.setAttribute("aria-label", data.label);
  item.innerHTML = `<i class="${data.icon}"></i>`;
}

function rerenderSocialEditor(statusMessage = "Unsaved changes") {
  const heroSocial = document.getElementById("hero-social");
  if (!heroSocial) return;

  heroSocial.innerHTML = E.data.social
    .map(
      (link) => `
        <li>
          <a href="${link.href}" target="${link.href.startsWith("mailto:") ? "_self" : "_blank"}" rel="noopener" aria-label="${link.label}">
            <i class="${link.icon}"></i>
          </a>
        </li>
      `,
    )
    .join("");

  decorateEditor();
  setEditorStatus(statusMessage);
}

function insertAddSocialShortcut() {
  const socialList = document.getElementById("hero-social");
  const missing = getMissingSocialLinks();
  if (!socialList || !missing.length) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "editor-add-shortcut editor-add-shortcut--social";
  button.setAttribute("data-edit-kind", "restoreSocial");
  button.setAttribute("aria-label", "Add social link");
  button.innerHTML = `
    <span class="editor-add-shortcut__icon"><i class="fas fa-plus"></i></span>
    <span class="editor-add-shortcut__text">
      <strong>Add Social Link</strong>
      <small>Restore one of the missing social icons</small>
    </span>
  `;

  socialList.insertAdjacentElement("beforebegin", button);
}

function updateInterests() {
  const wrap = document.querySelector("#about-interests ul");
  if (!wrap) return;
  wrap.innerHTML = E.data.hero.interests.map((i) => `<li>${i}</li>`).join("");
}

function rerenderInterestsEditor(statusMessage = "Unsaved changes") {
  updateInterests();
  decorateEditor();
  setEditorStatus(statusMessage);
}

function updateEducation(index) {
  const item = document.querySelectorAll("#resume-education .timeline-item")[index];
  const data = E.data.resume.education[index];
  if (!item || !data) return;
  item.innerHTML = `<h4>${data.name} - ${data.inst}</h4><span>${data.dates}</span><p>${data.percentage}</p>`;
}

function rerenderEducationEditor(statusMessage = "Unsaved changes") {
  const wrap = document.getElementById("resume-education");
  if (!wrap) return;

  wrap.innerHTML = `
    <h3>Education</h3>
    ${E.data.resume.education
      .map(
        (e) => `
          <div class="timeline-item">
            <h4>${e.name} - ${e.inst}</h4>
            <span>${e.dates}</span>
            <p>${e.percentage}</p>
          </div>
        `,
      )
      .join("")}
  `;

  decorateEditor();
  setEditorStatus(statusMessage);
}

function updateExperience(index) {
  const item = document.querySelectorAll("#resume-experience .timeline-item")[index];
  const data = E.data.resume.experience[index];
  if (!item || !data) return;
  item.innerHTML = `<h4>${data.role} @ ${data.company}</h4><span>${data.dates}</span><p>${data.desc}</p>`;
}

function rerenderExperienceEditor(statusMessage = "Unsaved changes") {
  const wrap = document.getElementById("resume-experience");
  if (!wrap) return;

  const previewMarkup = E.data.resume.pdfUrl
    ? `
      <div style="margin-top:30px; text-align:center;">
        <a href="${E.data.resume.pdfUrl}" target="_blank" rel="noopener" style="text-decoration:none;">
          <div style="position:relative; display:inline-block; border-radius:20px; overflow:hidden;">
            <img
              src="${E.data.resume.pdfPreview || "assets/preview.webp"}"
              alt="Resume Preview"
              class="resume-img"
              style="width:100%; max-width:500px; display:block; border-radius:20px; filter:blur(1px); transition:0.3s;"
            />
            <div class="resume-overlay" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; opacity:1; transition:0.3s;">
              <i class="fas fa-eye" style="color:grey; font-size:32px;"></i>
            </div>
          </div>
        </a>
      </div>
    `
    : "";

  wrap.innerHTML = `
    <h3>About</h3>
    ${E.data.resume.experience
      .map(
        (x) => `
          <div class="timeline-item">
            <h4>${x.role} @ ${x.company}</h4>
            <span>${x.dates}</span>
            <p>${x.desc}</p>
          </div>
        `,
      )
      .join("")}
    ${previewMarkup}
  `;

  document.querySelectorAll(".resume-overlay").forEach((overlay) => {
    const parent = overlay.parentElement;
    if (!parent) return;
    parent.onmouseenter = () => {
      overlay.style.opacity = "1";
    };
    parent.onmouseleave = () => {
      overlay.style.opacity = "0";
    };
  });

  decorateEditor();
  setEditorStatus(statusMessage);
}

function updateSkill(index) {
  const item = document.querySelectorAll("#technical-skills-grid .skill")[index];
  const data = E.data.resume.technicalSkills[index];
  if (!item || !data) return;
  item.innerHTML = `<i class="${data.icon}"></i><span>${data.name}</span>`;
}

function rerenderSkillsEditor(statusMessage = "Unsaved changes") {
  const grid = document.getElementById("technical-skills-grid");
  if (!grid) return;

  grid.innerHTML = E.data.resume.technicalSkills
    .map((skill) => `<div class="skill"><i class="${skill.icon}"></i><span>${skill.name}</span></div>`)
    .join("");

  decorateEditor();
  setEditorStatus(statusMessage);
}

function updateCertification(index) {
  const item = document.querySelectorAll("#certifications-grid .cert-card")[index];
  const data = E.data.certifications[index];
  if (!item || !data) return;
  item.innerHTML = `
    <div class="cert-card-image-wrapper"><img src="${data.image || "assets/cert-placeholder.png"}" alt="${data.name}" loading="lazy" /></div>
    <div class="cert-card-body"><h4>${data.name}</h4><p class="cert-provider"><strong>${data.provider}</strong> • ${data.date}</p><p>${data.desc}</p></div>
  `;
}

function rerenderConnectionsEditor(statusMessage = "Unsaved changes") {
  if (typeof renderConnections !== "function") return location.reload();
  const grid = document.getElementById("connections-grid");
  if (!grid) return;
  window.connectionsData = E.data.connections.colleagues;
  window.connectionsPriorityMap = E.data.connections.priority || {};
  const activeCategory =
    document.querySelector("#connections-categories .cat-tab.active")?.dataset.category || "All";
  renderConnections(E.data.connections.colleagues, grid, activeCategory);
  decorateEditor();
  setEditorStatus(statusMessage);
}

function rerenderCertificationsEditor(statusMessage = "Unsaved changes") {
  if (typeof renderCertifications !== "function") return location.reload();
  renderCertifications(E.data.certifications);
  decorateEditor();
  setEditorStatus(statusMessage);
}

function insertAddConnectionCard() {
  const slider = document.getElementById("connections-slider");
  if (!slider) return;
  const slide = document.createElement("div");
  slide.className = "slide-item editor-add-slide";
  slide.innerHTML = `
    <button type="button" class="editor-add-panel" data-edit-kind="addConnection" aria-label="Add new person">
      <span class="editor-add-panel__plus"><i class="fas fa-plus"></i></span>
      <strong>Add New Person</strong>
      <span>Click to create a new connection card</span>
    </button>
  `;
  const slides = slider.querySelectorAll(".slide-item");
  if (slides.length > 1) {
    slides[1].insertAdjacentElement("beforebegin", slide);
  } else {
    slider.appendChild(slide);
  }
}

function insertAddConnectionShortcut() {
  const grid = document.getElementById("connections-grid");
  const sliderContainer = grid?.querySelector(".slider-container");
  if (!grid || !sliderContainer) return;

  const shortcut = document.createElement("button");
  shortcut.type = "button";
  shortcut.className = "editor-add-shortcut";
  shortcut.setAttribute("data-edit-kind", "addConnection");
  shortcut.setAttribute("aria-label", "Add new person");
  shortcut.innerHTML = `
    <span class="editor-add-shortcut__icon"><i class="fas fa-plus"></i></span>
    <span class="editor-add-shortcut__text">
      <strong>Add New Person</strong>
      <small>Create a new connection card</small>
    </span>
  `;

  sliderContainer.insertAdjacentElement("beforebegin", shortcut);
}

function insertAddInterestShortcut() {
  const interests = document.getElementById("about-interests");
  const list = interests?.querySelector("ul");
  if (!interests || !list) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "editor-add-shortcut editor-add-shortcut--inline";
  button.setAttribute("data-edit-kind", "addInterest");
  button.setAttribute("aria-label", "Add interest");
  button.innerHTML = `
    <span class="editor-add-shortcut__icon"><i class="fas fa-plus"></i></span>
    <span class="editor-add-shortcut__text">
      <strong>Add Interest</strong>
      <small>Create a new interest chip</small>
    </span>
  `;

  list.insertAdjacentElement("beforebegin", button);
}

function insertAddEducationShortcut() {
  const wrap = document.getElementById("resume-education");
  if (!wrap) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "editor-add-shortcut editor-add-shortcut--inline";
  button.setAttribute("data-edit-kind", "addEducation");
  button.setAttribute("aria-label", "Add education");
  button.innerHTML = `
    <span class="editor-add-shortcut__icon"><i class="fas fa-plus"></i></span>
    <span class="editor-add-shortcut__text">
      <strong>Add Education</strong>
      <small>Create a new education entry</small>
    </span>
  `;

  wrap.insertAdjacentElement("beforebegin", button);
}

function insertAddExperienceShortcut() {
  const wrap = document.getElementById("resume-experience");
  if (!wrap) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "editor-add-shortcut editor-add-shortcut--inline";
  button.setAttribute("data-edit-kind", "addExperience");
  button.setAttribute("aria-label", "Add experience");
  button.innerHTML = `
    <span class="editor-add-shortcut__icon"><i class="fas fa-plus"></i></span>
    <span class="editor-add-shortcut__text">
      <strong>Add Experience</strong>
      <small>Create a new experience entry</small>
    </span>
  `;

  wrap.insertAdjacentElement("beforebegin", button);
}

function insertAddCategoryShortcut() {
  const categories = document.getElementById("connections-categories");
  if (!categories) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "editor-add-shortcut editor-add-shortcut--inline";
  button.setAttribute("data-edit-kind", "addCategory");
  button.setAttribute("aria-label", "Add category");
  button.innerHTML = `
    <span class="editor-add-shortcut__icon"><i class="fas fa-plus"></i></span>
    <span class="editor-add-shortcut__text">
      <strong>Add Category</strong>
      <small>Create a new connection category</small>
    </span>
  `;

  categories.insertAdjacentElement("afterend", button);
}

function insertAddSkillShortcut() {
  const grid = document.getElementById("technical-skills-grid");
  if (!grid || grid.previousElementSibling?.classList.contains("editor-add-shortcut")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "editor-add-shortcut editor-add-shortcut--inline";
  button.setAttribute("data-edit-kind", "addSkill");
  button.setAttribute("aria-label", "Add skill");
  button.innerHTML = `
    <span class="editor-add-shortcut__icon"><i class="fas fa-plus"></i></span>
    <span class="editor-add-shortcut__text">
      <strong>Add Skill</strong>
      <small>Create a new technical skill card</small>
    </span>
  `;

  grid.insertAdjacentElement("beforebegin", button);
}

function insertPriorityShortcut() {
  const categories = document.getElementById("connections-categories");
  if (!categories) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "editor-add-shortcut editor-add-shortcut--inline";
  button.setAttribute("data-edit-kind", "editPriority");
  button.setAttribute("aria-label", "Edit priority settings");
  button.innerHTML = `
    <span class="editor-add-shortcut__icon"><i class="fas fa-sliders"></i></span>
    <span class="editor-add-shortcut__text">
      <strong>Edit Priority</strong>
      <small>Manage priority codes for each category</small>
    </span>
  `;

  const nextSibling = categories.nextElementSibling;
  if (nextSibling) {
    nextSibling.insertAdjacentElement("afterend", button);
  } else {
    categories.insertAdjacentElement("afterend", button);
  }
}

function openPriorityEditor() {
  const categories = (E.data?.connections?.categories || []).filter(Boolean);
  const priority = E.data?.connections?.priority || {};

  openModal(
    "Edit Priority Settings",
    categories.map((category) => ({
      name: normalizePriorityFieldName(category),
      label: `${category} priority codes`,
      type: "textarea",
    })),
    Object.fromEntries(
      categories.map((category) => [
        normalizePriorityFieldName(category),
        Array.isArray(priority[category]) ? priority[category].join(", ") : "",
      ]),
    ),
    (values) => {
      if (!E.data.connections.priority) {
        E.data.connections.priority = {};
      }

      categories.forEach((category) => {
        const key = normalizePriorityFieldName(category);
        const raw = String(values[key] || "");
        E.data.connections.priority[category] = raw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      });

      setEditorStatus("Priority updated");
    },
    {
      wide: true,
      helperHtml: buildPriorityHelperHtml(categories),
    },
  );
}

function normalizePriorityFieldName(category) {
  return `priority_${String(category).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

function buildPriorityHelperHtml(categories) {
  const colleagues = E.data?.connections?.colleagues || [];

  return `
    <div class="editor-priority-help">
      <h3>Reference</h3>
      <p class="editor-helper">Copy from the list below and paste into the matching category priority field.</p>
      ${categories
        .filter((category) => category !== "All")
        .map((category) => {
          const items = colleagues.filter((person) => person.category === category);
          return `
            <section class="editor-priority-group">
              <h4>${escapeHtml(category)}</h4>
              ${
                items.length
                  ? items
                      .map(
                        (person) => `
                          <div class="editor-priority-item">
                            <span>${escapeHtml(person.name || "Unnamed")} : ${escapeHtml(person.code || "-")}</span>
                            <button type="button" class="editor-icon-btn editor-icon-btn--copy" data-copy-text="${escapeHtml(
                              person.code || "",
                            )}" aria-label="Copy ${escapeHtml(person.code || "")}">
                              <i class="fas fa-copy"></i>
                              <span>Copy</span>
                            </button>
                          </div>
                        `,
                      )
                      .join("")
                  : `<p class="editor-helper">No people in this category yet.</p>`
              }
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

async function copyToClipboard(text) {
  if (!text) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      setEditorStatus(`Copied ${text}`);
      return;
    }
  } catch (error) {
    console.error(error);
  }

  const temp = document.createElement("input");
  temp.value = text;
  document.body.appendChild(temp);
  temp.select();
  document.execCommand("copy");
  temp.remove();
  setEditorStatus(`Copied ${text}`);
}

function insertAddCertificationCard() {
  const slider = document.getElementById("certifications-slider");
  if (!slider) return;
  const card = document.createElement("button");
  card.type = "button";
  card.className = "cert-card editor-add-panel";
  card.setAttribute("data-edit-kind", "addCertification");
  card.setAttribute("aria-label", "Add new certification");
  card.innerHTML = `
    <span class="editor-add-panel__plus"><i class="fas fa-plus"></i></span>
    <strong>Add New Certification</strong>
    <span>Click to create a new certification card</span>
  `;
  slider.appendChild(card);
}

function updateResumeMedia() {
  const previewLink = document.querySelector("#resume-experience a[href]");
  const previewImg = document.querySelector("#resume-experience .resume-img");
  if (previewLink) previewLink.href = E.data.resume.pdfUrl || "#";
  if (previewImg) previewImg.src = E.data.resume.pdfPreview || "assets/preview.webp";
}

function updateConnection(index, previousName) {
  const data = E.data.connections.colleagues[index];
  if (!data) return;

  const cards = Array.from(document.querySelectorAll("#connections-slider .colleague-card"));
  cards.forEach((card) => {
    const nameEl = card.querySelector("h4");
    if (!nameEl) return;
    const currentName = nameEl.textContent?.trim();
    if (currentName !== previousName && currentName !== data.name) return;

    const img = card.querySelector(".colleague-img-container img");
    const spec = card.querySelector(".single-line");
    const work = card.querySelector(".work-details");
    const social = card.querySelector(".col-social");

    if (img) {
      img.src = data.image || "assets/codeLogo.webp";
      img.alt = data.name;
    }
    nameEl.textContent = data.name;
    if (spec) spec.textContent = data.spec;
    if (work) {
      work.innerHTML = `<strong>Work:</strong> ${data.working} • ${data.exp}${data.workDesc ? `<br><small>${data.workDesc}</small>` : ""}`;
    }
    if (social) {
      social.innerHTML = buildConnectionSocial(data);
    }
  });
}

function buildConnectionSocial(data) {
  const icons = E.data.socialIcons || {};
  const links = [];

  if (data.email) links.push(`<a href="mailto:${data.email}" aria-label="Email ${data.name}"><i class="${icons.email || "fas fa-envelope"}"></i></a>`);
  if (data.phone) links.push(`<a href="tel:${data.phone}" aria-label="Call ${data.name}"><i class="${icons.phone || "fas fa-phone"}"></i></a>`);
  if (data.linkedin) links.push(`<a href="${data.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn ${data.name}"><i class="${icons.linkedin || "fab fa-linkedin-in"}"></i></a>`);
  if (data.facebook) links.push(`<a href="${data.facebook}" target="_blank" rel="noopener" aria-label="Facebook ${data.name}"><i class="${icons.facebook || "fab fa-facebook-f"}"></i></a>`);
  if (data.instagram) links.push(`<a href="${data.instagram}" target="_blank" rel="noopener" aria-label="Instagram ${data.name}"><i class="${icons.instagram || "fab fa-instagram"}"></i></a>`);
  if (data.x) links.push(`<a href="${data.x}" target="_blank" rel="noopener" aria-label="X ${data.name}"><i class="${icons.x || "fa-brands fa-x-twitter"}"></i></a>`);
  if (data.href) links.push(`<a href="${data.href}" target="_blank" rel="noopener" aria-label="Website ${data.name}"><i class="${icons.website || "fas fa-globe"}"></i></a>`);

  return links.join("");
}

async function saveJson() {
  if (!E.data) return;
  const text = `${JSON.stringify(E.data, null, 2)}\n`;
  try {
    if ("showSaveFilePicker" in window) {
      if (!E.fileHandle) {
        E.fileHandle = await window.showSaveFilePicker({
          suggestedName: "display.json",
          types: [{ description: "JSON files", accept: { "application/json": [".json"] } }],
        });
      }
      const writable = await E.fileHandle.createWritable();
      await writable.write(text);
      await writable.close();
      E.original = JSON.parse(JSON.stringify(E.data));
      return setEditorStatus("Saved to JSON file");
    }
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "display.json";
    a.click();
    URL.revokeObjectURL(url);
    setEditorStatus("JSON downloaded");
  } catch (error) {
    console.error(error);
    setEditorStatus("Save cancelled");
  }
}

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEditor);
} else {
  initEditor();
}
