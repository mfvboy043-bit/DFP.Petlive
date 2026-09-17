(function initPetLiveWebShellAccountChrome(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  const LEGAL_DOC_VERSION = "20260917-legal-v14";
  const LEGAL_LOCALES = ["zh-Hant", "en", "ja", "ko"];

  function normalizeLegalLocale(locale) {
    const raw = String(locale || "").trim();
    if (LEGAL_LOCALES.includes(raw)) return raw;
    const lower = raw.toLowerCase();
    if (lower === "zh" || lower === "zh-tw" || lower === "zh-hant") return "zh-Hant";
    if (lower === "en" || lower.startsWith("en-")) return "en";
    if (lower === "ja" || lower.startsWith("ja-")) return "ja";
    if (lower === "ko" || lower.startsWith("ko-")) return "ko";
    return "zh-Hant";
  }

  /**
   * Build privacy policy URL for account chrome.
   * @param {{ basePath?: string, locale?: string, version?: string }} opts
   *   basePath e.g. "../legal/privacy.html" (C) or "./legal/privacy.html" (B)
   */
  function privacyDocHref(opts = {}) {
    const basePath = String(opts.basePath || "./legal/privacy.html");
    const version = String(opts.version || LEGAL_DOC_VERSION);
    const locale = normalizeLegalLocale(opts.locale);
    const joiner = basePath.includes("?") ? "&" : "?";
    return `${basePath}${joiner}v=${encodeURIComponent(version)}&lang=${encodeURIComponent(locale)}`;
  }

  function glassChromeNavAccountMarkup() {
    return `
      <div class="app-nav-menu">
        <button
          class="app-nav-btn js-app-nav-btn"
          type="button"
          aria-expanded="false"
          aria-haspopup="true"
          aria-controls="app-nav-panel"
          data-i18n-aria="navMenuAria"
          aria-label="頁面選單"
        >
          <span class="app-nav-label app-nav-label-closed" aria-hidden="true">
            <span class="app-nav-flank">＝</span><span class="app-nav-word" data-i18n="navMenuLabel">選單</span><span class="app-nav-flank">＝</span>
          </span>
          <span class="app-nav-label app-nav-label-open" aria-hidden="true" hidden>
            <span class="app-nav-flank">×</span><span class="app-nav-word" data-i18n="navMenuLabel">選單</span><span class="app-nav-flank">×</span>
          </span>
        </button>
      </div>
      <div class="account-menu">
        <button
          class="account-chip js-account-chip"
          type="button"
          aria-expanded="false"
          aria-haspopup="true"
          aria-controls="account-popover"
          data-i18n-aria="accountChipAria"
          aria-label="帳號選單"
        >
          <img class="account-chip-avatar" alt="" width="28" height="28" hidden />
          <span class="account-chip-fallback" aria-hidden="true">?</span>
          <span class="account-chip-name"></span>
        </button>
      </div>
  `;
  }

  function glassChromeActionsMarkup() {
    return `
    <div class="screen-head-actions" data-glass-chrome>
      ${glassChromeNavAccountMarkup()}
    </div>
  `;
  }

  /**
   * Pure presentation decisions for account chrome paint.
   */
  function buildAccountChromePresentation(session, { fallbackLabel } = {}) {
    const signedIn = Boolean(session?.signedIn);
    if (!signedIn) {
      return {
        signedIn: false,
        hideOwnerGear: true,
        hideAccountMenus: true,
      };
    }
    const profile = session.profile || {};
    const email = String(profile.email || "").trim();
    const name = String(profile.name || "").trim();
    const picture = String(profile.picture || "").trim();
    const fallback = fallbackLabel || "?";
    const displayName = name || email || fallback;
    const initialSource = name || email || fallback;
    const initial = initialSource.charAt(0).toUpperCase() || "?";
    return {
      signedIn: true,
      hideOwnerGear: true,
      hideAccountMenus: false,
      email,
      name,
      picture,
      displayName,
      initial,
      showSyncActions: true,
      hideConflictHint: true,
    };
  }

  function setAccountAvatar(imgEl, fallbackEl, picture, initial) {
    if (imgEl) {
      if (picture) {
        imgEl.src = picture;
        imgEl.hidden = false;
      } else {
        imgEl.removeAttribute("src");
        imgEl.hidden = true;
      }
    }
    if (fallbackEl) {
      fallbackEl.textContent = initial || "?";
      fallbackEl.hidden = Boolean(picture);
    }
  }

  function closeAccountMenu(doc) {
    if (!doc || typeof doc.getElementById !== "function") return;
    const popover = doc.getElementById("account-popover");
    if (popover) popover.hidden = true;
    doc.querySelectorAll(".js-account-chip").forEach((chip) => {
      chip.setAttribute("aria-expanded", "false");
    });
  }

  function positionAccountPopover(doc, win, anchorChip) {
    if (!doc || typeof doc.getElementById !== "function") return;
    const popover = doc.getElementById("account-popover");
    if (!popover || !anchorChip) return;
    const rect = anchorChip.getBoundingClientRect();
    const innerWidth =
      (win && typeof win.innerWidth === "number" && win.innerWidth) ||
      320;
    const width = Math.min(300, innerWidth - 28);
    let left = rect.right - width;
    left = Math.min(Math.max(14, left), innerWidth - width - 14);
    popover.style.top = `${Math.max(rect.bottom + 10, 12)}px`;
    popover.style.left = `${left}px`;
    popover.style.right = "auto";
  }

  /**
   * Apply presentation view to account chrome element map (queried from doc).
   * Facade supplies syncStatusText / chipAriaLabel; no auth brain here.
   */
  function applyAccountMenuPaint(doc, view, opts = {}) {
    if (!doc || typeof doc.getElementById !== "function" || !view) return;
    const { syncStatusText = "", chipAriaLabel = "", legalPrivacyHref = "" } = opts;

    const ownerBtn = doc.getElementById("owner-settings-btn");
    const homeMenu = doc.getElementById("account-menu");
    const chips = doc.querySelectorAll(".js-account-chip");
    const popName = doc.getElementById("account-popover-name");
    const popEmail = doc.getElementById("account-popover-email");
    const popAvatar = doc.getElementById("account-popover-avatar");
    const popFallback = doc.getElementById("account-popover-fallback");
    const planValue = doc.getElementById("account-popover-plan-value");
    const legalLink = doc.getElementById("account-popover-legal");

    if (ownerBtn) ownerBtn.hidden = view.hideOwnerGear;
    if (homeMenu) homeMenu.hidden = view.hideAccountMenus;
    doc.querySelectorAll(".screen-head-actions .account-menu").forEach((el) => {
      el.hidden = view.hideAccountMenus;
    });

    if (!view.signedIn) {
      closeAccountMenu(doc);
      return;
    }

    const { email, picture, displayName, initial } = view;

    chips.forEach((chip) => {
      const chipAvatar = chip.querySelector(".account-chip-avatar");
      const chipFallback = chip.querySelector(".account-chip-fallback");
      const chipName = chip.querySelector(".account-chip-name");
      if (chipName) chipName.textContent = displayName;
      if (chipAriaLabel) chip.setAttribute("aria-label", chipAriaLabel);
      chip.title = displayName;
      setAccountAvatar(chipAvatar, chipFallback, picture, initial);
    });

    if (popName) popName.textContent = displayName;
    if (popEmail) {
      popEmail.textContent = email;
      popEmail.hidden = !email;
    }
    if (planValue) {
      planValue.textContent = syncStatusText;
    }
    if (legalLink && legalPrivacyHref) {
      legalLink.setAttribute("href", legalPrivacyHref);
    }

    const popSyncBtn = doc.getElementById("account-popover-edit");
    const popRestoreBtn = doc.getElementById("account-popover-restore");
    const conflictHint = doc.getElementById("account-popover-conflict-hint");
    if (popSyncBtn) {
      popSyncBtn.hidden = !view.showSyncActions;
      popSyncBtn.disabled = false;
    }
    if (popRestoreBtn) {
      popRestoreBtn.hidden = !view.showSyncActions;
      popRestoreBtn.disabled = false;
    }
    if (conflictHint) conflictHint.hidden = view.hideConflictHint;

    setAccountAvatar(popAvatar, popFallback, picture, initial);
  }

  /** Intro login / account / avatar visibility from session.signedIn + picture. */
  function applyIntroCloudVisibility(els, session) {
    if (!els) return;
    const signedIn = Boolean(session?.signedIn);
    if (els.loginBtn) els.loginBtn.hidden = signedIn;
    if (els.account) els.account.hidden = !signedIn;
    if (els.avatar) {
      const picture = session?.profile?.picture;
      if (picture) {
        els.avatar.src = picture;
        els.avatar.hidden = false;
      } else {
        els.avatar.removeAttribute("src");
        els.avatar.hidden = true;
      }
    }
  }

  /**
   * Origin-hint copy decision. Facade supplies already-translated strings so
   * shell does not call t(). Bit-for-bit with prior facade branches.
   */
  function resolveOriginHint({ configured, origin } = {}, copy = {}) {
    const originStr = String(origin || "");
    const isLanHttp =
      /^http:\/\/(\d{1,3}\.){3}\d{1,3}(:\d+)?$/i.test(originStr) ||
      /^http:\/\/[^.]+\.local(:\d+)?$/i.test(originStr);
    const isLocalhost =
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(originStr);
    if (!configured) {
      return { hidden: false, text: copy.needConfig || "" };
    }
    if (isLanHttp && !isLocalhost) {
      return { hidden: false, text: copy.lanBlocked || "" };
    }
    return { hidden: false, text: copy.originHint || "" };
  }

  root.shell.glassChromeNavAccountMarkup = glassChromeNavAccountMarkup;
  root.shell.glassChromeActionsMarkup = glassChromeActionsMarkup;
  root.shell.buildAccountChromePresentation = buildAccountChromePresentation;
  root.shell.setAccountAvatar = setAccountAvatar;
  root.shell.closeAccountMenu = closeAccountMenu;
  root.shell.positionAccountPopover = positionAccountPopover;
  root.shell.applyAccountMenuPaint = applyAccountMenuPaint;
  root.shell.applyIntroCloudVisibility = applyIntroCloudVisibility;
  root.shell.resolveOriginHint = resolveOriginHint;
  root.shell.privacyDocHref = privacyDocHref;
  root.shell.LEGAL_DOC_VERSION = LEGAL_DOC_VERSION;
})(typeof window !== "undefined" ? window : globalThis);
