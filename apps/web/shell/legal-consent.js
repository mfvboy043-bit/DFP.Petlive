(function initPetLiveWebShellLegalConsent(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  const CONSENT_VERSION = "v1.2";
  const MODAL_ID = "legal-consent-modal";
  const MODAL_CB_ID = "legal-consent-modal-cb";
  const MODAL_CONFIRM_ID = "legal-consent-modal-confirm";
  const INLINE_CB_ID = "intro-legal-consent-cb";

  function consentStorageKey(doc) {
    const custom = doc?.body?.dataset?.legalConsentKey;
    return custom || "petlive-legal-consent";
  }

  function hasLegalConsent(doc) {
    try {
      const key = consentStorageKey(doc || global.document);
      return global.localStorage.getItem(key) === CONSENT_VERSION;
    } catch {
      return false;
    }
  }

  function markLegalConsent(doc) {
    try {
      const key = consentStorageKey(doc || global.document);
      global.localStorage.setItem(key, CONSENT_VERSION);
    } catch {
      /* ignore */
    }
  }

  function consentCheckbox(doc) {
    if (!doc) return null;
    return (
      doc.getElementById(MODAL_CB_ID) || doc.getElementById(INLINE_CB_ID)
    );
  }

  function isConsentGranted(doc) {
    const cb = consentCheckbox(doc);
    return Boolean(hasLegalConsent(doc) || cb?.checked);
  }

  function usesIntroModal(doc) {
    return Boolean(doc?.getElementById?.("intro-login-btn"));
  }

  function legalConsentModalMarkup() {
    return `<div class="legal-consent-modal" id="${MODAL_ID}" hidden role="dialog" aria-modal="true" aria-labelledby="legal-consent-modal-title">
  <div class="legal-consent-modal-scrim" aria-hidden="true"></div>
  <div class="legal-consent-modal-sheet">
    <h2 class="legal-consent-modal-title" id="legal-consent-modal-title" data-i18n="legalConsentModalTitle">使用前請先閱讀</h2>
    <p class="legal-consent-modal-lede" data-i18n-html="legalConsentModalLede">火龍果護照僅供飼主整理寵物健康資訊之參考，不能取代獸醫診斷。請先閱讀並同意下列條款後再登入。</p>
    <label class="legal-consent-modal-label" for="${MODAL_CB_ID}">
      <input type="checkbox" id="${MODAL_CB_ID}" />
      <span data-i18n-html="legalConsentLabel">我已閱讀並同意隱私權政策與使用條款</span>
    </label>
    <button type="button" class="legal-consent-modal-confirm" id="${MODAL_CONFIRM_ID}" data-i18n="legalConsentModalConfirm" disabled>同意並繼續</button>
  </div>
</div>`;
  }

  function mountLegalConsentModal(doc) {
    if (!doc || !usesIntroModal(doc)) return null;
    if (doc.getElementById(MODAL_ID)) return doc.getElementById(MODAL_ID);
    doc.body.insertAdjacentHTML("beforeend", legalConsentModalMarkup());
    return doc.getElementById(MODAL_ID);
  }

  function setLegalConsentModalOpen(doc, open) {
    const modal = doc?.getElementById?.(MODAL_ID);
    if (!modal) return;
    modal.hidden = !open;
    doc.documentElement.classList.toggle("is-legal-consent-open", open);
    if (open) {
      const cb = doc.getElementById(MODAL_CB_ID);
      cb?.focus?.();
    }
  }

  function syncModalConfirmState(doc) {
    const cb = doc?.getElementById?.(MODAL_CB_ID);
    const confirm = doc?.getElementById?.(MODAL_CONFIRM_ID);
    if (confirm) confirm.disabled = !cb?.checked;
  }

  function paintLegalConsent(doc, { signedIn, authBusy } = {}) {
    if (!doc) return;
    const wrap = doc.getElementById("intro-legal-consent");
    const inlineCb = doc.getElementById(INLINE_CB_ID);
    const loginBtn = doc.getElementById("intro-login-btn");
    const modal = mountLegalConsentModal(doc);
    const modalCb = doc.getElementById(MODAL_CB_ID);

    if (signedIn) {
      if (wrap) wrap.hidden = true;
      setLegalConsentModalOpen(doc, false);
      if (loginBtn) loginBtn.disabled = Boolean(authBusy);
      return;
    }

    if (hasLegalConsent(doc)) {
      if (modalCb && !modalCb.checked) modalCb.checked = true;
      if (inlineCb && !inlineCb.checked) inlineCb.checked = true;
    }

    if (loginBtn && modal) {
      if (wrap) wrap.hidden = true;
      loginBtn.disabled = Boolean(authBusy);
      syncModalConfirmState(doc);
      // Intro A: keep modal closed until login (promptLegalConsent).
      setLegalConsentModalOpen(doc, false);
      return;
    }

    if (!wrap || !inlineCb) return;
    if (hasLegalConsent(doc) && !inlineCb.checked) inlineCb.checked = true;
    wrap.hidden = isConsentGranted(doc);
  }

  function bindLegalConsent(doc, hooks = {}) {
    if (!doc) return;

    mountLegalConsentModal(doc);

    function onConsentChange() {
      syncModalConfirmState(doc);
      if (typeof hooks.onPaint === "function") hooks.onPaint();
    }

    const inlineCb = doc.getElementById(INLINE_CB_ID);
    inlineCb?.addEventListener("change", () => {
      if (inlineCb.checked) markLegalConsent(doc);
      onConsentChange();
    });

    const modalCb = doc.getElementById(MODAL_CB_ID);
    modalCb?.addEventListener("change", onConsentChange);

    const confirm = doc.getElementById(MODAL_CONFIRM_ID);
    confirm?.addEventListener("click", () => {
      if (!modalCb?.checked) return;
      markLegalConsent(doc);
      setLegalConsentModalOpen(doc, false);
      if (typeof hooks.onPaint === "function") hooks.onPaint();
      if (typeof hooks.onAccepted === "function") hooks.onAccepted();
    });
  }

  function promptLegalConsent(doc) {
    if (!doc || isConsentGranted(doc)) return false;
    mountLegalConsentModal(doc);
    if (usesIntroModal(doc)) {
      setLegalConsentModalOpen(doc, true);
      syncModalConfirmState(doc);
      consentCheckbox(doc)?.focus?.();
      return true;
    }
    consentCheckbox(doc)?.focus?.();
    return true;
  }

  root.shell.hasLegalConsent = hasLegalConsent;
  root.shell.markLegalConsent = markLegalConsent;
  root.shell.isLegalConsentGranted = isConsentGranted;
  root.shell.mountLegalConsentModal = mountLegalConsentModal;
  root.shell.paintLegalConsent = paintLegalConsent;
  root.shell.bindLegalConsent = bindLegalConsent;
  root.shell.promptLegalConsent = promptLegalConsent;
})(typeof window !== "undefined" ? window : globalThis);
