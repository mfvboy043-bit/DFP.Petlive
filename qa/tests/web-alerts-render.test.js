import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function stubLabel(key) {
  return key;
}

function loadAlertsRenderer() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;

  vm.runInContext(
    readFileSync(new URL("domains/alerts/render.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/alerts/render.js" }
  );

  const renderer = context.PetLiveWeb.domains.alerts.createRenderer({
    label: stubLabel,
    escapeHtml: (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;"),
    alertTypeLabel: (type) => `type:${type}`,
    alertLineText: (alert) => alert.description || "",
    locField: (value) => value || "",
    chronicSinceLine: (alert) =>
      alert.alertType === "chronic_disease" ? "since:2024-01" : "",
  });

  return { renderer };
}

const SECTIONS = [
  {
    id: "allergy",
    titleKey: "alertsSectionAllergy",
    emptyKey: "alertsSectionAllergyEmpty",
    types: ["drug_allergy"],
  },
  {
    id: "chronic",
    titleKey: "alertsSectionChronic",
    emptyKey: "alertsSectionChronicEmpty",
    types: ["chronic_disease"],
  },
];

describe("AL-05 alerts render builders", () => {
  it("buildAlertItemHtml critical owner with since and note", () => {
    const { renderer } = loadAlertsRenderer();
    const html = renderer.buildAlertItemHtml({
      id: "a<script>",
      alertType: "chronic_disease",
      severity: "critical",
      source: "owner",
      description: "Diabetes",
      note: "Watch diet",
    });
    assert.match(html, /severity-critical/);
    assert.match(html, /is-owner/);
    assert.match(html, /alert-since/);
    assert.match(html, /alert-note/);
    assert.match(html, /data-alert-edit="a&lt;script/);
    assert.match(html, /data-alert-delete="a&lt;script/);
  });

  it("buildFlatListHtml empty and list", () => {
    const { renderer } = loadAlertsRenderer();
    assert.match(renderer.buildFlatEmptyListHtml(), /noAlertItems/);
    assert.equal(renderer.buildFlatListHtml([]), renderer.buildFlatEmptyListHtml());
    const html = renderer.buildFlatListHtml([
      { id: "1", alertType: "drug_allergy", severity: "caution", source: "linked", description: "Penicillin" },
    ]);
    assert.match(html, /severity-caution/);
    assert.match(html, /is-linked/);
  });

  it("buildSectionsHtml empty section and is-editing", () => {
    const { renderer } = loadAlertsRenderer();
    const emptySection = renderer.buildSectionsHtml({
      alerts: [],
      sections: SECTIONS,
      editingSectionIds: new Set(["chronic"]),
    });
    assert.match(emptySection, /alertsSectionAllergyEmpty/);
    assert.match(emptySection, /is-editing/);
    assert.match(emptySection, /aria-pressed="true"/);
    assert.match(emptySection, /data-alert-add-type="drug_allergy"/);

    const withItem = renderer.buildSectionsHtml({
      alerts: [
        {
          id: "x",
          alertType: "drug_allergy",
          severity: "caution",
          source: "linked",
          description: "Egg",
        },
      ],
      sections: [SECTIONS[0]],
      editingSectionIds: new Set(),
    });
    assert.match(withItem, /alert-list/);
    assert.match(withItem, /Egg/);
  });

  it("render.js has no document, innerHTML, localStorage, or literal t(", () => {
    const src = readFileSync(new URL("domains/alerts/render.js", WEB_ROOT), "utf8");
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\binnerHTML\b/.test(src), false);
    assert.equal(/\blocalStorage\b/.test(src), false);
    assert.equal(/\bt\s*\(/.test(src), false);
    assert.equal(/\bPetLive\b/.test(src), false);
  });
});
