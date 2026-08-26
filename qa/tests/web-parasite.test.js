import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function referenceDaysUntil(isoDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function referenceAddDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function referenceTodayISODate() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadParasite({
  daysUntil,
  addDays,
  todayISODate,
  labelOf,
} = {}) {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  context.document = {
    getElementById() {
      throw new Error("domains must not touch document");
    },
  };
  context.localStorage = {
    getItem() {
      throw new Error("domains must not touch localStorage");
    },
    setItem() {
      throw new Error("domains must not touch localStorage");
    },
  };
  context.open = () => {
    throw new Error("domains must not call window.open");
  };

  ["domains/parasite/controller.js", "domains/parasite/selectors.js"].forEach(
    (path) => {
      vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
        filename: path,
      });
    }
  );

  const parasite = context.PetLiveWeb.domains.parasite.createController({
    daysUntil: daysUntil || referenceDaysUntil,
    addDays: addDays || referenceAddDays,
    todayISODate: todayISODate || referenceTodayISODate,
    labelOf:
      labelOf ||
      ((key) => {
        const map = {
          ppFrontline: "Frontline",
          ppRevolution: "Revolution",
          ppAdvantix: "Advantix",
          ppNexGardSpectra: "NexGard Spectra",
          ppMilbemax: "Milbemax",
          ppProHeart: "ProHeart",
        };
        return map[key] || key;
      }),
  });
  const selectors = context.PetLiveWeb.domains.parasite.createSelectors({
    parasite,
  });
  return { api: context.PetLiveWeb, parasite, selectors, context };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

