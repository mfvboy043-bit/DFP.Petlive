(function initPetLiveWebShellIntroCloud(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function toggleAccountMenuFromChip(doc, win, chip, hooks = {}) {
    if (!doc || !chip) return;
    const { closeAppNavMenu, positionAccountPopover } = hooks;
    const accountPopover = doc.getElementById("account-popover");
    if (!accountPopover) return;
    if (typeof closeAppNavMenu === "function") closeAppNavMenu();
    const willOpen = accountPopover.hidden;
    doc.querySelectorAll(".js-account-chip").forEach((el) => {
      el.setAttribute("aria-expanded", "false");
    });
    if (willOpen) {
      if (typeof positionAccountPopover === "function") {
        positionAccountPopover(doc, win, chip);
      }
      accountPopover.hidden = false;
      chip.setAttribute("aria-expanded", "true");
    } else {
      accountPopover.hidden = true;
    }
  }

  /**
   * Intro / account-popover listener bundle. Inject login/logout/go/paint/
   * toast callbacks — no Drive transport in shell.
   */
  function bindIntroCloudListeners(doc, win, hooks = {}) {
    if (!doc || typeof doc.getElementById !== "function") return false;
    const {
      onLogin,
      onLogout,
      onOpenOwnerSettings,
      onSync,
      onRestore,
      onSyncPreview,
      onSwitchPreview,
      onGoHome,
      onPaint,
      closeAccountMenu,
      closeAppNavMenu,
      positionAccountPopover,
      registerSessionChange,
    } = hooks;

    const loginBtn = doc.getElementById("intro-login-btn");
    const logoutBtn = doc.getElementById("intro-logout-btn");
    const accountPopover = doc.getElementById("account-popover");
    const accountPopoverSettings = doc.getElementById(
      "account-popover-settings"
    );
    const accountPopoverSync = doc.getElementById("account-popover-edit");
    const accountPopoverRestore = doc.getElementById(
      "account-popover-restore"
    );
    const accountPopoverHome = doc.getElementById("account-popover-home");
    const accountPopoverSwitch = doc.getElementById(
      "account-popover-switch"
    );
    const accountPopoverLogout = doc.getElementById(
      "account-popover-logout"
    );

    const chromeHooks = {
      closeAppNavMenu,
      closeAccountMenu,
      positionAccountPopover,
    };

    loginBtn?.addEventListener("click", () => {
      const shell = global.PetLiveWeb?.shell;
      if (
        shell?.isLegalConsentGranted &&
        !shell.isLegalConsentGranted(doc)
      ) {
        if (typeof shell.promptLegalConsent === "function") {
          shell.promptLegalConsent(doc);
        } else {
          doc.getElementById("intro-legal-consent-cb")?.focus?.();
        }
        if (typeof hooks.onLegalConsentRequired === "function") {
          hooks.onLegalConsentRequired();
        }
        return;
      }
      if (typeof onLogin === "function") onLogin();
    });
    logoutBtn?.addEventListener("click", () => {
      if (typeof onLogout === "function") onLogout();
    });

    doc.addEventListener("click", (event) => {
      const chip = event.target.closest?.(".js-account-chip");
      if (chip) {
        event.stopPropagation();
        toggleAccountMenuFromChip(doc, win, chip, chromeHooks);
        return;
      }
      if (!accountPopover || accountPopover.hidden) return;
      if (event.target.closest("#account-popover")) return;
      if (typeof closeAccountMenu === "function") closeAccountMenu();
    });

    accountPopoverSettings?.addEventListener("click", () => {
      if (typeof onOpenOwnerSettings === "function") onOpenOwnerSettings();
    });
    // onSync / onRestore: B owns busy-check + close + Drive work.
    // onSyncPreview: C stub fallback (shell closes menu first).
    accountPopoverSync?.addEventListener("click", () => {
      if (typeof onSync === "function") {
        onSync();
        return;
      }
      if (typeof closeAccountMenu === "function") closeAccountMenu();
      if (typeof onSyncPreview === "function") onSyncPreview();
    });
    accountPopoverRestore?.addEventListener("click", () => {
      if (typeof onRestore === "function") {
        onRestore();
        return;
      }
      if (typeof closeAccountMenu === "function") closeAccountMenu();
      if (typeof onSyncPreview === "function") onSyncPreview();
    });
    accountPopoverHome?.addEventListener("click", () => {
      if (typeof closeAccountMenu === "function") closeAccountMenu();
      if (typeof onGoHome === "function") onGoHome();
    });
    accountPopoverSwitch?.addEventListener("click", () => {
      if (typeof closeAccountMenu === "function") closeAccountMenu();
      if (typeof onSwitchPreview === "function") onSwitchPreview();
    });
    accountPopoverLogout?.addEventListener("click", () => {
      if (typeof onLogout === "function") onLogout();
    });

    doc.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!accountPopover || accountPopover.hidden) return;
      if (typeof closeAccountMenu === "function") closeAccountMenu();
    });

    const targetWin =
      win ||
      (typeof global !== "undefined" && global.window) ||
      globalThis;
    if (targetWin && typeof targetWin.addEventListener === "function") {
      targetWin.addEventListener("resize", () => {
        if (accountPopover && !accountPopover.hidden) {
          const openChip = doc.querySelector(
            '.js-account-chip[aria-expanded="true"]'
          );
          if (
            openChip &&
            typeof positionAccountPopover === "function"
          ) {
            positionAccountPopover(doc, targetWin, openChip);
          }
        }
      });
    }

    if (typeof registerSessionChange === "function") {
      registerSessionChange(
        typeof onPaint === "function" ? onPaint : () => {}
      );
    }
    if (typeof onPaint === "function") onPaint();

    return true;
  }

  /**
   * C discussion surface: hide intro, show home, mark intro seen.
   * Injectable markIntroSeen keeps localStorage out of shell if desired;
   * default no-op when omitted.
   */
  function bootSurfaceToHome(app, hooks = {}) {
    const { markIntroSeen } = hooks;
    if (!app || typeof app.querySelector !== "function") return false;
    try {
      const intro = app.querySelector('[data-screen="intro"]');
      const home = app.querySelector('[data-screen="home"]');
      if (intro) {
        intro.classList.remove("is-active");
        intro.hidden = true;
      }
      if (home) {
        home.hidden = false;
        home.classList.add("is-active");
        if (typeof markIntroSeen === "function") markIntroSeen();
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * A-page CTA: browser tab → add-to-home only; standalone → login in topbar.
   * Facade supplies standalone flag + signedIn; optional label(key) for lede swap.
   */
  function paintIntroA2hsCta(doc, { standalone, signedIn, label } = {}) {
    if (!doc) return;
    const cta = doc.getElementById("intro-cta");
    const browserCta = doc.getElementById("intro-cta-browser");
    const standaloneCta = doc.getElementById("intro-cta-standalone");
    const loginBtn = doc.getElementById("intro-login-btn");
    const lede = doc.querySelector(".intro-lede");
    const doneHint = doc.getElementById("intro-a2hs-done-hint");

    if (doneHint) doneHint.hidden = true;

    if (signedIn) {
      if (cta) cta.hidden = true;
      if (loginBtn) loginBtn.hidden = true;
      return;
    }

    const shell = global.PetLiveWeb?.shell;
    const mobileBrowser = !standalone && Boolean(shell?.isLikelyMobile?.());

    if (cta) cta.hidden = !mobileBrowser && !standalone;

    if (standalone || !mobileBrowser) {
      if (browserCta) browserCta.hidden = true;
      if (standaloneCta) standaloneCta.hidden = !standalone;
      if (loginBtn) loginBtn.hidden = false;
      if (lede && typeof label === "function") {
        lede.innerHTML = label(
          standalone ? "introLedeStandalone" : "introLedeStandalone"
        );
      }
      return;
    }

    if (browserCta) browserCta.hidden = false;
    if (standaloneCta) standaloneCta.hidden = true;
    if (loginBtn) loginBtn.hidden = true;
    if (lede && typeof label === "function") {
      lede.innerHTML = label("introLedeBrowser");
    }
  }

  function bindIntroA2hsDone(doc, hooks = {}) {
    const btn = doc?.getElementById?.("intro-a2hs-done-btn");
    const hint = doc?.getElementById?.("intro-a2hs-done-hint");
    if (!btn || !hint) return false;
    btn.addEventListener("click", () => {
      hint.hidden = false;
      hint.focus?.();
      if (typeof hooks.onShowHint === "function") hooks.onShowHint();
    });
    return true;
  }

  root.shell.toggleAccountMenuFromChip = toggleAccountMenuFromChip;
  root.shell.bindIntroCloudListeners = bindIntroCloudListeners;
  root.shell.bootSurfaceToHome = bootSurfaceToHome;
  root.shell.paintIntroA2hsCta = paintIntroA2hsCta;
  root.shell.bindIntroA2hsDone = bindIntroA2hsDone;
})(typeof window !== "undefined" ? window : globalThis);
