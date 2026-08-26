import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function createFakeSlot(initial) {
  let value = JSON.parse(JSON.stringify(initial));
  return {
    read: () => JSON.parse(JSON.stringify(value)),
    write: (next) => {
      value = JSON.parse(JSON.stringify(next));
      return true;
    },
    getStats: () => ({ size: JSON.stringify(value).length }),
  };
}

function loadAlerts() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  ["domains/alerts/controller.js", "domains/alerts/selectors.js"].forEach((path) => {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  });
  return context.PetLiveWeb;
}

function createPair({ ownerMap = {}, suppressedMap = {} } = {}) {
  const api = loadAlerts();
  const ownerAlertsSlot = createFakeSlot(ownerMap);
  const suppressedAlertsSlot = createFakeSlot(suppressedMap);
  const alerts = api.domains.alerts.createController({
    ownerAlertsSlot,
    suppressedAlertsSlot,
  });
  const selectors = api.domains.alerts.createSelectors({ alerts });
  return { api, alerts, selectors, ownerAlertsSlot, suppressedAlertsSlot };
}

/** Normalize vm-realm objects for deepStrictEqual (different Object/Array prototypes). */
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

describe("AL-04 alerts controller + selectors", () => {
  it("normalizeSeverity maps high → critical and type defaults", () => {
    const { alerts } = createPair();
    assert.equal(alerts.normalizeSeverity("high", "food_allergy"), "critical");
    assert.equal(alerts.normalizeSeverity("critical", "food_allergy"), "critical");
    assert.equal(alerts.normalizeSeverity("caution", "drug_allergy"), "caution");
    assert.equal(alerts.defaultSeverityForType("drug_allergy"), "critical");
    assert.equal(alerts.defaultSeverityForType("food_allergy"), "caution");
    assert.equal(alerts.normalizeSeverity(undefined, "drug_allergy"), "critical");
  });

  it("inferAlertType and normalizeAlert (no type field, no t())", () => {
    const { alerts } = createPair();
    assert.equal(alerts.inferAlertType({ alertType: "vaccine_reaction" }), "vaccine_reaction");
    assert.equal(alerts.inferAlertType({ type: "Drug allergy" }), "drug_allergy");
    const normalized = plain(
      alerts.normalizeAlert(
        { id: "a1", description: "Penicillin", severity: "high" },
        "linked"
      )
    );
    assert.equal(normalized.alertType, "drug_allergy");
    assert.equal(normalized.severity, "critical");
    assert.equal(normalized.source, "linked");
    assert.equal("type" in normalized, false);
    assert.equal(normalized.description, "Penicillin");
  });

  it("formatAlertSince normalizes ISO day to month", () => {
    const { alerts } = createPair();
    assert.equal(alerts.formatAlertSince("2024-06"), "2024-06");
    assert.equal(alerts.formatAlertSince("2024-06-15"), "2024-06");
    assert.equal(alerts.toMonthInputValue("2024-06-15"), "2024-06");
    assert.equal(alerts.toMonthInputValue("invalid"), "");
  });

  it("linked + owner composition; owner id wins over linked duplicate", () => {
    const { alerts } = createPair({
      ownerMap: {
        p1: [
          {
            id: "dup",
            alertType: "special_note",
            source: "owner",
            description: "Owner copy",
            severity: "caution",
            createdAt: "2026-01-02",
          },
        ],
      },
    });
    const pet = {
      id: "p1",
      alerts: [
        {
          id: "dup",
          alertType: "drug_allergy",
          source: "linked",
          description: "Linked copy",
          severity: "critical",
          createdAt: "2026-01-01",
        },
        {
          id: "linked-only",
          alertType: "food_allergy",
          description: "Shellfish",
          severity: "caution",
          createdAt: "2026-01-03",
        },
      ],
    };
    const list = plain(alerts.getAlertsForPet(pet));
    assert.equal(list.length, 2);
    const ownerDup = list.find((a) => a.id === "dup");
    assert.equal(ownerDup.source, "owner");
    assert.equal(ownerDup.description, "Owner copy");
    assert.ok(list.some((a) => a.id === "linked-only"));
  });

  it("suppression hides linked alert; suppress is idempotent", () => {
    const { alerts, suppressedAlertsSlot } = createPair();
    const pet = {
      id: "p1",
      alerts: [
        { id: "l1", alertType: "drug_allergy", description: "A", severity: "critical" },
      ],
    };
    assert.equal(alerts.getLinkedAlerts(pet).length, 1);
    assert.equal(alerts.suppressLinkedAlert("p1", "l1"), true);
    assert.equal(alerts.getLinkedAlerts(pet).length, 0);
    assert.equal(alerts.suppressLinkedAlert("p1", "l1"), true);
    assert.deepEqual(plain(suppressedAlertsSlot.read()), { p1: ["l1"] });
  });

  it("sortAlerts: critical before caution, then type order, then createdAt", () => {
    const { alerts } = createPair();
    const unsorted = [
      {
        id: "c",
        alertType: "special_note",
        severity: "caution",
        createdAt: "2026-02-01",
      },
      {
        id: "a",
        alertType: "drug_allergy",
        severity: "critical",
        createdAt: "2026-01-01",
      },
      {
        id: "b",
        alertType: "food_allergy",
        severity: "caution",
        createdAt: "2026-01-01",
      },
    ];
    const sorted = alerts.sortAlerts(unsorted).map((a) => a.id);
    assert.deepEqual(sorted, ["a", "b", "c"]);
  });

  it("selectors: highestAlertSeverity, alertCount, hasCritical, filterByTypes", () => {
    const { selectors } = createPair();
    const list = [
      { id: "1", alertType: "food_allergy", severity: "caution" },
      { id: "2", alertType: "drug_allergy", severity: "critical" },
    ];
    assert.equal(selectors.highestAlertSeverity(list), "critical");
    assert.equal(selectors.alertCount(list), 2);
    assert.equal(selectors.hasCritical(list), true);
    assert.equal(
      selectors.filterByTypes(list, ["drug_allergy"]).length,
      1
    );
    assert.equal(selectors.highestAlertSeverity([]), null);
  });

  it("owner CRUD + deleteOrSuppressAlert owner vs linked paths", () => {
    const { alerts, ownerAlertsSlot } = createPair();
    const pet = {
      id: "p1",
      alerts: [
        { id: "linked1", alertType: "drug_allergy", description: "Linked", severity: "critical" },
      ],
    };

    const created = alerts.createOwnerAlert("p1", {
      alertType: "special_note",
      description: "Watch diet",
      severity: "caution",
    });
    assert.equal(created.ok, true);
    assert.equal(created.alert.source, "owner");

    const updated = alerts.updateOwnerAlert("p1", created.alert.id, {
      alertType: "special_note",
      description: "Watch diet v2",
      severity: "caution",
    });
    assert.equal(updated.ok, true);
    assert.equal(updated.alert.description, "Watch diet v2");

    const linkedDelete = alerts.deleteOrSuppressAlert(pet, "linked1");
    assert.equal(linkedDelete.ok, true);
    assert.equal(linkedDelete.kind, "linked");

    const ownerDelete = alerts.deleteOrSuppressAlert(pet, created.alert.id);
    assert.equal(ownerDelete.ok, true);
    assert.equal(ownerDelete.kind, "owner");
    assert.equal(alerts.getOwnerAlerts("p1").length, 0);
    assert.deepEqual(plain(ownerAlertsSlot.read()), {});
  });

  it("validateOwnerDraft rejects empty description", () => {
    const { alerts } = createPair();
    assert.deepEqual(plain(alerts.validateOwnerDraft({ description: "  " })), {
      ok: false,
      reason: "empty_description",
    });
    assert.equal(
      alerts.validateOwnerDraft({
        alertType: "chronic_disease",
        description: "CKD",
        sinceDate: "2024-06-15",
      }).ok,
      true
    );
  });

  it("wrong petId does not mutate another pet's owner map", () => {
    const { alerts, ownerAlertsSlot } = createPair({
      ownerMap: {
        p1: [
          {
            id: "o1",
            alertType: "special_note",
            source: "owner",
            description: "Pet one",
            severity: "caution",
            createdAt: "2026-01-01",
          },
        ],
      },
    });
    const before = plain(ownerAlertsSlot.read());
    const result = alerts.deleteOwnerAlert("p2", "o1");
    assert.equal(result.ok, false);
    assert.deepEqual(plain(ownerAlertsSlot.read()), before);
    assert.equal(alerts.getOwnerAlerts("p1").length, 1);
  });

  it("controllers never reference document, localStorage, t(), or modules/medical-alert", () => {
    const controllerSrc = readFileSync(
      new URL("domains/alerts/controller.js", WEB_ROOT),
      "utf8"
    );
    const selectorsSrc = readFileSync(
      new URL("domains/alerts/selectors.js", WEB_ROOT),
      "utf8"
    );
    for (const src of [controllerSrc, selectorsSrc]) {
      assert.equal(/\bdocument\b/.test(src), false);
      assert.equal(/\blocalStorage\b/.test(src), false);
      assert.equal(/\bt\s*\(/.test(src), false);
      assert.equal(/\bmodules\/medical-alert\b/.test(src), false);
    }

    const context = vm.createContext({ console });
    context.globalThis = context;
    context.window = context;
    vm.runInContext(controllerSrc, context);
    vm.runInContext(selectorsSrc, context);
    assert.equal("document" in context, false);
    assert.equal("localStorage" in context, false);

    const ownerAlertsSlot = createFakeSlot({});
    const suppressedAlertsSlot = createFakeSlot({});
    const alerts = context.PetLiveWeb.domains.alerts.createController({
      ownerAlertsSlot,
      suppressedAlertsSlot,
    });
    const selectors = context.PetLiveWeb.domains.alerts.createSelectors({ alerts });
    const pet = {
      id: "p1",
      alerts: [{ id: "x", alertType: "drug_allergy", description: "A", severity: "critical" }],
    };
    assert.equal(alerts.getAlertsForPet(pet).length, 1);
    assert.equal(selectors.alertCount(alerts.getAlertsForPet(pet)), 1);
  });
});
