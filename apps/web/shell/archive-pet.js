(function initPetLiveWebShellArchivePet(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Archive confirm orchestration: form → lifecycle.archivePet → manage off /
   * current pet / refresh / toast / go archive replace. Validation toast keys
   * stay identical to the former facade body.
   */
  function confirmArchivePet(hooks = {}) {
    const {
      getPendingArchivePet,
      passedAwayDate,
      memorialNote,
      archivePet,
      currentPetId,
      onArchived,
      setManageMode,
      setCurrentPetId,
      applySelectedPet,
      renderArchiveList,
      showToast,
      t,
      clearNavigationHistory,
      go,
    } = hooks;

    const pet =
      typeof getPendingArchivePet === "function"
        ? getPendingArchivePet()
        : null;
    if (!pet) return false;

    if (!passedAwayDate) {
      if (typeof showToast === "function" && typeof t === "function") {
        showToast(t("toastNeedPassedDate"));
      }
      return false;
    }

    const result =
      typeof archivePet === "function"
        ? archivePet(pet.id, {
            passedAwayDate,
            memorialNote: memorialNote || "",
            currentPetId,
          })
        : { ok: false };
    if (!result || !result.ok) return false;

    if (typeof onArchived === "function") onArchived(result);

    if (typeof setManageMode === "function") setManageMode(false);
    if (
      result.nextCurrentPetId !== undefined &&
      typeof setCurrentPetId === "function"
    ) {
      setCurrentPetId(result.nextCurrentPetId);
    }
    if (typeof applySelectedPet === "function") applySelectedPet();
    if (typeof renderArchiveList === "function") renderArchiveList();
    if (typeof showToast === "function" && typeof t === "function") {
      showToast(t("toastArchived", { name: result.archived.name }));
    }
    if (typeof clearNavigationHistory === "function") {
      clearNavigationHistory();
    }
    if (typeof go === "function") go("archive", { replace: true });
    return true;
  }

  root.shell.confirmArchivePet = confirmArchivePet;
})(typeof window !== "undefined" ? window : globalThis);
