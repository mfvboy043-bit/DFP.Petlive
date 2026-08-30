import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadShell(files) {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  for (const file of files) {
    vm.runInContext(
      readFileSync(new URL(file, WEB_ROOT), "utf8"),
      context,
      { filename: file }
    );
  }
  return context.PetLiveWeb.shell;
}

describe("shell alert-form", () => {
  it("saveAlertFromForm validates then creates with saved toast + reset", () => {
    const shell = loadShell(["shell/alert-form.js"]);
    const calls = [];
    const ok = shell.saveAlertFromForm({
      pet: { id: "p1" },
      draft: { description: "x" },
      editId: "",
      selectedAlertType: "allergy",
      validateOwnerDraft: () => ({ ok: true }),
      createOwnerAlert: (petId, draft) => {
        calls.push(["create", petId, draft.description]);
        return { ok: true };
      },
      showToast: (msg) => calls.push(["toast", msg]),
      t: (key) => key,
      resetAlertForm: (opts) => calls.push(["reset", opts.keepType]),
      applySelectedPet: () => calls.push(["refresh"]),
    });
    assert.equal(ok, true);
    assert.deepEqual(calls, [
      ["create", "p1", "x"],
      ["toast", "toastAlertSaved"],
      ["reset", "allergy"],
      ["refresh"],
    ]);
  });

  it("saveAlertFromForm update path toasts updated and preserves createdAt", () => {
    const shell = loadShell(["shell/alert-form.js"]);
    let payload;
    shell.saveAlertFromForm({
      pet: { id: "p1" },
      draft: { description: "y" },
      editId: "a1",
      selectedAlertType: "chronic_disease",
      validateOwnerDraft: () => ({ ok: true }),
      findBaseAlert: () => ({ createdAt: "2020-01-01T00:00:00.000Z" }),
      updateOwnerAlert: (_petId, id, body) => {
        payload = { id, body };
        return { ok: true };
      },
      showToast: () => {},
      t: (key) => key,
      resetAlertForm: () => {},
      applySelectedPet: () => {},
    });
    assert.equal(payload.id, "a1");
    assert.equal(payload.body.createdAt, "2020-01-01T00:00:00.000Z");
  });

  it("deleteAlertById resets only when editing that id", () => {
    const shell = loadShell(["shell/alert-form.js"]);
    const calls = [];
    shell.deleteAlertById({
      pet: { id: "p1" },
      alertId: "a1",
      deleteOrSuppressAlert: () => ({ ok: true }),
      isEditingAlertId: true,
      resetAlertForm: () => calls.push("reset"),
      showToast: (msg) => calls.push(msg),
      t: (key) => key,
      applySelectedPet: () => calls.push("refresh"),
    });
    assert.deepEqual(calls, ["reset", "toastAlertDeleted", "refresh"]);
  });
});

describe("shell parasite-form", () => {
  it("dosedToday writes last/interval/next before save and dual-fills", () => {
    const shell = loadShell(["shell/parasite-form.js"]);
    const lastEl = { value: "" };
    const intervalEl = { value: "30" };
    const nextEl = { value: "" };
    const fills = [];
    const ok = shell.saveParasiteKind({
      pet: { id: "p1", name: "Mochi" },
      kind: "external",
      dosedToday: true,
      quiet: false,
      readParasiteForm: () => ({
        productKey: "dual_x",
        product: "Dual",
        intervalDays: 30,
      }),
      applyDosedToday: (draft) => ({
        ...draft,
        lastGiven: "2026-08-27",
        nextDue: "2026-09-26",
      }),
      getDosedTodayEls: () => ({ lastEl, intervalEl, nextEl }),
      saveParasiteKind: () => ({
        ok: true,
        syncedOtherKind: "heartworm",
        draft: { productKey: "dual_x", product: "Dual" },
      }),
      fillParasiteKindForm: (_pet, kind) => fills.push(kind),
      renderParasiteStrip: () => fills.push("strip"),
      showToast: (msg) => fills.push(msg),
      t: (key) => key,
      isParasiteDualProduct: () => true,
      parasiteKindTitle: (k) => k,
      parasiteTodayISODate: () => "2026-08-27",
    });
    assert.equal(ok, true);
    assert.equal(lastEl.value, "2026-08-27");
    assert.equal(intervalEl.value, "30");
    assert.equal(nextEl.value, "2026-09-26");
    assert.deepEqual(fills, [
      "heartworm",
      "external",
      "strip",
      "toastParasiteSavedDual",
    ]);
  });

  it("maps needProduct / needDates / order toast keys", () => {
    const shell = loadShell(["shell/parasite-form.js"]);
    for (const [reason, key] of [
      ["needProduct", "toastParasiteNeedProduct"],
      ["needDates", "toastParasiteNeedDates"],
      ["order", "toastParasiteOrder"],
    ]) {
      let toast;
      const ok = shell.saveParasiteKind({
        pet: { id: "p1" },
        kind: "external",
        readParasiteForm: () => ({}),
        saveParasiteKind: () => ({ ok: false, reason }),
        showToast: (msg) => {
          toast = msg;
        },
        t: (k) => k,
      });
      assert.equal(ok, false);
      assert.equal(toast, key);
    }
  });
});

describe("shell parasite-strip", () => {
  it("mapStripLightStatus maps unprotected to expired", () => {
    const shell = loadShell(["shell/parasite-strip.js"]);
    assert.equal(shell.mapStripLightStatus("protected"), "protected");
    assert.equal(shell.mapStripLightStatus("approaching"), "approaching");
    assert.equal(shell.mapStripLightStatus("unprotected"), "expired");
    assert.equal(shell.mapStripLightStatus("optional"), null);
  });

  it("stripLightsMarkup emits three traffic-light dots", () => {
    const shell = loadShell(["shell/parasite-strip.js"]);
    const html = shell.stripLightsMarkup("parasite-lights-external");
    assert.match(html, /id="parasite-lights-external"/);
    assert.match(html, /data-status="protected"/);
    assert.match(html, /data-status="approaching"/);
    assert.match(html, /data-status="expired"/);
  });
});

