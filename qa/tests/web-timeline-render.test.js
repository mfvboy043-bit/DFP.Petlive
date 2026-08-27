import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function stubLabel(key, params) {
  if (key === "visitWeightIncreased") return `+${params.kg} kg`;
  if (key === "visitWeightDecreased") return `-${params.kg} kg`;
  if (key === "visitWeightDaysSince") return `${params.days} days`;
  if (key === "visitWeightEditAria") return `edit ${params.weight}`;
  if (key === "timelineDrugNotesBtn") return "Notes";
  if (key === "timelineMedExpand") return "Expand";
  if (key === "medCompleteDrugs") return "Complete";
  if (key === "proofLightboxOpen") return "Open";
  if (key === "proofPhotoClear") return "Clear";
  if (key === "medBagPhoto") return "Bag";
  if (key === "imagingXrayCaption") return "X-ray";
  return key;
}

function loadRenderer() {
  const context = vm.createContext({ console, URL });
  context.globalThis = context;
  context.window = context;

  [
    "domains/visits/controller.js",
    "domains/imaging/controller.js",
    "domains/timeline/selectors.js",
    "domains/timeline/view.js",
    "domains/timeline/render.js",
  ].forEach((path) => {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  });

  const visits = context.PetLiveWeb.domains.visits.createController({});
  const imaging = context.PetLiveWeb.domains.imaging.createController();
  const timelineSelectors = context.PetLiveWeb.domains.timeline.createSelectors({
    visits,
    imaging,
  });
  const timelineViewHelpers = context.PetLiveWeb.domains.timeline.createViewHelpers({
    findDrugByName: () => null,
  });

  const renderer = context.PetLiveWeb.domains.timeline.createRenderer({
    label: stubLabel,
    locField: (v) => (typeof v === "string" ? v : v?.zh || ""),
    formatShortDate: (iso) => iso,
    visitClinicLabel: (visit) => visit.clinic || "Clinic",
    visitTagLabel: (tag) => tag,
    getSourceTags: () => ({
      owner: { className: "tag-owner", label: "Owner" },
      owner_proof: { className: "tag-proof", label: "Proof" },
    }),
    expandFrequencyInText: (text) => text,
    compoundFormClass: () => "is-liquid",
    compoundChipToneClass: () => "is-liquid-a",
    compoundFormBadge: () => "Liquid",
    compoundIconKind: () => "liquid",
    timelineSelectors,
    timelineViewHelpers,
    visits,
    imaging,
    hasLinkedLabs: () => false,
  });

  return { renderer, visits, imaging, timelineViewHelpers };
}

