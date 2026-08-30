(function initPetLiveWebI18nPaint(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  const ATTR_HANDLERS = [
    [
      "data-i18n",
      function applyText(el, key, t) {
        el.textContent = t(key);
      },
    ],
    [
      "data-i18n-html",
      function applyHtml(el, key, t) {
        el.innerHTML = t(key);
      },
    ],
    [
      "data-i18n-placeholder",
      function applyPlaceholder(el, key, t) {
        el.setAttribute("placeholder", t(key));
      },
    ],
    [
      "data-i18n-aria",
      function applyAria(el, key, t) {
        el.setAttribute("aria-label", t(key));
      },
    ],
    [
      "data-i18n-title",
      function applyTitle(el, key, t) {
        el.setAttribute("title", t(key));
      },
    ],
  ];

  function applyI18nNode(el, t) {
    if (!el || el.nodeType !== 1 || typeof t !== "function") return;
    for (let i = 0; i < ATTR_HANDLERS.length; i += 1) {
      const attr = ATTR_HANDLERS[i][0];
      const apply = ATTR_HANDLERS[i][1];
      const key = el.getAttribute(attr);
      if (key) apply(el, key, t);
    }
  }

  function applyI18nInScope(scopeRoot, t) {
    if (!scopeRoot || typeof scopeRoot.querySelectorAll !== "function") return;
    if (typeof t !== "function") return;
    applyI18nNode(scopeRoot, t);
    for (let i = 0; i < ATTR_HANDLERS.length; i += 1) {
      const attr = ATTR_HANDLERS[i][0];
      const apply = ATTR_HANDLERS[i][1];
      const nodes = scopeRoot.querySelectorAll("[" + attr + "]");
      for (let n = 0; n < nodes.length; n += 1) {
        const key = nodes[n].getAttribute(attr);
        if (key) apply(nodes[n], key, t);
      }
    }
  }

  function collectActiveI18nRoots(doc) {
    if (!doc || typeof doc.querySelector !== "function") return [];
    return [
      doc.querySelector("#app .screen.is-active"),
      doc.querySelector(".glass-dock"),
      doc.getElementById("lang-switcher"),
      doc.getElementById("toast"),
      doc.querySelector(".surface-c-banner"),
      doc.querySelector(".app-nav-panel"),
      doc.querySelector(".account-popover"),
      doc.getElementById("proof-lightbox"),
      doc.querySelector(".photo-crop"),
    ].filter(Boolean);
  }

  function paintLangChrome(doc, t, currentLang) {
    if (!doc || typeof t !== "function") return;
    if (doc.documentElement) doc.documentElement.lang = t("htmlLang");
    if (typeof doc.title === "string" || doc.title === "") {
      doc.title = t("docTitle");
    }
    const fab = doc.getElementById("lang-fab");
    if (fab) fab.textContent = t("langFab");
    const menuBtns = doc.querySelectorAll("#lang-menu [data-lang]");
    for (let i = 0; i < menuBtns.length; i += 1) {
      menuBtns[i].classList.toggle(
        "is-active",
        menuBtns[i].dataset.lang === currentLang
      );
    }
  }

  function applyI18nPaint(doc, t, options) {
    const opts = options || {};
    const currentLang = opts.currentLang;
    paintLangChrome(doc, t, currentLang);
    if (opts.full) {
      applyI18nInScope(doc, t);
      return;
    }
    const roots = collectActiveI18nRoots(doc);
    for (let i = 0; i < roots.length; i += 1) {
      applyI18nInScope(roots[i], t);
    }
  }

  root.shell.applyI18nNode = applyI18nNode;
  root.shell.applyI18nInScope = applyI18nInScope;
  root.shell.collectActiveI18nRoots = collectActiveI18nRoots;
  root.shell.applyI18nPaint = applyI18nPaint;
})(typeof window !== "undefined" ? window : globalThis);
