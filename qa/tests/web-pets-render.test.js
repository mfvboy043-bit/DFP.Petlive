import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadPetsRenderer(getPetPhoto = () => null) {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;

  vm.runInContext(
    readFileSync(new URL("domains/pets/render.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/pets/render.js" }
  );

  return context.PetLiveWeb.domains.pets.createRenderer({
    label: (key, params) => {
      if (key === "archivePetAria") return `Archive ${params.name}`;
      if (key === "removePetAria") return `Remove ${params.name}`;
      if (key === "addPetLabel") return "Add pet";
      if (key === "emptyPetsTitle") return "No pets";
      if (key === "emptyPetsSub") return "Add one";
      if (key === "petSub") {
        return `${params.species} · ${params.breed} · ${params.age} · ${params.weight}`;
      }
      if (key === "timelineSub") return `Timeline ${params.name}`;
      if (key === "visitFormSub") return `Visit ${params.name}`;
      if (key === "vaccineSub") return `Vaccine ${params.name}`;
      if (key === "archiveEmpty") return "Archive empty";
      if (key === "leftOn") return `Left on ${params.date}`;
      return key;
    },
    getPetPhoto,
    speciesLabelOf: (pet) => (pet?.species === "dog" ? "Dog" : "Cat"),
    breedLabelOf: (pet) => pet?.breed || "mix",
    ageLabelOf: (pet) => pet?.ageLabel || "2y",
  });
}

describe("SH-05 pets render builders", () => {
  it("buildPetAvatarMarkup photo vs species SVG", () => {
    const withPhotoRenderer = loadPetsRenderer(() => "data:image/jpeg;base64,abc");
    const withPhoto = withPhotoRenderer.buildPetAvatarMarkup({
      id: "p1",
      species: "dog",
    });
    assert.match(withPhoto, /has-photo/);
    assert.match(withPhoto, /background-image:url\('data:image/);

    const renderer = loadPetsRenderer(() => null);
    const dog = renderer.buildPetAvatarMarkup({ id: "p2", species: "dog" });
    assert.match(dog, /data-species="dog"/);
    assert.match(dog, /<svg/);

    const cat = renderer.buildPetAvatarMarkup({ id: "p3", species: "cat" });
    assert.match(cat, /data-species="cat"/);

    const other = renderer.buildPetAvatarMarkup({ id: "p4" });
    assert.match(other, /data-species="other"/);
  });

  it("buildPetPickerHtml selection, actions, and add row", () => {
    const renderer = loadPetsRenderer();
    const html = renderer.buildPetPickerHtml({
      pets: [
        { id: "a", name: "Mochi", tone: "#abc", species: "cat" },
        { id: "b", name: "Boba", tone: "#def", species: "dog" },
      ],
      currentPetId: "b",
    });
    assert.match(html, /data-pet-id="a"/);
    assert.match(html, /data-pet-id="b"/);
    assert.match(html, /is-selected/);
    assert.match(html, /aria-selected="true"/);
    assert.match(html, /data-archive-pet-id="a"/);
    assert.match(html, /data-remove-pet-id="b"/);
    assert.match(html, /id="add-pet-btn"/);
    assert.match(html, /pet-option-add/);
    assert.match(html, /Mochi/);
  });

  it("render.js has no document, innerHTML, localStorage, or literal t(", () => {
    const src = readFileSync(
      new URL("domains/pets/render.js", WEB_ROOT),
      "utf8"
    );
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\binnerHTML\b/.test(src), false);
    assert.equal(/\blocalStorage\b/.test(src), false);
    assert.equal(/\bt\s*\(/.test(src), false);
  });
});

describe("SH-06 pets chrome builders", () => {
  it("createRenderer still boots with SH-05 deps only (formal B compat)", () => {
    const context = vm.createContext({ console });
    context.globalThis = context;
    context.window = context;
    vm.runInContext(
      readFileSync(new URL("domains/pets/render.js", WEB_ROOT), "utf8"),
      context,
      { filename: "domains/pets/render.js" }
    );
    const renderer = context.PetLiveWeb.domains.pets.createRenderer({
      label: (key) => key,
      getPetPhoto: () => null,
    });
    assert.equal(typeof renderer.buildPetPickerHtml, "function");
    assert.throws(
      () => renderer.buildPetHeaderCopy({ name: "Mochi" }),
      /speciesLabelOf/
    );
  });

  it("buildPetHeaderCopy empty vs named pet", () => {
    const renderer = loadPetsRenderer();
    const empty = renderer.buildPetHeaderCopy(null);
    assert.equal(empty.nameText, "No pets");
    assert.equal(empty.subText, "Add one");
    assert.equal(empty.timelineSub, "");
    assert.equal(empty.visitFormSub, "");
    assert.equal(empty.vaccineSub, "");

    const copy = renderer.buildPetHeaderCopy({
      name: "Mochi",
      species: "cat",
      breed: "mix",
      ageLabel: "3y",
      weight: 4.2,
    });
    assert.equal(copy.nameText, "Mochi");
    assert.equal(copy.subText, "Cat · mix · 3y · 4.2");
    assert.equal(copy.timelineSub, "Timeline Mochi");
    assert.equal(copy.visitFormSub, "Visit Mochi");
    assert.equal(copy.vaccineSub, "Vaccine Mochi");
  });

  it("buildArchiveListHtml empty vs item with empty photo box", () => {
    const renderer = loadPetsRenderer();
    const empty = renderer.buildArchiveListHtml([]);
    assert.match(empty, /archive-empty/);
    assert.match(empty, /Archive empty/);

    const html = renderer.buildArchiveListHtml([
      {
        name: "Boba",
        tone: "#def",
        species: "dog",
        breed: "mix",
        passedAwayDate: "2024-01-02",
        memorialNote: "sunshine",
      },
    ]);
    assert.match(html, /archive-item/);
    assert.match(html, /archive-item-photo/);
    assert.doesNotMatch(html, /has-photo/);
    assert.match(html, /Boba/);
    assert.match(html, /Dog · mix/);
    assert.match(html, /Left on 2024-01-02 · sunshine/);
  });

  it("buildEmergencyPhotoFrame photo vs empty camera svg", () => {
    const withPhoto = loadPetsRenderer(() => "data:image/jpeg;base64,abc");
    const photoView = withPhoto.buildEmergencyPhotoFrame({ id: "p1" });
    assert.equal(photoView.hasPhoto, true);
    assert.match(photoView.backgroundImage, /^url\('data:image/);
    assert.equal(photoView.frameInnerHtml, "");
    assert.equal(photoView.labelKey, "petPhotoChange");

    const empty = loadPetsRenderer(() => null).buildEmergencyPhotoFrame({
      id: "p2",
    });
    assert.equal(empty.hasPhoto, false);
    assert.equal(empty.backgroundImage, "");
    assert.match(empty.frameInnerHtml, /<svg/);
    assert.match(empty.frameInnerHtml, /rect /);
    assert.equal(empty.labelKey, "petPhotoUpload");
  });
});