describe("TL-05 timeline render builders", () => {
  it("buildDrugNotesShellHtml uses data-drug-notes-shell without eager body", () => {
    const { renderer } = loadRenderer();
    const html = renderer.buildDrugNotesShellHtml("drug-notes-p1-0-0");
    assert.match(html, /data-drug-notes-shell/);
    assert.match(html, /id="drug-notes-p1-0-0"/);
    assert.doesNotMatch(html, /tl-drug-notes-body/);
  });

  it("buildVisitWeightVsHtml renders up/down/same delta marks", () => {
    const { renderer } = loadRenderer();
    const up = renderer.buildVisitWeightVsHtml(
      { date: "2026-02-01", weightAtVisit: 7 },
      { date: "2026-01-01", weightAtVisit: 6.5 }
    );
    assert.match(up, /is-up/);
    assert.match(up, /↑/);
    assert.match(up, /\+0\.5 kg/);

    const down = renderer.buildVisitWeightVsHtml(
      { date: "2026-02-01", weightAtVisit: 6 },
      { date: "2026-01-01", weightAtVisit: 6.5 }
    );
    assert.match(down, /is-down/);
    assert.match(down, /↓/);

    const same = renderer.buildVisitWeightVsHtml(
      { date: "2026-02-01", weightAtVisit: 6.5 },
      { date: "2026-01-01", weightAtVisit: 6.5 }
    );
    assert.match(same, /is-same/);
    assert.match(same, /=/);
  });

  it("buildVisitProofThumbsHtml preserves proof data attributes", () => {
    const { renderer } = loadRenderer();
    const html = renderer.buildVisitProofThumbsHtml(
      { bag: ["data:image/x"], rx: [], drug: [] },
      2
    );
    assert.match(html, /data-visit-proof-clear-slot="bag"/);
    assert.match(html, /data-visit-index="2"/);
    assert.match(html, /data-proof-lightbox/);
  });

  it("buildTimelineMedItemHtml compound registers ingredient notes ids", () => {
    const { renderer } = loadRenderer();
    const panels = [];
    const html = renderer.buildTimelineMedItemHtml(
      {
        kind: "compound_bundle",
        name: "Combo",
        dose: "bid",
        compoundForm: "liquid_a",
        ingredients: [{ name: "MedA", dose: "1 tab" }],
        source: "owner",
      },
      { id: "p1" },
      0,
      0,
      { owner: { className: "tag-owner", label: "Owner" } },
      panels
    );
    assert.match(html, /tl-compound/);
    assert.match(html, /data-med-detail-toggle/);
    assert.match(html, /drug-notes-p1-0-0-0/);
    assert.equal(panels.length, 1);
    assert.equal(panels[0].notesId, "drug-notes-p1-0-0-0");
  });

  it("buildTimelineListHtml empty and visit list shapes", () => {
    const { renderer } = loadRenderer();
    const empty = renderer.buildTimelineListHtml({ visits: [] });
    assert.match(empty.html, /tl-item-empty/);
    assert.match(empty.html, /noVisits/);
    assert.equal(empty.drugNotePanels.length, 0);

    const pet = {
      id: "p1",
      visits: [
        {
          date: "2026-08-27",
          clinic: "Happy Vet",
          tags: ["checkup"],
          note: "ok",
          medications: [{ name: "MedX", dose: "1 tab", source: "owner" }],
          proofPhotos: {},
          imaging: { xrayPhotos: [], usPhotos: [] },
        },
      ],
    };
    const built = renderer.buildTimelineListHtml(pet);
    assert.match(built.html, /tl-item/);
    assert.match(built.html, /data-visit-rx-toggle/);
    assert.match(built.html, /datetime="2026-08-27"/);
    assert.ok(built.drugNotePanels.length >= 1);
  });

  it("render.js has no document, innerHTML assignment, localStorage, or literal t(", () => {
    const src = readFileSync(
      new URL("domains/timeline/render.js", WEB_ROOT),
      "utf8"
    );
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\binnerHTML\b/.test(src), false);
    assert.equal(/\blocalStorage\b/.test(src), false);
    assert.equal(/\bt\s*\(/.test(src), false);
  });

  it("visit RX/imaging toggle presentation and auto-expand", () => {
    const { renderer } = loadRenderer();
    const openRx = renderer.buildVisitRxTogglePresentation(true);
    assert.equal(openRx.panelHidden, false);
    assert.equal(openRx.ariaExpanded, "true");
    assert.equal(openRx.text, "timelineVisitRxHide");
    assert.equal(openRx.isOpen, true);

    const closedImaging = renderer.buildVisitImagingTogglePresentation(false);
    assert.equal(closedImaging.panelHidden, true);
    assert.equal(closedImaging.ariaExpanded, "false");
    assert.equal(closedImaging.text, "timelineVisitImagingBtn");
    assert.equal(closedImaging.isOpen, false);

    assert.equal(renderer.shouldAutoExpandLatestRx(false), true);
    assert.equal(renderer.shouldAutoExpandLatestRx(true), false);
  });

  it("drug-note hydrate slot and timeline skip-noop signature", () => {
    const { renderer } = loadRenderer();
    assert.equal(
      renderer.shouldHydrateDrugNotesPanel({ hydrated: "true", hasMed: true }),
      false
    );
    assert.equal(
      renderer.shouldHydrateDrugNotesPanel({ hydrated: "", hasMed: true }),
      true
    );
    const slot = renderer.buildDrugNotesHydrateSlot({
      status: "unavailable",
      sideEffects: [],
      precautions: [],
    });
    assert.equal(slot.className, "tl-drug-notes-body");
    assert.equal(typeof slot.html, "string");

    const pet = {
      id: "p1",
      visits: [{ date: "2026-08-27", clinic: "Happy", medications: [] }],
    };
    const sig = renderer.buildListSignature(pet, { lang: "zh-Hant" });
    assert.equal(renderer.shouldSkipListRebuild(sig, sig), true);
    assert.equal(renderer.shouldSkipListRebuild(sig, sig + "x"), false);
    const otherLang = renderer.buildListSignature(pet, { lang: "en" });
    assert.equal(renderer.shouldSkipListRebuild(sig, otherLang), false);
  });

  it("list html tags data-visit-index; keyed plan skip/partial/full", () => {
    const { renderer } = loadRenderer();
    const pet = {
      id: "p1",
      visits: [
        { date: "2026-08-01", clinic: "A", medications: [] },
        { date: "2026-08-02", clinic: "B", medications: [] },
        { date: "2026-08-03", clinic: "C", medications: [] },
      ],
    };
    const { html } = renderer.buildTimelineListHtml(pet);
    assert.match(html, /data-visit-index="0"/);
    assert.match(html, /data-visit-index="1"/);
    assert.match(html, /data-visit-index="2"/);

    const sigs = renderer.buildItemSignatures(pet, { lang: "zh-Hant" });
    assert.equal(renderer.planKeyedListReconcile(sigs, sigs).mode, "skip");

    // Change last row only → partial (no neighbor after it).
    const changedLast = {
      ...pet,
      visits: [
        pet.visits[0],
        pet.visits[1],
        { date: "2026-08-03", clinic: "C-edited", medications: [] },
      ],
    };
    const nextLast = renderer.buildItemSignatures(changedLast, { lang: "zh-Hant" });
    const planLast = renderer.planKeyedListReconcile(sigs, nextLast);
    assert.equal(planLast.mode, "partial");
    assert.equal(planLast.indices.length, 1);
    assert.equal(planLast.indices[0], 2);

    // Newest-first array: change older row (index 2) → also refresh chrono next (index 1).
    const newestFirst = {
      id: "p1",
      visits: [
        { date: "2026-08-03", clinic: "C", medications: [], weightAtVisit: 7 },
        { date: "2026-08-02", clinic: "B", medications: [], weightAtVisit: 6.5 },
        { date: "2026-08-01", clinic: "A", medications: [], weightAtVisit: 6 },
      ],
    };
    const nfSigs = renderer.buildItemSignatures(newestFirst, { lang: "zh-Hant" });
    const nfChanged = {
      ...newestFirst,
      visits: [
        newestFirst.visits[0],
        newestFirst.visits[1],
        {
          date: "2026-08-01",
          clinic: "A",
          medications: [],
          weightAtVisit: 6.2,
        },
      ],
    };
    const nfNext = renderer.buildItemSignatures(nfChanged, { lang: "zh-Hant" });
    const nfDates = nfChanged.visits.map((v) => v.date);
    const nfPlan = renderer.planKeyedListReconcile(nfSigs, nfNext, {
      visitDates: nfDates,
    });
    assert.ok(nfPlan.indices.includes(2));
    assert.ok(nfPlan.indices.includes(1));

    const shorter = renderer.buildItemSignatures(
      { id: "p1", visits: [pet.visits[0]] },
      { lang: "zh-Hant" }
    );
    assert.equal(renderer.planKeyedListReconcile(sigs, shorter).mode, "full");
    assert.equal(renderer.planKeyedListReconcile([], []).mode, "full");
  });
});
