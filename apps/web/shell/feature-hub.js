(function initPetLiveWebShellFeatureHub(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Five emergency-card shortcuts (timeline / alerts / vaccines / imaging / labs).
   * No shared IDs with the emergency screen — paint/status stays on the card.
   */
  function featureHubBodyMarkup() {
    return `
<nav class="e-quick-nav feature-hub-quick" data-i18n-aria="detailNav" aria-label="此寵物的詳細紀錄">
  <button type="button" data-go="timeline">
    <span data-i18n="timelineNav">時間軸</span>
    <small data-i18n="timelineNavSub">就診與用藥</small>
  </button>
  <button type="button" class="e-nav-alerts" data-go="alerts">
    <span data-i18n="alertsTitle">醫療警示</span>
    <small data-i18n="alertsNavSub">過敏／慢性病</small>
  </button>
  <button type="button" class="e-vax-nav feature-hub-vax" data-go="vaccines">
    <span data-i18n="vaccine">疫苗</span>
    <small data-i18n="featureHubVaxSub">接種與到期</small>
  </button>
</nav>
<nav class="e-docs-nav feature-hub-docs" data-i18n-aria="eDocsNav" aria-label="影像與檢驗資料">
  <button type="button" class="e-docs-btn" data-go="imaging">
    <span data-i18n="eXrayTitle">X-Ray&超音波 影像</span>
    <small data-i18n="eXraySubEmpty">尚未存檔</small>
  </button>
  <button type="button" class="e-docs-btn" data-go="labs">
    <span data-i18n="eLabTitle">血檢報告／檢驗報告</span>
    <small data-i18n="eLabSubEmpty">尚未存檔</small>
  </button>
</nav>`;
  }

  /**
   * Mount shortcut body once into #feature-hub; wire data-go via onGo.
   * @param {Document} doc
   * @param {{ onGo?: (screen: string) => void }} [hooks]
   */
  function ensureFeatureHub(doc, hooks = {}) {
    if (!doc || typeof doc.getElementById !== "function") return null;
    const host = doc.getElementById("feature-hub");
    if (!host) return null;
    const { onGo } = hooks;

    if (host.getAttribute("data-feature-hub-wired") !== "1") {
      host.innerHTML = featureHubBodyMarkup();
      host.setAttribute("data-feature-hub-wired", "1");
    }

    if (typeof onGo === "function") {
      host.querySelectorAll("[data-go]").forEach((btn) => {
        if (btn.getAttribute("data-nav-wired") === "1") return;
        btn.setAttribute("data-nav-wired", "1");
        btn.addEventListener("click", (event) => {
          event.preventDefault();
          const screen = btn.getAttribute("data-go");
          if (screen) onGo(screen);
        });
      });
    }
    return host;
  }

  root.shell.featureHubBodyMarkup = featureHubBodyMarkup;
  root.shell.ensureFeatureHub = ensureFeatureHub;
})(typeof window !== "undefined" ? window : globalThis);
