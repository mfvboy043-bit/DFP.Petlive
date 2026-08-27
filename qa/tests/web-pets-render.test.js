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
      return key;
    },
    getPetPhoto,
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
