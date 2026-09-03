(function initPetLiveWebShellFeatureHub(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Shortcut strip for feature-buttons screen.
   * Vaccine control uses fh-* ids so the emergency card can keep e-* originals.
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
    id="fh-vaccine-btn"
    data-go="vaccines"
    role="button"
    tabindex="0"
  >
    <span class="e-vaccine-label">
      <span data-i18n="vaccine">疫苗</span>
      <span class="e-vax-lights" id="fh-vax-lights" role="img" aria-label="">
        <i class="e-vax-dot is-green" data-status="protected" title="薄荷：防護中"></i>
        <i class="e-vax-dot is-orange" data-status="approaching" title="暖橘：即將到期"></i>
        <i class="e-vax-dot is-red" data-status="expired" title="玫瑰：已到期／需留意"></i>
      </span>
      <button
        type="button"
        class="e-vax-help"
        id="fh-vax-help"
        data-i18n-aria="vaxLightsHelpAria"
        data-i18n-title="vaxLightsHelpTitle"
        aria-label="疫苗燈號說明"
        aria-expanded="false"
        aria-controls="fh-vax-help-pop"
        title="燈號說明"
      >
        ?
      </button>
    </span>
    <small id="fh-vaccine-next" data-i18n="nextDueDash">下次 —</small>
    <div
      class="e-vax-help-pop"
      id="fh-vax-help-pop"
      hidden
      role="dialog"
      aria-labelledby="fh-vax-help-title"
    >
      <p class="e-vax-help-title" id="fh-vax-help-title" data-i18n="vaxLightsHelpTitle">
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
   * Mount shortcut body into #feature-hub.
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
      !host.querySelector("#fh-vaccine-btn") ||
      !host.querySelector("#fh-vax-lights") ||
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
        if (btn.id === "fh-vaccine-btn") {
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

  /**
   * Emergency-card vaccine lights help popover (#e-vax-help).
   * @param {Document} doc
   * @param {boolean} open
   */
  function setVaxHelpOpen(doc, open) {
    if (!doc || typeof doc.getElementById !== "function") return;
    const helpBtn = doc.getElementById("e-vax-help");
    const pop = doc.getElementById("e-vax-help-pop");
    if (!helpBtn || !pop) return;
    pop.hidden = !open;
    helpBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  /**
   * Feature-hub vaccine lights help popover (#fh-vax-help).
   * @param {Document} doc
   * @param {boolean} open
   */
  function setFeatureHubVaxHelpOpen(doc, open) {
    if (!doc || typeof doc.getElementById !== "function") return;
    const helpBtn = doc.getElementById("fh-vax-help");
    const pop = doc.getElementById("fh-vax-help-pop");
    if (!helpBtn || !pop) return;
    pop.hidden = !open;
    helpBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function closeAllVaxHelp(doc) {
    setVaxHelpOpen(doc, false);
    setFeatureHubVaxHelpOpen(doc, false);
  }

  /**
   * Wire feature-hub ? button (idempotent via data-vax-help-wired).
   * Opening the hub popover closes the emergency-card popover.
   */
  function bindFeatureHubVaxHelp(doc) {
    if (!doc || typeof doc.getElementById !== "function") return null;
    const helpBtn = doc.getElementById("fh-vax-help");
    const pop = doc.getElementById("fh-vax-help-pop");
    if (!helpBtn || !pop || helpBtn.getAttribute("data-vax-help-wired") === "1") {
      return null;
    }
    helpBtn.setAttribute("data-vax-help-wired", "1");
    helpBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const willOpen = Boolean(pop.hidden);
      pop.hidden = !willOpen;
      helpBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
      if (willOpen) setVaxHelpOpen(doc, false);
    });
    pop.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    return helpBtn;
  }

  /**
   * Wire emergency-card ? button + document outside-click dismiss for both
   * popovers. Escape stays with the facade so it can also close the proof lightbox.
   */
  function bindEmergencyVaxHelp(doc) {
    if (!doc || typeof doc.getElementById !== "function") return null;
    const helpBtn = doc.getElementById("e-vax-help");
    const pop = doc.getElementById("e-vax-help-pop");
    if (helpBtn && helpBtn.getAttribute("data-vax-help-wired") !== "1") {
      helpBtn.setAttribute("data-vax-help-wired", "1");
      helpBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const nextOpen = Boolean(pop?.hidden);
        setVaxHelpOpen(doc, nextOpen);
      });
    }
    if (pop && pop.getAttribute("data-vax-help-wired") !== "1") {
      pop.setAttribute("data-vax-help-wired", "1");
      pop.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    }
    if (doc.documentElement?.getAttribute("data-vax-help-dismiss") !== "1") {
      doc.documentElement?.setAttribute("data-vax-help-dismiss", "1");
      doc.addEventListener("click", (event) => {
        if (
          event.target.closest?.(
            "#e-vax-help, #e-vax-help-pop, #fh-vax-help, #fh-vax-help-pop"
          )
        ) {
          return;
        }
        closeAllVaxHelp(doc);
      });
    }
    return helpBtn;
  }

  root.shell.featureHubBodyMarkup = featureHubBodyMarkup;
  root.shell.ensureFeatureHub = ensureFeatureHub;
  root.shell.setVaxHelpOpen = setVaxHelpOpen;
  root.shell.setFeatureHubVaxHelpOpen = setFeatureHubVaxHelpOpen;
  root.shell.closeAllVaxHelp = closeAllVaxHelp;
  root.shell.bindFeatureHubVaxHelp = bindFeatureHubVaxHelp;
  root.shell.bindEmergencyVaxHelp = bindEmergencyVaxHelp;
})(typeof window !== "undefined" ? window : globalThis);