describe("shell breed-form", () => {
  it("other species sets custom sentinel and clears chips", () => {
    const shell = loadShell(["shell/breed-form.js"]);
    const breedSelect = { value: "labrador" };
    const breedChips = {
      innerHTML: "x",
      classList: {
        removed: [],
        remove(...names) {
          this.removed.push(...names);
        },
        add() {},
      },
    };
    const calls = [];
    shell.syncBreedFields({
      speciesEl: { value: "other" },
      breedSelect,
      breedSearch: {},
      breedChips,
      getBreedListForSpecies: () => [],
      customValue: "__custom__",
      hideBreedResults: () => calls.push("hide"),
      updateBreedExpandToggle: () => calls.push("toggle"),
      toggleBreedCustomField: () => calls.push("custom"),
    });
    assert.equal(breedSelect.value, "__custom__");
    assert.equal(breedChips.innerHTML, "");
    assert.deepEqual(breedChips.classList.removed, [
      "is-expanded",
      "is-collapsed",
    ]);
    assert.deepEqual(calls, ["hide", "toggle", "custom"]);
  });

  it("collapsed path assigns chips and setSelectedBreed", () => {
    const shell = loadShell(["shell/breed-form.js"]);
    const breedSelect = { value: "poodle" };
    const breedChips = {
      innerHTML: "",
      classList: {
        added: [],
        removed: [],
        add(...n) {
          this.added.push(...n);
        },
        remove(...n) {
          this.removed.push(...n);
        },
      },
    };
    let selected;
    shell.syncBreedFields({
      speciesEl: { value: "dog" },
      breedSelect,
      breedSearch: {},
      breedChips,
      getBreedListForSpecies: () => [{ key: "poodle" }],
      getBreedGroupsForSpecies: () => ({}),
      isExpanded: () => false,
      isValidSelection: () => true,
      renderCollapsedBreedChips: () => "COLLAPSED",
      setSelectedBreed: (v) => {
        selected = v;
      },
      updateBreedExpandToggle: () => {},
    });
    assert.equal(breedChips.innerHTML, "COLLAPSED");
    assert.ok(breedChips.classList.added.includes("is-collapsed"));
    assert.equal(selected, "poodle");
  });
});

describe("shell emergency-paint", () => {
  it("falls back to local when generate missing", () => {
    const shell = loadShell(["shell/emergency-paint.js"]);
    const calls = [];
    shell.renderEmergencyCard({
      pet: { id: "p1", name: "Mochi", weight: 5, weightDate: "2026-01-01" },
      paintEmergencyIdentity: () => calls.push("identity"),
      buildWeightHtml: () => "W",
      setWeightHtml: (html) => calls.push(`weight:${html}`),
      getAlertsForPet: () => [],
      syncAlertNavTone: () => calls.push("tone"),
      getAlertsBlock: () => ({
        classList: { remove() {}, add() {} },
      }),
      renderEmergencyAlertsList: () => calls.push("alerts"),
      renderEmergencyMeds: () => calls.push("meds"),
      renderEmergencyOwner: () => calls.push("owner"),
      renderEmergencyPetPhoto: () => calls.push("photo"),
    });
    assert.deepEqual(calls, [
      "identity",
      "weight:W",
      "tone",
      "alerts",
      "meds",
      "owner",
      "photo",
    ]);
  });

  it("degraded weight/alerts/meds assign degraded HTML and clear severity", () => {
    const shell = loadShell(["shell/emergency-paint.js"]);
    const removed = [];
    const added = [];
    const paints = [];
    shell.renderEmergencyCard({
      pet: { id: "p1", name: "Mochi", weightDate: "2026-01-01" },
      generateEmergencyCard: () => ({
        pet: { name: "CardName" },
        latestWeight: null,
        alerts: [],
        currentMedications: [],
      }),
      callModule: (fn) => fn(),
      loadOwnerProfile: () => ({ name: "O", phone: "1" }),
      buildEmergencySnapshot: () => ({}),
      readInjectFail: () => ({}),
      paintEmergencyIdentity: () => paints.push("identity"),
      setNameText: (n) => paints.push(`name:${n}`),
      degradedSections: () => ({
        weight: true,
        alerts: true,
        medications: true,
      }),
      getAlertsForPet: () => ["local"],
      syncAlertNavTone: (a) => paints.push(`tone:${a[0]}`),
      getAlertsBlock: () => ({
        classList: {
          remove(...n) {
            removed.push(...n);
          },
          add(...n) {
            added.push(...n);
          },
        },
      }),
      setWeightText: (t) => paints.push(`w:${t}`),
      setAlertsHtml: (h) => paints.push(`a:${h}`),
      setMedsHtml: (h) => paints.push(`m:${h}`),
      buildDegradedListHtml: (msg) => `DEG:${msg}`,
      renderEmergencyOwner: () => paints.push("owner"),
      renderEmergencyPetPhoto: () => paints.push("photo"),
      t: (key) => key,
    });
    assert.ok(paints.includes("identity"));
    assert.ok(paints.includes("name:CardName"));
    assert.ok(paints.includes("w:emergencyDegradedWeight"));
    assert.ok(paints.includes("tone:local"));
    assert.ok(paints.includes("a:DEG:emergencyDegradedAlerts"));
    assert.ok(paints.includes("m:DEG:emergencyDegradedMeds"));
    assert.ok(removed.includes("is-critical"));
    assert.ok(added.includes("is-degraded"));
  });
});
