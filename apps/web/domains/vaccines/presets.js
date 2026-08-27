(function initPetLiveWebVaccinesPresets(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.vaccines = root.domains.vaccines || {};

  // Chip rows: core combo → other → less-common special (heartworm inj).
  const VACCINE_PRESETS = {
    dog: [
      {
        labelKey: "vaccineChipCore",
        keys: ["v5in1", "v7in1", "v8in1", "v10in1", "v11in1"],
      },
      {
        labelKey: "vaccineChipOther",
        keys: ["vRabies", "vLyme", "vLepto"],
      },
      {
        labelKey: "vaccineChipSpecial",
        keys: ["vHeartwormInj"],
      },
    ],
    cat: [
      {
        labelKey: "vaccineChipCore",
        keys: ["v3in1", "v5in1Cat"],
      },
      {
        labelKey: "vaccineChipOther",
        // Cats: no rabies option in this product rule set
        keys: ["vFelv", "vChlamydia"],
      },
    ],
    other: [
      {
        labelKey: "vaccineChipOther",
        keys: ["vRabies"],
      },
    ],
  };

  function getPresetGroups(species) {
    return VACCINE_PRESETS[species] || VACCINE_PRESETS.other;
  }

  root.domains.vaccines.VACCINE_PRESETS = VACCINE_PRESETS;
  root.domains.vaccines.getPresetGroups = getPresetGroups;
})(typeof window !== "undefined" ? window : globalThis);
