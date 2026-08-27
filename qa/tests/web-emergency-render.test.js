import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function stubLabel(key, params) {
  if (key === "eWeight") return `Weight ${params.weight} on ${params.date}`;
  if (key === "visitWeightIncreased") return `+${params.kg}`;
  return key;
}

function loadEmergencyRenderer() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;

  vm.runInContext(
    readFileSync(new URL("domains/emergency/render.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/emergency/render.js" }
  );

  const panels = [];
  const renderer = context.PetLiveWeb.domains.emergency.createRenderer({
    label: stubLabel,
    escapeHtml: (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;"),
    alertTypeLabel: (type) => `T:${type}`,
    alertLineText: (alert) => alert.desc || "",
    locField: (value) => value,
    formatMedDose: (med) => med.dose || "dose",
    formatMedCourse: () => "7 days",
    expandFrequencyInText: (text) => text,
    notesIdForMed: ({ emergencyPrefix, medIndex }) =>
      `e-drug-notes-${emergencyPrefix}-${medIndex}`,
    buildDrugNotesShellHtml: (notesId) =>
      `<div class="tl-drug-notes" id="${notesId}" hidden data-drug-notes-shell></div>`,
    ownerProfileHasAny: (profile) =>
      Boolean(
        profile?.name ||
          profile?.phone ||
          profile?.email ||
          profile?.emergencyName ||
          profile?.emergencyPhone ||
          profile?.address
      ),
  });

  return { renderer, panels };
}

describe("EM-05 emergency render builders", () => {
  it("buildAlertsListHtml severity and owner-source tag", () => {
    const { renderer } = loadEmergencyRenderer();
    const html = renderer.buildAlertsListHtml([
      {
        alertType: "drug_allergy",
        severity: "critical",
        desc: "Penicillin",
        source: "owner",
      },
      { severity: "caution", type: "Note", description: "Watch diet" },
    ]);
    assert.match(html, /is-critical/);
    assert.match(html, /T:drug_allergy/);
    assert.match(html, /e-alert-source/);
    assert.match(html, /is-caution/);
    assert.equal(renderer.buildAlertsListHtml([]), renderer.buildEmptyAlertsListHtml());
  });

  it("buildMedListHtml module variant escapes names and registers panels", () => {
    const { renderer } = loadEmergencyRenderer();
    const panels = [];
    const { html, drugNotePanels } = renderer.buildMedListHtml(
      [{ name: "Med<script>", dose: "1 tab", id: "m1" }],
      { emergencyPrefix: "", variant: "module" },
      panels
    );
    assert.match(html, /Med&lt;script&gt;/);
    assert.match(html, /data-drug-notes-toggle/);
    assert.match(html, /data-drug-notes-shell/);
    assert.equal(drugNotePanels.length, 1);
    assert.equal(drugNotePanels[0].notesId, "e-drug-notes-m1-0");
  });

  it("buildActiveMedListHtml local variant keeps raw name", () => {
    const { renderer } = loadEmergencyRenderer();
    const { html } = renderer.buildActiveMedListHtml(
      [{ name: "Amox", dose: "1 tab" }],
      "pet-1"
    );
    assert.match(html, /<strong>Amox<\/strong>/);
    assert.match(html, /e-drug-notes-pet-1-0/);
  });

  it("buildOwnerBlockHtml skips empty profile", () => {
    const { renderer } = loadEmergencyRenderer();
    assert.match(renderer.buildOwnerEmptyHtml(), /ownerContactEmpty/);
    const html = renderer.buildOwnerBlockHtml({
      name: "Victor",
      phone: "0912",
      email: "a@b.c",
    });
    assert.match(html, /e-owner-name/);
    assert.match(html, /ownerEmailShort/);
    assert.doesNotMatch(renderer.buildOwnerBlockHtml({}), /e-owner-row/);
  });

  it("buildDegradedListHtml and buildWeightHtml", () => {
    const { renderer } = loadEmergencyRenderer();
    assert.match(renderer.buildDegradedListHtml("Degraded"), /is-degraded/);
    assert.equal(
      renderer.buildWeightHtml({ weight: 12, date: "2026-08-01" }),
      "Weight 12 on 2026-08-01"
    );
  });

  it("render.js has no document, innerHTML, localStorage, or literal t(", () => {
    const src = readFileSync(
      new URL("domains/emergency/render.js", WEB_ROOT),
      "utf8"
    );
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\binnerHTML\b/.test(src), false);
    assert.equal(/\blocalStorage\b/.test(src), false);
    assert.equal(/\bt\s*\(/.test(src), false);
    assert.equal(/\bPetLive\b/.test(src), false);
  });

  it("buildCopyCardText joins pet, alerts, meds, owner", () => {
    const { renderer } = loadEmergencyRenderer();
    const text = renderer.buildCopyCardText({
      petLines: ["Name: Mochi"],
      alertsText: "none",
      medsText: "none",
      ownerLines: ["Owner: Victor"],
    });
    assert.match(text, /copyCardTitle/);
    assert.match(text, /Name: Mochi/);
    assert.match(text, /copyAlerts/);
    assert.match(text, /copyMeds/);
    assert.match(text, /Owner: Victor/);
    assert.match(text, /copyDisclaimer/);
    assert.equal(/\n{3,}/.test(text), false);
  });

  it("D verified: C facade wires buildCopyCardText; no inline join assemble", () => {
    const appSource = readFileSync(new URL("c/app.js", WEB_ROOT), "utf8");
    assert.match(
      appSource,
      /emergencyRenderer\.buildCopyCardText\s*\(/
    );
    assert.doesNotMatch(
      appSource,
      /function buildEmergencyCopyText[\s\S]{0,400}\.replace\(\/\\n\{3,\}/
    );
  });
});
