(function initPetLiveWebShellLegalConsent(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  const CONSENT_KEY = "petlive-legal-consent";
  const CONSENT_VERSION = "v1.2";

  function hasLegalConsent() {
    try {
      return global.localStorage.getItem(CONSENT_KEY) === CONSENT_VERSION;
    } catch {
      return false;
    }
  }

  function markLegalConsent() {
    try {
      global.localStorage.setItem(CONSENT_KEY, CONSENT_VERSION);
    } catch {
      /* ignore */
    }
  }

  function isConsentGranted(doc) {
    const cb = doc?.getElementById?.("intro-legal-consent-cb");
    return Boolean(hasLegalConsent() || cb?.checked);
  }

  function paintLegalConsent(doc, { signedIn, authBusy } = {}) {
    if (!doc) return;
    const wrap = doc.getElementById("intro-legal-consent");
    const cb = doc.getElementById("intro-legal-consent-cb");
    const loginBtn = doc.getElementById("intro-login-btn");
    if (!wrap || !cb || !loginBtn) return;

    if (signedIn) {
      wrap.hidden = true;
      loginBtn.disabled = Boolean(authBusy);
      return;
    }

    wrap.hidden = false;
    if (hasLegalConsent() && !cb.checked) cb.checked = true;
    loginBtn.disabled = Boolean(authBusy) || !isConsentGranted(doc);
  }

  function bindLegalConsent(doc, hooks = {}) {
    if (!doc) return;
    const cb = doc.getElementById("intro-legal-consent-cb");
    if (!cb) return;
    cb.addEventListener("change", () => {
      if (cb.checked) markLegalConsent();
      if (typeof hooks.onPaint === "function") hooks.onPaint();
    });
  }

  root.shell.hasLegalConsent = hasLegalConsent;
  root.shell.markLegalConsent = markLegalConsent;
  root.shell.isLegalConsentGranted = isConsentGranted;
  root.shell.paintLegalConsent = paintLegalConsent;
  root.shell.bindLegalConsent = bindLegalConsent;
})(typeof window !== "undefined" ? window : globalThis);
