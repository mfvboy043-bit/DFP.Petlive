(function initPetLiveWebShellFeatureHub(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Full emergency-card shortcut strip (same IDs / classes so paint + lights keep working).
   * Lives on the feature-buttons screen only.
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
  <div
    class="e-vax-nav"
    id="e-vaccine-btn"
    data-go="vaccines"
    role="button"
    tabindex="0"
  >
    <span class="e-vaccine-label">
      <span data-i18n="vaccine">疫苗</span>
      <span class="e-vax-lights" id="e-vax-lights" role="img" aria-label="">
        <i class="e-vax-dot is-green" data-status="protected" title="薄荷：防護中"></i>
        <i class="e-vax-dot is-orange" data-status="approaching" title="暖橘：即將到期"></i>
        <i class="e-vax-dot is-red" data-status="expired" title="玫瑰：已到期／需留意"></i>
      </span>
      <button
        type="button"
        class="e-vax-help"
        id="e-vax-help"
        data-i18n-aria="vaxLightsHelpAria"
        data-i18n-title="vaxLightsHelpTitle"
        aria-label="疫苗燈號說明"
        aria-expanded="false"
        aria-controls="e-vax-help-pop"
        title="燈號說明"
      >
        ?
      </button>
    </span>
    <small id="e-vaccine-next" data-i18n="nextDueDash">下次 —</small>
    <div
      class="e-vax-help-pop"
      id="e-vax-help-pop"
      hidden
      role="dialog"
      aria-labelledby="e-vax-help-title"
    >
      <p class="e-vax-help-title" id="e-vax-help-title" data-i18n="vaxLightsHelpTitle">
        燈號說明
      </p>
      <ul class="e-vax-help-list">
        <li>
          <i class="e-vax-dot is-green is-on" aria-hidden="true"></i>
          <span data-i18n="vaxLightGreen">薄荷：防護中</span>
        </li>
        <li>
          <i class="e-vax-dot is-orange is-on" aria-hidden="true"></i>
          <span data-i18n="vaxLightOrange">暖橘：即將到期</span>
        </li>
        <li>
          <i class="e-vax-dot is-red is-on" aria-hidden="true"></i>
          <span data-i18n="vaxLightRed">玫瑰：已到期／需留意</span>
        </li>
      </ul>
    </div>
  </div>
</nav>
<nav class="e-docs-nav feature-hub-docs" data-i18n-aria="eDocsNav" aria-label="影像與檢驗資料">
  <button type="button" class="e-docs-btn" data-e-doc="xray" data-go="imaging" id="e-xray-btn">
    <span data-i18n="eXrayTitle">X-Ray&超音波 影像</span>
    <small id="e-xray-sub" data-i18n="eXraySubEmpty">尚未存檔</small>
  </button>
  <button type="button" class="e-docs-btn" data-e-doc="labs" data-go="labs" id="e-lab-btn">
    <span data-i18n="eLabTitle">血檢報告／檢驗報告</span>
    <small id="e-lab-sub" data-i18n="eLabSubEmpty">尚未存檔</small>
  </button>
</nav>`;
  }

  /**
   * Mount authentic shortcut body into #feature-hub (replace simplified drafts).
   * @param {Document} doc
   * @param {{ onGo?: (screen: string) => void, onMounted?: (host: Element) => void }} [hooks]
   */
  function ensureFeatureHub(doc, hooks = {}) {
    if (!doc || typeof doc.getElementById !== "function") return null;
    const host = doc.getElementById("feature-hub");
    if (!host) return null;
    const { onGo, onMounted } = hooks;

    const needsMount =
      host.getAttribute("data-feature-hub-wired") !== "1" ||
      !host.querySelector("#e-vaccine-btn") ||
      !host.querySelector("#e-vax-lights") ||
      !host.querySelector("#e-xray-btn");

    if (needsMount) {
      host.innerHTML = featureHubBodyMarkup();
      host.setAttribute("data-feature-hub-wired", "1");
      if (typeof onMounted === "function") onMounted(host);
    }

    if (typeof onGo === "function") {
      host.querySelectorAll("[data-go]").forEach((btn) => {
        if (btn.getAttribute("data-nav-wired") === "1") return;
        btn.setAttribute("data-nav-wired", "1");
        const goScreen = () => {
          const screen = btn.getAttribute("data-go");
          if (screen) onGo(screen);
        };
        btn.addEventListener("click", (event) => {
          if (event.target.closest?.(".e-vax-help, .e-vax-help-pop")) return;
          event.preventDefault();
          goScreen();
        });
        if (btn.id === "e-vaccine-btn") {
          btn.addEventListener("keydown", (event) => {
            if (event.target.closest?.(".e-vax-help")) return;
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            goScreen();
          });
        }
      });
    }
    return host;
  }

  root.shell.featureHubBodyMarkup = featureHubBodyMarkup;
  root.shell.ensureFeatureHub = ensureFeatureHub;
})(typeof window !== "undefined" ? window : globalThis);
