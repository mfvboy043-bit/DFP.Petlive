(function initPetLiveWebShellTryoutPetPicker(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  const DOG_SVG =
    '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M10.8 22.4L16.6 5l6.8 12.8z" fill="currentColor"/><path d="M37.2 22.4L31.4 5l-6.8 12.8z" fill="currentColor"/><circle cx="24" cy="28" r="13.5" fill="currentColor"/><circle cx="18.1" cy="26.2" r="1.9" fill="rgba(26,52,45,0.4)"/><circle cx="29.9" cy="26.2" r="1.9" fill="rgba(26,52,45,0.4)"/><ellipse cx="24" cy="30.4" rx="2.5" ry="1.85" fill="rgba(26,52,45,0.36)"/></svg>';
  const CAT_SVG =
    '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M9 22.5L15.2 5.2l8.6 12.6z" fill="currentColor"/><path d="M39 22.5L32.8 5.2l-8.6 12.6z" fill="currentColor"/><ellipse cx="24" cy="28.2" rx="14.2" ry="13.4" fill="currentColor"/><circle cx="17.4" cy="26.4" r="1.9" fill="rgba(26,52,45,0.4)"/><circle cx="30.6" cy="26.4" r="1.9" fill="rgba(26,52,45,0.4)"/><path d="M24 29.6l-2.55 3.15h5.1z" fill="rgba(26,52,45,0.36)"/></svg>';
  const PAW_SVG =
    '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><ellipse cx="15" cy="14" rx="5.2" ry="6.4" fill="currentColor" opacity="0.95"/><ellipse cx="33" cy="14" rx="5.2" ry="6.4" fill="currentColor" opacity="0.95"/><circle cx="24" cy="27" r="11.5" fill="currentColor"/></svg>';

  /** Passport-aligned demo roster for standalone tryout (ids match seed pets). */
  const DEMO_PET_PROFILES = {
    p1: {
      id: "p1",
      name: "米醬",
      species: "dog",
      tone: "linear-gradient(160deg, #7fafa0, #355f54)",
    },
    p2: {
      id: "p2",
      name: "小黑",
      species: "dog",
      tone: "linear-gradient(160deg, #5c6b74, #243039)",
    },
    p3: {
      id: "p3",
      name: "橘寶",
      species: "cat",
      tone: "linear-gradient(160deg, #d4a06a, #8a5a2b)",
    },
  };

  const DEMO_PET_ORDER = ["p1", "p2", "p3"];

  const LEGACY_PET_ID_MAP = {
    "pet-a": "p1",
    "pet-b": "p2",
  };

  function avatarSvgForSpecies(species) {
    if (species === "dog") return DOG_SVG;
    if (species === "cat") return CAT_SVG;
    return PAW_SVG;
  }

  function enrichPetForPicker(pet) {
    const id = pet && pet.id ? String(pet.id) : "";
    const profile = DEMO_PET_PROFILES[id] || {};
    return {
      id: id,
      name: (pet && pet.name) || profile.name || id,
      species: (pet && pet.species) || profile.species || "other",
      tone: (pet && pet.tone) || profile.tone || "linear-gradient(160deg, #7fafa0, #355f54)",
    };
  }

  function createPetOptionButton(pet, activePetId) {
    const view = enrichPetForPicker(pet);
    const selected = view.id === activePetId;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pet-option" + (selected ? " is-selected" : "");
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", selected ? "true" : "false");
    btn.setAttribute("data-pet-id", view.id);
    btn.style.setProperty("--pet-tone", view.tone);

    const photo = document.createElement("span");
    photo.className = "pet-option-photo";
    photo.setAttribute("data-species", view.species);
    photo.setAttribute("aria-hidden", "true");
    photo.innerHTML = avatarSvgForSpecies(view.species);

    const name = document.createElement("span");
    name.className = "pet-option-name";
    name.textContent = view.name;

    btn.appendChild(photo);
    btn.appendChild(name);
    return btn;
  }

  function syncSelection(container, activePetId) {
    if (!container) return;
    container.querySelectorAll(".pet-option[data-pet-id]").forEach(function (btn) {
      const selected = btn.getAttribute("data-pet-id") === activePetId;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  function paintPicker(container, petsById, activePetId) {
    if (!container) return;
    const ids = Object.keys(petsById || {});
    const ordered = DEMO_PET_ORDER.filter(function (id) {
      return petsById[id];
    }).concat(
      ids.filter(function (id) {
        return DEMO_PET_ORDER.indexOf(id) === -1;
      })
    );

    container.replaceChildren();
    ordered.forEach(function (id) {
      container.appendChild(createPetOptionButton(petsById[id], activePetId));
    });
  }

  function defaultTryoutPets(emptyObservations) {
    const empty = typeof emptyObservations === "function" ? emptyObservations : function () {
      return {};
    };
    const pets = {};
    DEMO_PET_ORDER.forEach(function (id) {
      const profile = DEMO_PET_PROFILES[id];
      pets[id] = {
        id: profile.id,
        name: profile.name,
        species: profile.species,
        tone: profile.tone,
        observations: empty(),
      };
    });
    return pets;
  }

  function migrateTryoutStore(parsed, emptyObservations) {
    const empty = typeof emptyObservations === "function" ? emptyObservations : function () {
      return {};
    };
    const defaults = defaultTryoutPets(empty);
    let pets =
      parsed && parsed.pets && typeof parsed.pets === "object" ? Object.assign({}, parsed.pets) : {};

    Object.keys(LEGACY_PET_ID_MAP).forEach(function (legacyId) {
      const nextId = LEGACY_PET_ID_MAP[legacyId];
      if (pets[legacyId] && !pets[nextId]) {
        pets[nextId] = Object.assign({}, pets[legacyId], defaults[nextId], {
          id: nextId,
          name: defaults[nextId].name,
          species: defaults[nextId].species,
          tone: defaults[nextId].tone,
          observations: pets[legacyId].observations || empty(),
        });
      }
      delete pets[legacyId];
    });

    DEMO_PET_ORDER.forEach(function (id) {
      if (!pets[id]) {
        pets[id] = defaults[id];
      } else {
        pets[id] = Object.assign({}, defaults[id], pets[id], { id: id });
        if (!pets[id].observations) pets[id].observations = empty();
      }
    });

    let activePetId = parsed && parsed.activePetId ? String(parsed.activePetId) : "p1";
    if (LEGACY_PET_ID_MAP[activePetId]) activePetId = LEGACY_PET_ID_MAP[activePetId];
    if (!pets[activePetId]) activePetId = DEMO_PET_ORDER.find(function (id) { return pets[id]; }) || "p1";

    return {
      version: 2,
      activePetId: activePetId,
      pets: pets,
    };
  }

  root.shell.tryoutPetPicker = {
    DEMO_PET_ORDER: DEMO_PET_ORDER,
    DEMO_PET_PROFILES: DEMO_PET_PROFILES,
    defaultTryoutPets: defaultTryoutPets,
    migrateTryoutStore: migrateTryoutStore,
    enrichPetForPicker: enrichPetForPicker,
    paintPicker: paintPicker,
    syncSelection: syncSelection,
  };
})(typeof window !== "undefined" ? window : globalThis);
