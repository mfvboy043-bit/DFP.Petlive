(function initPetLiveWebShellParasiteForm(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Parasite kind save orchestration: read draft → optional dosedToday write-back
   * → controller save → fill/strip → quiet/dual toast. No pets-graph persist.
   */
  function saveParasiteKind(hooks = {}) {
    const {
      pet,
      kind,
      dosedToday = false,
      quiet = false,
      readParasiteForm,
      applyDosedToday,
      getDosedTodayEls,
      writeDosedTodayEls,
      saveParasiteKind: saveKind,
      fillParasiteKindForm,
      renderParasiteStrip,
      showToast,
      t,
      isParasiteDualProduct,
      parasiteKindTitle,
      parasiteTodayISODate,
    } = hooks;
    if (!pet) return false;

    let draft =
      typeof readParasiteForm === "function" ? readParasiteForm(kind) : null;
    if (!draft) return false;

    if (dosedToday) {
      const els =
        typeof getDosedTodayEls === "function" ? getDosedTodayEls(kind) : {};
      const typedDays = Number(els.intervalEl?.value);
      const intervalDays =
        Number.isFinite(typedDays) && typedDays >= 1
          ? typedDays
          : draft.intervalDays || 30;

      draft =
        typeof applyDosedToday === "function"
          ? applyDosedToday(
              { ...draft, intervalDays },
              {
                today:
                  typeof parasiteTodayISODate === "function"
                    ? parasiteTodayISODate()
                    : undefined,
              }
            )
          : draft;

      if (typeof writeDosedTodayEls === "function") {
        writeDosedTodayEls(els, draft, intervalDays);
      } else {
        if (els.lastEl) els.lastEl.value = draft.lastGiven;
        if (els.intervalEl) els.intervalEl.value = String(intervalDays);
        if (els.nextEl) els.nextEl.value = draft.nextDue;
      }
    }

    const result =
      typeof saveKind === "function" ? saveKind(pet, kind, draft) : { ok: false };
    if (!result || !result.ok) {
      if (typeof showToast === "function" && typeof t === "function") {
        if (result.reason === "needProduct") {
          showToast(t("toastParasiteNeedProduct"));
        } else if (result.reason === "needDates") {
          showToast(t("toastParasiteNeedDates"));
        } else if (result.reason === "order") {
          showToast(t("toastParasiteOrder"));
        }
      }
      return false;
    }

    // Dual-cover products (e.g. 寵愛 / 全能狗Ｓ) keep both strips in sync.
    if (result.syncedOtherKind && typeof fillParasiteKindForm === "function") {
      fillParasiteKindForm(pet, result.syncedOtherKind);
    }

    if (typeof fillParasiteKindForm === "function") {
      fillParasiteKindForm(pet, kind);
    }
    if (typeof renderParasiteStrip === "function") {
      renderParasiteStrip(pet);
    }
    // Facade calls schedulePetsGraphPersist after this returns true (same as vaccine submit).
    if (!quiet && typeof showToast === "function" && typeof t === "function") {
      const saved = result.draft || draft;
      const dual =
        saved.productKey &&
        typeof isParasiteDualProduct === "function" &&
        isParasiteDualProduct(saved.productKey);
      showToast(
        t(dual ? "toastParasiteSavedDual" : "toastParasiteSaved", {
          name: pet.name,
          kind:
            typeof parasiteKindTitle === "function"
              ? parasiteKindTitle(kind)
              : kind,
          product: saved.product,
        })
      );
    }
    return true;
  }

  root.shell.saveParasiteKind = saveParasiteKind;
})(typeof window !== "undefined" ? window : globalThis);
