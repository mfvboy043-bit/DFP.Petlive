(function initPetLiveWebShellAlertForm(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Alert save orchestration: validate → create/update → toast → reset → refresh.
   * Domain algorithms stay on the injected alerts controller.
   */
  function saveAlertFromForm(hooks = {}) {
    const {
      pet,
      draft,
      editId = "",
      selectedAlertType,
      validateOwnerDraft,
      updateOwnerAlert,
      createOwnerAlert,
      findBaseAlert,
      showToast,
      t,
      showPersistenceFailure,
      resetAlertForm,
      applySelectedPet,
      nowIso,
    } = hooks;
    if (!pet) return false;

    const validation =
      typeof validateOwnerDraft === "function"
        ? validateOwnerDraft(draft)
        : { ok: false };
    if (!validation.ok) {
      if (typeof showToast === "function" && typeof t === "function") {
        showToast(t("toastNeedAlertDescription"));
      }
      return false;
    }

    let result;
    if (editId) {
      const base =
        (typeof findBaseAlert === "function" ? findBaseAlert(editId) : null) ||
        {};
      const createdAt =
        base.createdAt ||
        (typeof nowIso === "function"
          ? nowIso()
          : new Date().toISOString());
      result =
        typeof updateOwnerAlert === "function"
          ? updateOwnerAlert(pet.id, editId, {
              ...draft,
              createdAt,
            })
          : { ok: false };
      if (result.ok && typeof showToast === "function" && typeof t === "function") {
        showToast(t("toastAlertUpdated"));
      }
    } else {
      result =
        typeof createOwnerAlert === "function"
          ? createOwnerAlert(pet.id, draft)
          : { ok: false };
      if (result.ok && typeof showToast === "function" && typeof t === "function") {
        showToast(t("toastAlertSaved"));
      }
    }

    if (!result || !result.ok) {
      if (typeof showPersistenceFailure === "function") showPersistenceFailure();
      return false;
    }

    if (typeof resetAlertForm === "function") {
      resetAlertForm({ keepType: selectedAlertType });
    }
    if (typeof applySelectedPet === "function") applySelectedPet();
    return true;
  }

  /**
   * Alert delete orchestration: controller → toast → reset-if-editing → refresh.
   */
  function deleteAlertById(hooks = {}) {
    const {
      pet,
      alertId,
      deleteOrSuppressAlert,
      isEditingAlertId,
      showPersistenceFailure,
      resetAlertForm,
      showToast,
      t,
      applySelectedPet,
    } = hooks;
    if (!pet || !alertId) return false;

    const result =
      typeof deleteOrSuppressAlert === "function"
        ? deleteOrSuppressAlert(pet, alertId)
        : { ok: false };
    if (!result || !result.ok) {
      if (typeof showPersistenceFailure === "function") showPersistenceFailure();
      return false;
    }

    if (isEditingAlertId && typeof resetAlertForm === "function") {
      resetAlertForm();
    }
    if (typeof showToast === "function" && typeof t === "function") {
      showToast(t("toastAlertDeleted"));
    }
    if (typeof applySelectedPet === "function") applySelectedPet();
    return true;
  }

  root.shell.saveAlertFromForm = saveAlertFromForm;
  root.shell.deleteAlertById = deleteAlertById;
})(typeof window !== "undefined" ? window : globalThis);
