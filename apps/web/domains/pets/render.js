(function initPetLiveWebPetsRender(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.pets = root.domains.pets || {};

  const PET_AVATAR_SVG_PAW = `
  <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <ellipse cx="15" cy="14" rx="5.2" ry="6.4" fill="currentColor" opacity="0.95"/>
    <ellipse cx="33" cy="14" rx="5.2" ry="6.4" fill="currentColor" opacity="0.95"/>
    <ellipse cx="10" cy="24" rx="3.4" ry="4.2" fill="currentColor" opacity="0.88"/>
    <ellipse cx="38" cy="24" rx="3.4" ry="4.2" fill="currentColor" opacity="0.88"/>
    <circle cx="24" cy="27" r="11.5" fill="currentColor"/>
    <circle cx="19.5" cy="25.5" r="1.5" fill="rgba(26,52,45,0.35)"/>
    <circle cx="28.5" cy="25.5" r="1.5" fill="rgba(26,52,45,0.35)"/>
    <ellipse cx="24" cy="29.5" rx="2.2" ry="1.5" fill="rgba(26,52,45,0.28)"/>
  </svg>
`.trim();

  const PET_AVATAR_SVG_DOG = `
  <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path d="M10.8 22.4L16.6 5l6.8 12.8z" fill="currentColor"/>
    <path d="M37.2 22.4L31.4 5l-6.8 12.8z" fill="currentColor"/>
    <circle cx="24" cy="28" r="13.5" fill="currentColor"/>
    <circle cx="18.1" cy="26.2" r="1.9" fill="rgba(26,52,45,0.4)"/>
    <circle cx="29.9" cy="26.2" r="1.9" fill="rgba(26,52,45,0.4)"/>
    <ellipse cx="24" cy="30.4" rx="2.5" ry="1.85" fill="rgba(26,52,45,0.36)"/>
  </svg>
`.trim();

  const PET_AVATAR_SVG_CAT = `
  <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path d="M9 22.5L15.2 5.2l8.6 12.6z" fill="currentColor"/>
    <path d="M39 22.5L32.8 5.2l-8.6 12.6z" fill="currentColor"/>
    <ellipse cx="24" cy="28.2" rx="14.2" ry="13.4" fill="currentColor"/>
    <circle cx="17.4" cy="26.4" r="1.9" fill="rgba(26,52,45,0.4)"/>
    <circle cx="30.6" cy="26.4" r="1.9" fill="rgba(26,52,45,0.4)"/>
    <path d="M24 29.6l-2.55 3.15h5.1z" fill="rgba(26,52,45,0.36)"/>
    <path d="M10.8 30h6.2M31 30h6.2M11.4 33.2h5.4M31.2 33.2h5.4" fill="none" stroke="rgba(26,52,45,0.24)" stroke-width="1.2" stroke-linecap="round"/>
  </svg>
`.trim();

  function petAvatarSvgForSpecies(species) {
    if (species === "dog") return PET_AVATAR_SVG_DOG;
    if (species === "cat") return PET_AVATAR_SVG_CAT;
    return PET_AVATAR_SVG_PAW;
  }

  function createRenderer(deps = {}) {
    const { label, getPetPhoto } = deps;

    if (typeof label !== "function") {
      throw new TypeError("createRenderer requires label(key, params?)");
    }
    if (typeof getPetPhoto !== "function") {
      throw new TypeError("createRenderer requires getPetPhoto(petId)");
    }

    function buildPetAvatarMarkup(pet, { className = "pet-option-photo" } = {}) {
      const photo = pet?.photo || getPetPhoto(pet?.id);
      if (photo) {
        return `<span class="${className} has-photo" style="background-image:url('${photo}')" aria-hidden="true"></span>`;
      }
      const species = pet?.species || "other";
      return `<span class="${className}" data-species="${species}" aria-hidden="true">${petAvatarSvgForSpecies(
        species
      )}</span>`;
    }

    function buildPetOptionHtml(pet, currentPetId) {
      const selected = pet.id === currentPetId;
      return `
        <button
          type="button"
          class="pet-option${selected ? " is-selected" : ""}"
          role="option"
          aria-selected="${selected}"
          data-pet-id="${pet.id}"
          style="--pet-tone: ${pet.tone}"
        >
          ${buildPetAvatarMarkup(pet)}
          <span class="pet-option-name">${pet.name}</span>
          <span
            class="pet-archive-btn"
            data-archive-pet-id="${pet.id}"
            role="button"
            aria-label="${label("archivePetAria", { name: pet.name })}"
          ></span>
          <span
            class="pet-remove-btn"
            data-remove-pet-id="${pet.id}"
            role="button"
            aria-label="${label("removePetAria", { name: pet.name })}"
          >×</span>
        </button>
      `;
    }

    function buildAddPetOptionHtml() {
      return `
      <button type="button" class="pet-option pet-option-add" id="add-pet-btn" aria-label="${label(
        "addPetLabel"
      )}">
        <span class="pet-option-photo" aria-hidden="true">+</span>
        <span class="pet-option-name">${label("addPet")}</span>
      </button>
    `;
    }

    function buildPetPickerHtml({ pets, currentPetId }) {
      const list = Array.isArray(pets) ? pets : [];
      return list
        .map((pet) => buildPetOptionHtml(pet, currentPetId))
        .join("")
        .concat(buildAddPetOptionHtml());
    }

    return {
      buildPetAvatarMarkup,
      buildPetOptionHtml,
      buildAddPetOptionHtml,
      buildPetPickerHtml,
    };
  }

  root.domains.pets.createRenderer = createRenderer;
})(typeof window !== "undefined" ? window : globalThis);
