(function initPetLiveWebShellAccountChrome(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

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
   * DOM querySelector / setAccountAvatar stay in the facade.
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

  root.shell.glassChromeNavAccountMarkup = glassChromeNavAccountMarkup;
  root.shell.glassChromeActionsMarkup = glassChromeActionsMarkup;
  root.shell.buildAccountChromePresentation = buildAccountChromePresentation;
})(typeof window !== "undefined" ? window : globalThis);
