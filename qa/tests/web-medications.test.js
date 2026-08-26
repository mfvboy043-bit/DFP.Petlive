import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadMedicationsDomain() {
  const context = vm.createContext({
    console,
  });
  context.globalThis = context;
  context.window = context;
  [
    "domains/visits/controller.js",
    "domains/medications/controller.js",
    "domains/medications/selectors.js",
  ].forEach((path) => {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  });
  return context;
}

function createPair(opts = {}) {
  const context = loadMedicationsDomain();
  const visits = context.PetLiveWeb.domains.visits.createController({
    clinicLabelOf:
      opts.clinicLabelOf ||
      ((visit) => visit?.clinicId || visit?.clinic || ""),
  });
  const selectors = context.PetLiveWeb.domains.medications.createSelectors({
    formatFrequencyLabelOf: (code) => code || "",
    formatDosageUnitLabelOf: (unit) => {
      const value = (unit || "").trim();
      if (!value || value === "unrecorded") return "";
      return value;
    },
    durationDaysLabelOf: (n) => `${n} days`,
    pendingDoseLabelOf: () => "pending",
    formatShortDateOf: (iso) => {
      const [, m, d] = String(iso || "").split("-");
      return m && d ? `${m}/${d}` : iso || "";
    },
    getMedEndDate: (med) => med?.startDate || "",
    medCourseOf: ({ start, days, end }) => `${start}|${days}|${end}`,
  });
  const meds = context.PetLiveWeb.domains.medications.createController({
    visits,
    searchDrugs: opts.searchDrugs,
    getDrugById: opts.getDrugById,
    localDrugs: opts.localDrugs || [],
    formatFrequencyLabelOf: (code) => code || "",
    durationDaysLabelOf: (n) => `${n} days`,
    compoundFormLabelOf: (form) => `compound:${form}`,
    formatDraftDoseLineOf: (draft) => selectors.formatDraftDoseLine(draft),
  });
  return { context, visits, meds, selectors };
}

