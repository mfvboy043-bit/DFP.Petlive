import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);
const facadeC = readFileSync(new URL("c/app.js", WEB_ROOT), "utf8");
const facadeB = readFileSync(new URL("app.js", WEB_ROOT), "utf8");

const DEAD_NAMES_C = [
  "renderTimelineDrugNotes",
  "resolveParasiteProductName",
  "closeParasiteCalendarChooser",
  "openParasiteGoogleCalendar",
  "openParasiteAppleCalendar",
  "loadPetPhotosMap",
  "emptyOwnerProfile",
  "liveGoogleSignedIn",
];

const DEAD_NAMES_B = [
  "renderTimelineDrugNotes",
  "resolveParasiteProductName",
  "closeParasiteCalendarChooser",
  "openParasiteGoogleCalendar",
  "openParasiteAppleCalendar",
  "loadPetPhotosMap",
  "emptyOwnerProfile",
];

describe("FA-1 facade hygiene — dead functions stay gone (C)", () => {
  for (const name of DEAD_NAMES_C) {
    it(`c/app.js no longer declares function ${name}`, () => {
      const re = new RegExp(
        String.raw`^(?:async )?function ${name}\s*\(`,
        "m"
      );
      assert.equal(re.test(facadeC), false);
    });
  }

  it("c/app.js locField comes from core factory", () => {
    assert.match(facadeC, /PetLiveWeb\.core\.createLocField/);
    assert.equal(/^function locField\s*\(/m.test(facadeC), false);
  });

  it("c/app.js requires shell bind APIs loudly (no silent ?. bind)", () => {
    assert.match(facadeC, /function requireShellFn\s*\(/);
    assert.match(facadeC, /requireShellFn\("bindClinicPicker"\)/);
    assert.match(facadeC, /requireShellFn\("bindDrugSearch"\)/);
    assert.match(facadeC, /requireShellFn\("bindEmergencyVaxHelp"\)/);
    assert.match(facadeC, /requireShellFn\("bindFeatureHubVaxHelp"\)/);
    assert.equal(/PetLiveWeb\.shell\.bindClinicPicker\?\./.test(facadeC), false);
    assert.equal(/PetLiveWeb\.shell\.bindDrugSearch\?\./.test(facadeC), false);
    assert.equal(/PetLiveWeb\.shell\.bindEmergencyVaxHelp\?\./.test(facadeC), false);
    assert.equal(/const drugSearchApi\b/.test(facadeC), false);
  });

  it("c/app.js Escape closes all vax help popovers", () => {
    assert.match(facadeC, /closeAllVaxHelp\s*\(/);
    assert.match(
      facadeC,
      /keydown[\s\S]*?Escape[\s\S]*?closeAllVaxHelp\(\)/
    );
  });
});

describe("FA-1 facade hygiene — dead functions stay gone (B)", () => {
  for (const name of DEAD_NAMES_B) {
    it(`app.js no longer declares function ${name}`, () => {
      const re = new RegExp(
        String.raw`^(?:async )?function ${name}\s*\(`,
        "m"
      );
      assert.equal(re.test(facadeB), false);
    });
  }

  it("app.js keeps liveGoogleSignedIn (B auth chrome)", () => {
    assert.match(facadeB, /^function liveGoogleSignedIn\s*\(/m);
  });

  it("app.js locField comes from core factory", () => {
    assert.match(facadeB, /PetLiveWeb\.core\.createLocField/);
    assert.equal(/^function locField\s*\(/m.test(facadeB), false);
  });

  it("app.js requires shell bind APIs loudly", () => {
    assert.match(facadeB, /function requireShellFn\s*\(/);
    assert.match(facadeB, /requireShellFn\("bindClinicPicker"\)/);
    assert.match(facadeB, /requireShellFn\("bindDrugSearch"\)/);
    assert.match(facadeB, /requireShellFn\("bindEmergencyVaxHelp"\)/);
    assert.match(facadeB, /requireShellFn\("bindFeatureHubVaxHelp"\)/);
  });

  it("app.js Escape closes all vax help popovers", () => {
    assert.match(facadeB, /closeAllVaxHelp\s*\(/);
    assert.match(
      facadeB,
      /keydown[\s\S]*?Escape[\s\S]*?closeAllVaxHelp\(\)/
    );
  });
});