describe("PA-04 parasite controller + selectors", () => {
  it("getParasiteStatus: missing / overdue / within 7 days / protected", () => {
    const { parasite } = loadParasite({
      daysUntil: (iso) => {
        if (iso === "overdue") return -3;
        if (iso === "soon") return 5;
        if (iso === "ok") return 40;
        return 100;
      },
    });
    assert.equal(parasite.getParasiteStatus(""), "unprotected");
    assert.equal(parasite.getParasiteStatus(null), "unprotected");
    assert.equal(parasite.getParasiteStatus("overdue"), "unprotected");
    assert.equal(parasite.getParasiteStatus("soon"), "approaching");
    assert.equal(parasite.getParasiteStatus("ok"), "protected");
  });

  it("getParasiteSlotStatus: dog unset unprotected; cat heartworm unset optional; set uses status", () => {
    const { selectors } = loadParasite({
      daysUntil: (iso) => (iso === "soon" ? 3 : 40),
    });
    const dog = { species: "dog", parasitePrevention: { external: null, heartworm: null } };
    const catUnset = {
      species: "cat",
      parasitePrevention: { external: null, heartworm: null },
    };
    const catSet = {
      species: "cat",
      parasitePrevention: {
        external: null,
        heartworm: {
          productKey: "ppMilbemax",
          product: "Milbemax",
          lastGiven: "2026-01-01",
          intervalDays: 30,
          nextDue: "soon",
        },
      },
    };
    assert.equal(selectors.getParasiteSlotStatus(dog, "heartworm"), "unprotected");
    assert.equal(selectors.getParasiteSlotStatus(dog, "external"), "unprotected");
    assert.equal(selectors.getParasiteSlotStatus(catUnset, "heartworm"), "optional");
    assert.equal(selectors.getParasiteSlotStatus(catUnset, "external"), "unprotected");
    assert.equal(selectors.getParasiteSlotStatus(catSet, "heartworm"), "approaching");
  });

  it("computeNextDue / interval edge returns null for invalid days", () => {
    const { parasite } = loadParasite();
    assert.equal(parasite.computeNextDue("2026-01-01", 30), "2026-01-31");
    assert.equal(parasite.computeNextDue("2026-01-01", 365), "2027-01-01");
    assert.equal(parasite.computeNextDue("", 30), null);
    assert.equal(parasite.computeNextDue("2026-01-01", 0), null);
    assert.equal(parasite.computeNextDue("2026-01-01", -1), null);
    assert.equal(parasite.computeNextDue("2026-01-01", NaN), null);
  });

  it("saveParasiteKind writes kind; dual syncs other; exclusive leaves other", () => {
    const { parasite } = loadParasite();
    const pet = {
      id: "p1",
      name: "Mochi",
      species: "dog",
      parasitePrevention: {
        external: null,
        heartworm: {
          productKey: "ppMilbemax",
          product: "Milbemax",
          lastGiven: "2025-12-01",
          intervalDays: 30,
          nextDue: "2025-12-31",
        },
      },
    };

    const exclusive = parasite.saveParasiteKind(pet, "external", {
      productKey: "ppFrontline",
      lastGiven: "2026-01-01",
      intervalDays: 30,
      nextDue: "2026-01-31",
    });
    assert.equal(exclusive.ok, true);
    assert.equal(exclusive.syncedOtherKind, null);
    assert.equal(pet.parasitePrevention.external.productKey, "ppFrontline");
    assert.equal(pet.parasitePrevention.heartworm.productKey, "ppMilbemax");

    const dual = parasite.saveParasiteKind(pet, "external", {
      productKey: "ppRevolution",
      lastGiven: "2026-02-01",
      intervalDays: 30,
      nextDue: "2026-03-03",
    });
    assert.equal(dual.ok, true);
    assert.equal(dual.syncedOtherKind, "heartworm");
    assert.equal(pet.parasitePrevention.external.productKey, "ppRevolution");
    assert.equal(pet.parasitePrevention.heartworm.productKey, "ppRevolution");
    assert.equal(pet.parasitePrevention.heartworm.nextDue, "2026-03-03");
  });

  it("validateDraft: need product, need dates, next < last rejected", () => {
    const { parasite } = loadParasite();
    assert.deepEqual(
      plain(parasite.validateDraft({ productKey: "", customValue: "", lastGiven: "2026-01-01", nextDue: "2026-01-31" })),
      { ok: false, reason: "needProduct" }
    );
    assert.deepEqual(
      plain(
        parasite.validateDraft({
          productKey: "ppFrontline",
          lastGiven: "",
          nextDue: "2026-01-31",
        })
      ),
      { ok: false, reason: "needDates" }
    );
    assert.deepEqual(
      plain(
        parasite.validateDraft({
          productKey: "ppFrontline",
          lastGiven: "2026-02-01",
          nextDue: "2026-01-01",
          intervalDays: 30,
        })
      ),
      { ok: false, reason: "order" }
    );
    const ok = parasite.validateDraft({
      productKey: "ppFrontline",
      lastGiven: "2026-01-01",
      nextDue: "2026-01-31",
      intervalDays: 30,
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.draft.product, "Frontline");
  });

  it("applyDosedToday sets last=today and next=last+interval", () => {
    const { parasite } = loadParasite({
      todayISODate: () => "2026-08-26",
    });
    const draft = parasite.applyDosedToday(
      {
        productKey: "ppFrontline",
        intervalDays: 30,
      },
      { today: "2026-08-26" }
    );
    assert.equal(draft.lastGiven, "2026-08-26");
    assert.equal(draft.nextDue, "2026-09-25");
    assert.equal(draft.intervalDays, 30);
  });

  it("buildParasiteCalendarPayload null without nextDue; fields present with nextDue", () => {
    const { parasite } = loadParasite();
    const empty = {
      parasitePrevention: { external: null, heartworm: null },
    };
    assert.equal(
      parasite.buildParasiteCalendarPayload(empty, "external", {
        title: "t",
        details: "d",
      }),
      null
    );

    const pet = {
      name: "Mochi",
      parasitePrevention: {
        external: {
          productKey: "ppFrontline",
          product: "Frontline",
          lastGiven: "2026-01-01",
          intervalDays: 30,
          nextDue: "2026-01-31",
        },
        heartworm: null,
      },
    };
    assert.deepEqual(
      plain(
        parasite.buildParasiteCalendarPayload(pet, "external", {
          title: "Title",
          details: "Details",
        })
      ),
      { title: "Title", details: "Details", nextDue: "2026-01-31" }
    );
  });

  it("wrong pet object isolation — mutation only on passed pet", () => {
    const { parasite } = loadParasite();
    const a = {
      id: "a",
      parasitePrevention: { external: null, heartworm: null },
    };
    const b = {
      id: "b",
      parasitePrevention: { external: null, heartworm: null },
    };
    parasite.saveParasiteKind(a, "external", {
      productKey: "ppFrontline",
      lastGiven: "2026-01-01",
      intervalDays: 30,
      nextDue: "2026-01-31",
    });
    assert.equal(a.parasitePrevention.external.productKey, "ppFrontline");
    assert.equal(b.parasitePrevention.external, null);
  });

  it("domains do not touch document / localStorage / window.open", () => {
    const { parasite, selectors, context } = loadParasite();
    const pet = {
      species: "cat",
      parasitePrevention: { external: null, heartworm: null },
    };
    parasite.ensureParasitePrevention(pet);
    parasite.getParasiteStatus("2026-12-01");
    selectors.getParasiteSlotStatus(pet, "heartworm");
    selectors.stripFlags(pet);
    selectors.hasApproaching(pet);
    selectors.hasUnprotected(pet);
    parasite.saveParasiteKind(pet, "external", {
      productKey: "ppRevolution",
      lastGiven: "2026-01-01",
      intervalDays: 30,
      nextDue: "2026-01-31",
    });
    parasite.buildParasiteCalendarPayload(pet, "external", {
      title: "t",
      details: "d",
    });
    assert.equal(typeof context.document.getElementById, "function");
    assert.equal(typeof context.localStorage.getItem, "function");
  });

  it("no inventing dual-write Map stores; pets[] parasitePrevention is write truth", () => {
    const { parasite, api } = loadParasite();
    const pet = { id: "p", parasitePrevention: { external: null, heartworm: null } };
    parasite.saveParasiteKind(pet, "heartworm", {
      productKey: "ppMilbemax",
      lastGiven: "2026-01-01",
      intervalDays: 30,
      nextDue: "2026-01-31",
    });
    assert.equal(pet.parasitePrevention.heartworm.productKey, "ppMilbemax");
    assert.equal(api.domains.parasite.PRODUCT_CATALOG.ppRevolution.intervalDays, 30);
    assert.equal("Map" in parasite, false);
    assert.equal(typeof parasite.saveParasiteKind, "function");
    // Dual product syncs other slot on same pet object only — no side Map.
    parasite.saveParasiteKind(pet, "external", {
      productKey: "ppNexGardSpectra",
      lastGiven: "2026-02-01",
      intervalDays: 30,
      nextDue: "2026-03-03",
    });
    assert.equal(pet.parasitePrevention.heartworm.productKey, "ppNexGardSpectra");
  });

  it("stripFlags / hasApproaching / hasUnprotected ignore optional", () => {
    const { selectors } = loadParasite({
      daysUntil: (iso) => (iso === "soon" ? 2 : 50),
    });
    const cat = {
      species: "cat",
      parasitePrevention: {
        external: {
          productKey: "ppFrontline",
          product: "Frontline",
          lastGiven: "2026-01-01",
          intervalDays: 30,
          nextDue: "soon",
        },
        heartworm: null,
      },
    };
    const flags = selectors.stripFlags(cat);
    assert.equal(flags.external.status, "approaching");
    assert.equal(flags.heartworm.status, "optional");
    assert.equal(selectors.hasApproaching(cat), true);
    assert.equal(selectors.hasUnprotected(cat), false);

    const dogUnset = {
      species: "dog",
      parasitePrevention: { external: null, heartworm: null },
    };
    assert.equal(selectors.hasUnprotected(dogUnset), true);
    assert.equal(selectors.hasApproaching(dogUnset), false);
  });

  it("isParasiteDualProduct and productsForKind catalog shape", () => {
    const { parasite } = loadParasite();
    assert.equal(parasite.isParasiteDualProduct("ppRevolution"), true);
    assert.equal(parasite.isParasiteDualProduct("ppFrontline"), false);
    const external = parasite.productsForKind("external");
    assert.equal(external[0].key, "ppFrontline");
    assert.ok(external.some((item) => item.key === "ppRevolution"));
    assert.equal(parasite.APPROACHING_DAYS, 7);
    assert.deepEqual(plain(parasite.KINDS), ["external", "heartworm"]);
  });
});
