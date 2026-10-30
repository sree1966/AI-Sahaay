const LANG_KEY = "ai-sahaay.multilingual.language";
const localeFiles = { en: "en.js", ta: "ta.js", te: "te.js", kn: "kn.js", ml: "ml.js", hi: "hi.js" };
let language = localStorage.getItem(LANG_KEY);
if (!localeFiles[language]) language = "en";
let copy;

const $ = (selector) => document.querySelector(selector);
const languageSelect = $("#language");
languageSelect.value = language;

async function setLanguage(code) {
  if (!localeFiles[code]) code = "en";
  language = code;
  localStorage.setItem(LANG_KEY, code);
  document.documentElement.lang = code;
  copy = (await import(`./i18n/${localeFiles[code]}`)).default;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const value = copy[node.dataset.i18n];
    if (value !== undefined) node.textContent = value;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const value = copy[node.dataset.i18nPlaceholder];
    if (value !== undefined) node.placeholder = value;
  });
  document.querySelectorAll("[data-i18n-option]").forEach((node) => {
    const value = copy[node.dataset.i18nOption];
    if (value !== undefined) node.textContent = value;
  });
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.setAttribute("aria-current", button.classList.contains("active") ? "page" : "false");
  });
}

languageSelect.addEventListener("change", () => setLanguage(languageSelect.value));

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    const page = button.dataset.page;
    document.querySelectorAll(".nav-button").forEach((item) => item.classList.toggle("active", item === button));
    $("#chat-page").hidden = page !== "chat";
    $("#profile-page").hidden = page !== "profile";
  });
});

function showStatus(selector, message, isError = false) {
  const node = $(selector);
  node.hidden = !message;
  node.textContent = message;
  node.classList.toggle("error", isError);
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function safeUrls(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  return [];
}

$("#ask-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = $("#question").value.trim();
  if (!question) return showStatus("#ask-status", copy.invalid, true);
  showStatus("#ask-status", copy.loading);
  $("#ask-button").disabled = true;
  $("#answer-card").hidden = true;
  try {
    const response = await fetch("/api/ask", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, language }),
    });
    if (!response.ok) throw new Error("ask failed");
    const data = await response.json();
    $("#answer-text").textContent = data.answer || copy.noSources;
    const list = $("#sources-list");
    list.replaceChildren();
    for (const source of data.sources || []) {
      const item = make("li", "source-item");
      item.append(make("strong", "", source.scheme_name));
      for (const url of safeUrls(source.official_urls)) {
        try {
          const parsed = new URL(url);
          if (!["https:", "http:"].includes(parsed.protocol)) continue;
          const link = make("a", "source-link", copy.officialLink);
          link.href = parsed.href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          item.append(link);
        } catch { /* Ignore malformed source URLs. */ }
      }
      list.append(item);
    }
    $("#sources-wrap").hidden = !list.children.length;
    $("#answer-card").hidden = false;
    showStatus("#ask-status", "");
  } catch {
    showStatus("#ask-status", copy.askError, true);
  } finally {
    $("#ask-button").disabled = false;
  }
});

$("#profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  showStatus("#recommend-status", copy.loading);
  $("#recommend-button").disabled = true;
  $("#recommendations").replaceChildren();
  const value = (id) => $(`#${id}`).value;
  const profile = {
    language,
    age: value("age") ? Number(value("age")) : null,
    state: value("state"), occupation: value("occupation"),
    income: value("income") ? Number(value("income")) : null,
    category: value("category"), gender: value("gender"), disability: value("disability"),
  };
  try {
    const response = await fetch("/api/recommend", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile),
    });
    if (!response.ok) throw new Error("recommend failed");
    const data = await response.json();
    showStatus("#recommend-status", data.recommendations?.length ? "" : copy.noResults);
    for (const scheme of data.recommendations || []) renderScheme(scheme);
  } catch {
    showStatus("#recommend-status", copy.recommendError, true);
  } finally {
    $("#recommend-button").disabled = false;
  }
});

function renderScheme(scheme) {
  const card = make("article", "scheme-card");
  card.append(make("h3", "scheme-name", scheme.scheme_name));
  if (scheme.match_status) card.append(make("p", "match-status", scheme.match_status));
  for (const [field, label] of [["details", copy.details], ["benefits", copy.benefits], ["eligibility", copy.eligibility], ["documents", copy.documents], ["application", copy.apply]]) {
    if (!scheme[field]) continue;
    const section = make("section", "scheme-section");
    section.append(make("h4", "", label), make("p", "", scheme[field]));
    card.append(section);
  }
  if (scheme.match_reasons?.length) {
    const row = make("p", "match-reasons");
    row.append(make("strong", "", `${copy.matchReasons}: `), document.createTextNode(scheme.match_reasons.join(" · ")));
    card.append(row);
  }
  for (const url of safeUrls(scheme.official_urls)) {
    try {
      const parsed = new URL(url);
      if (!["https:", "http:"].includes(parsed.protocol)) continue;
      const link = make("a", "source-link", copy.officialLink);
      link.href = parsed.href; link.target = "_blank"; link.rel = "noopener noreferrer";
      card.append(link);
    } catch { /* Ignore malformed source URLs. */ }
  }
  $("#recommendations").append(card);
}

setLanguage(language);
