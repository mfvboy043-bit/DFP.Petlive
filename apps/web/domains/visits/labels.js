(function initPetLiveWebVisitsLabels(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.visits = root.domains.visits || {};

  /** Symptom tag key → i18n key (includes legacy zh seed labels). */
  const VISIT_TAG_I18N = {
    gastrointestinal: "tagGi",
    urinary: "tagUrinary",
    respiratory: "tagRespiratory",
    dermatology: "tagDerm",
    ear: "tagEar",
    eye: "tagEye",
    dental: "tagDental",
    neurology: "tagNeuro",
    orthopedic: "tagOrtho",
    autoimmune: "tagAutoimmune",
    checkup: "tagCheckup",
    vaccine: "tagVaccine",
    腸胃: "tagGi",
    泌尿: "tagUrinary",
    呼吸道: "tagRespiratory",
    皮膚: "tagDerm",
    耳朵: "tagEar",
    眼睛: "tagEye",
    牙科: "tagDental",
    口腔: "tagDental",
    "牙科／口腔": "tagDental",
    神經: "tagNeuro",
    骨科: "tagOrtho",
    自體免疫: "tagAutoimmune",
    健康檢查: "tagCheckup",
    疫苗: "tagVaccine",
  };

  function createLabels({ label } = {}) {
    if (typeof label !== "function") {
      throw new TypeError("createLabels requires label(key)");
    }

    function visitTagLabel(tag) {
      const key = VISIT_TAG_I18N[tag];
      return key ? label(key) : tag;
    }

    function getSourceTags() {
      return {
        owner: { label: label("sourceOwner"), className: "tag-owner" },
        owner_proof: { label: label("sourceOwnerProof"), className: "tag-owner-proof" },
        clinic_ref: { label: label("sourceClinicRef"), className: "tag-clinic-ref" },
      };
    }

    return {
      VISIT_TAG_I18N,
      visitTagLabel,
      getSourceTags,
    };
  }

  root.domains.visits.VISIT_TAG_I18N = VISIT_TAG_I18N;
  root.domains.visits.createLabels = createLabels;
})(typeof window !== "undefined" ? window : globalThis);