describe("MD-01 / MD-02 medications controller + selectors", () => {
  it("validateMedDraft returns structured reasons", () => {
    const { meds } = createPair();
    const needDrug = meds.validateMedDraft({});
    assert.equal(needDrug.ok, false);
    assert.equal(needDrug.reason, "need_drug");
    const badDose = meds.validateMedDraft({ drugName: "Amox", amount: 0 });
    assert.equal(badDose.ok, false);
    assert.equal(badDose.reason, "dose");
    const badDays = meds.validateMedDraft({ drugName: "Amox", days: 0 });
    assert.equal(badDays.ok, false);
    assert.equal(badDays.reason, "days");
    const ok = meds.validateMedDraft({
      drugName: "Amox",
      amount: 1,
      days: 5,
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.reason, undefined);
  });

  it("normalizeMedUnitForStore / freq strip unrecorded", () => {
    const { meds } = createPair();
    assert.equal(meds.normalizeMedUnitForStore("unrecorded"), "");
    assert.equal(meds.normalizeMedUnitForStore("  mg  "), "mg");
    assert.equal(meds.normalizeMedFreqForStore("unrecorded"), "");
    assert.equal(meds.normalizeMedFreqForStore(" SID "), "SID");
  });

  it("pushPendingMed + remove + compound group mutate", () => {
    const { meds } = createPair();
    const pending = [];
    const colorByGroup = Object.create(null);
    const item = meds.pushPendingMed(pending, {
      drugName: "Drug A",
      sourcePreset: "owner",
      frequency: "SID",
      days: 7,
      amount: 1,
      unit: "tab",
      compoundGroup: "",
      compoundColor: "",
    });
    assert.equal(pending.length, 1);
    assert.equal(item.name, "Drug A");
    assert.ok(item.localId.startsWith("pm-"));
    assert.match(item.dose, /1 tab/);

    const updated = meds.setPendingCompoundGroup(
      pending,
      item.localId,
      "liquid_a",
      colorByGroup
    );
    assert.equal(updated.compoundGroup, "liquid_a");
    assert.ok(updated.compoundColor);
    assert.equal(colorByGroup.liquid_a, updated.compoundColor);

    const next = meds.removePendingMed(pending, item.localId);
    assert.equal(next.length, 0);
  });

  it("buildVisitMedicationsFromPending: singles, bundle, solo tag, schedule split", () => {
    const { meds } = createPair();
    const singles = meds.buildVisitMedicationsFromPending(
      [
        {
          name: "A",
          dose: "1 · SID",
          source: "owner",
          frequency: "SID",
          durationDays: 5,
          compoundGroup: "",
        },
      ],
      "pet1"
    );
    assert.equal(singles.length, 1);
    assert.equal(singles[0].kind, undefined);
    assert.equal(singles[0].name, "A");

    const soloTagged = meds.buildVisitMedicationsFromPending(
      [
        {
          name: "Solo",
          dose: "1",
          source: "owner",
          frequency: "SID",
          durationDays: 3,
          compoundGroup: "liquid_a",
          compoundColor: "#6DA6C3",
        },
      ],
      "pet1"
    );
    assert.equal(soloTagged.length, 1);
    assert.notEqual(soloTagged[0].kind, "compound_bundle");
    assert.equal(soloTagged[0].name, "Solo");

    const bundled = meds.buildVisitMedicationsFromPending(
      [
        {
          name: "A",
          dose: "1",
          source: "owner",
          frequency: "SID",
          durationDays: 5,
          compoundGroup: "capsule_a",
          compoundColor: "#E38A6C",
        },
        {
          name: "B",
          dose: "2",
          source: "owner",
          frequency: "SID",
          durationDays: 5,
          compoundGroup: "capsule_a",
          compoundColor: "#E38A6C",
        },
      ],
      "pet1"
    );
    assert.equal(bundled.length, 1);
    assert.equal(bundled[0].kind, "compound_bundle");
    assert.equal(bundled[0].compoundForm, "capsule_a");
    assert.equal(bundled[0].ingredients.length, 2);
    assert.equal(bundled[0].name, "compound:capsule_a");

    const split = meds.buildVisitMedicationsFromPending(
      [
        {
          name: "A",
          dose: "1",
          source: "owner",
          frequency: "SID",
          durationDays: 5,
          compoundGroup: "liquid_a",
        },
        {
          name: "B",
          dose: "2",
          source: "owner",
          frequency: "BID",
          durationDays: 5,
          compoundGroup: "liquid_a",
        },
      ],
      "pet1"
    );
    assert.equal(split.length, 2);
    assert.ok(split.every((m) => m.kind !== "compound_bundle"));
  });

  it("appendPhotoBundleToVisit sets photo_bundle source tags", () => {
    const { meds } = createPair();
    const visit = { date: "2026-08-26", medications: [] };
    const pet = { id: "p1" };

    const withProof = meds.appendPhotoBundleToVisit(visit, pet, {
      bagPhoto: "bag",
      name: "Rx photo",
      dosePendingText: "pending dose",
    });
    assert.equal(withProof.kind, "photo_bundle");
    assert.equal(withProof.source, "owner_proof");
    assert.equal(visit.bagPhoto, "bag");
    assert.equal(withProof.structuredPending, true);

    const noProofVisit = { date: "2026-08-26", medications: [] };
    const noProof = meds.appendPhotoBundleToVisit(noProofVisit, pet, {
      name: "Rx photo",
      dosePendingText: "pending dose",
    });
    assert.equal(noProof.source, "owner");
  });

  it("appendUnitsToVisit sets startDate from visit.date", () => {
    const { meds } = createPair();
    const visit = { date: "2026-08-10", medications: [] };
    meds.appendUnitsToVisit(visit, [
      { name: "A", dose: "1" },
      { name: "B", dose: "2", startDate: "2026-08-01" },
    ]);
    assert.equal(visit.medications.length, 2);
    assert.equal(visit.medications[0].startDate, "2026-08-10");
    assert.equal(visit.medications[1].startDate, "2026-08-01");
  });

  it("findVisitForMedSave uses visits.findVisitByDateClinic", () => {
    const { meds, visits } = createPair();
    const pet = {
      visits: [
        { date: "2026-08-10", clinicId: "c1", clinic: "Clinic A" },
        { date: "2026-08-10", clinicId: "c2", clinic: "Clinic B" },
      ],
    };
    const found = meds.findVisitForMedSave(pet, {
      date: "2026-08-10",
      clinicId: "c2",
    });
    assert.equal(found, pet.visits[1]);
    assert.equal(
      visits.findVisitByDateClinic(pet, {
        date: "2026-08-10",
        clinicId: "c2",
      }),
      found
    );
    assert.equal(
      meds.findVisitForMedSave(pet, {
        date: "2026-08-10",
        clinicName: "Clinic A",
      }),
      pet.visits[0]
    );
  });

  it("empty clinicName matches only empty-label same-day visit (QA-001)", () => {
    const { meds, visits } = createPair({
      clinicLabelOf: (visit) => visit?.clinic || "",
    });
    const pet = {
      visits: [
        { date: "2026-08-10", clinicId: "c1", clinic: "Clinic A" },
        { date: "2026-08-10", clinic: "" },
        { date: "2026-08-10", clinic: "Walk-in" },
      ],
    };
    const emptyNamed = meds.findVisitForMedSave(pet, {
      date: "2026-08-10",
      clinicName: "",
    });
    assert.equal(emptyNamed, pet.visits[1]);
    assert.equal(
      visits.findVisitByDateClinic(pet, {
        date: "2026-08-10",
        clinicName: "",
      }),
      pet.visits[1]
    );
    assert.notEqual(emptyNamed, pet.visits[0]);
    assert.equal(
      meds.findVisitForMedSave(pet, {
        date: "2026-08-10",
        clinicName: "Walk-in",
      }),
      pet.visits[2]
    );
    assert.equal(
      meds.findVisitForMedSave(pet, {
        date: "2026-08-10",
        clinicId: "c1",
        clinicName: "",
      }),
      pet.visits[0]
    );
  });

  it("searchDrugs / resolveEnrichedDrug with injected fakes", () => {
    const local = [
      {
        id: "d1",
        genericName: "Amoxicillin",
        brandNameZh: "安莫西林",
        brandNameEn: "Amox",
        drugClass: "antibiotic",
        purpose: "infection",
        commonAliases: ["amox"],
        commonSideEffects: ["gi"],
        precautions: ["note"],
      },
    ];
    let apiCalls = 0;
    const { meds } = createPair({
      localDrugs: local,
      searchDrugs: (q) => {
        apiCalls += 1;
        if (String(q).includes("fail")) return { ok: false, error: "x" };
        if (String(q).includes("api")) {
          return { ok: true, data: [{ id: "api1", genericName: "FromAPI" }] };
        }
        return null;
      },
    });

    assert.equal(meds.searchDrugs("amox")[0].id, "d1");
    assert.equal(apiCalls, 1);
    assert.equal(meds.searchDrugs("fail").length, 0);
    assert.equal(meds.searchDrugs("api")[0].id, "api1");

    assert.equal(meds.resolveEnrichedDrug("d1").genericName, "Amoxicillin");
    assert.equal(
      meds.resolveEnrichedDrug({ id: "missing", genericName: "X" }).genericName,
      "X"
    );
  });

  it("selectors format dose / course / draft / compound class tokens", () => {
    const { selectors } = createPair();
    assert.equal(
      selectors.formatDraftDoseLine({
        amount: 2,
        unit: "ml",
        frequency: "BID",
        days: 3,
      }),
      "2 ml · BID · 3 days"
    );
    assert.equal(selectors.formatMedDose({ amount: 1, unit: "tab", frequency: "SID" }), "1 tab · SID");
    assert.equal(
      selectors.formatMedCourse({
        startDate: "2026-08-01",
        durationDays: 5,
      }),
      "08/01|5|08/01"
    );
    assert.equal(
      selectors.compoundFormClass("capsule_b"),
      "is-capsule is-capsule-b"
    );
    assert.equal(selectors.compoundIconKind("capsule_a"), "capsule");
    assert.equal(selectors.compoundIconKind("liquid_b"), "liquid");
  });

  it("domains do not touch document / localStorage", () => {
    const context = loadMedicationsDomain();
    assert.equal(context.document, undefined);
    assert.equal(context.localStorage, undefined);
    const source = [
      readFileSync(new URL("domains/medications/controller.js", WEB_ROOT), "utf8"),
      readFileSync(new URL("domains/medications/selectors.js", WEB_ROOT), "utf8"),
    ].join("\n");
    assert.equal(/localStorage/.test(source), false);
    assert.equal(/\bdocument\b/.test(source), false);
    assert.equal(/createMedication/.test(source), false);
    assert.equal(/modules\/medication/.test(source), false);
    assert.equal(/modules\/drug/.test(source), false);
  });

  it("applyVisitWeightOnMedSave delegates to visits.saveVisitWeight", () => {
    const { meds } = createPair();
    const pet = {
      weight: 5,
      weightDate: "2026-08-01",
      visits: [{ date: "2026-08-10", weightAtVisit: null }],
    };
    const result = meds.applyVisitWeightOnMedSave(pet, pet.visits[0], 6.5);
    assert.equal(result.ok, true);
    assert.equal(pet.visits[0].weightAtVisit, 6.5);
    assert.equal(pet.weight, 6.5);
  });

  it("C afterSelect clears med session on pet switch (QA-002)", () => {
    const appSource = readFileSync(new URL("c/app.js", WEB_ROOT), "utf8");
    const afterSelectMatch = appSource.match(
      /afterSelect:\s*\(pet\)\s*=>\s*\{([\s\S]*?)\n\s*\},/
    );
    assert.ok(afterSelectMatch, "petsController.afterSelect present");
    const body = afterSelectMatch[1];
    assert.match(body, /pendingMeds\s*=\s*\[\]/);
    assert.match(body, /completingVisitRef\s*=\s*null/);
    assert.match(body, /compoundColorByGroup/);
  });
});
