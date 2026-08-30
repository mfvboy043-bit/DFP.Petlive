(function initPetLiveWebVaccinesRender(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.vaccines = root.domains.vaccines || {};

  function createRenderer(deps = {}) {
    const {
      label,
      compareVaccinesForList,
      getVaccineSuccessor,
      getVaccineProtectionStatus,
      vaccineLabelOf,
    } = deps;

    if (typeof label !== "function") {
      throw new TypeError("createRenderer requires label(key, params?)");
    }
    if (typeof compareVaccinesForList !== "function") {
      throw new TypeError("createRenderer requires compareVaccinesForList");
    }
    if (typeof getVaccineSuccessor !== "function") {
      throw new TypeError("createRenderer requires getVaccineSuccessor");
    }
    if (typeof getVaccineProtectionStatus !== "function") {
      throw new TypeError("createRenderer requires getVaccineProtectionStatus");
    }
    if (typeof vaccineLabelOf !== "function") {
      throw new TypeError("createRenderer requires vaccineLabelOf");
    }

    function buildEmptyListHtml() {
      return `<li class="vaccine-empty">${label("noVaccines")}</li>`;
    }

    function buildVaccineListItemHtml(pet, vaccine) {
      const successor = getVaccineSuccessor(pet, vaccine);
      let pill;
      let itemClass = "";
      if (successor) {
        itemClass = " is-superseded";
        pill = `<span class="pill-history">${label("vaccineSupersededBy", {
          name: vaccineLabelOf(successor),
        })}</span>`;
      } else {
        const status = getVaccineProtectionStatus(vaccine.next);
        itemClass =
          status === "expired"
            ? " is-expired"
            : status === "approaching"
              ? " is-approaching"
              : " is-protected";
        pill =
          status === "expired"
            ? `<span class="pill-expired">${label("protectionLost")}</span>`
            : status === "approaching"
              ? `<span class="pill-soon">${label("dueWithin90")}</span>`
              : `<span class="pill-ok">${label("protected")}</span>`;
      }
      return `
          <li class="vaccine-item${itemClass}">
            <div class="vaccine-item-main">
              <strong class="vaccine-item-name">${vaccineLabelOf(vaccine)}</strong>
              <p class="vaccine-item-meta">${label("givenNext", {
                given: vaccine.given,
                next: vaccine.next,
              })}</p>
            </div>
            ${pill}
          </li>`;
    }

    function buildVaccineListHtml(pet, vaccines) {
      if (!vaccines?.length) return buildEmptyListHtml();
      const sorted = [...vaccines].sort((a, b) => compareVaccinesForList(pet, a, b));
      return sorted.map((vaccine) => buildVaccineListItemHtml(pet, vaccine)).join("");
    }

    function buildStripPresentation(nextVaccine) {
      if (!nextVaccine) {
        return {
          rowClass: "is-unprotected",
          metaText: label("vaccineNotSet"),
          statusText: label("parasiteUnprotected"),
          lightStatus: "expired",
        };
      }

      const status = getVaccineProtectionStatus(nextVaccine.next);
      if (status === "expired") {
        return {
          rowClass: "is-unprotected",
          metaText: label("vaccineStripMeta", {
            name: vaccineLabelOf(nextVaccine),
            date: nextVaccine.next,
          }),
          statusText: label("parasiteUnprotected"),
          lightStatus: "expired",
        };
      }
      if (status === "approaching") {
        return {
          rowClass: "is-approaching",
          metaText: label("vaccineStripMeta", {
            name: vaccineLabelOf(nextVaccine),
            date: nextVaccine.next,
          }),
          statusText: label("parasiteApproaching"),
          lightStatus: "approaching",
        };
      }
      return {
        rowClass: "is-protected",
        metaText: label("vaccineStripMeta", {
          name: vaccineLabelOf(nextVaccine),
          date: nextVaccine.next,
        }),
        statusText: label("parasiteProtected"),
        lightStatus: "protected",
      };
    }

    function buildEmergencyNavPresentation(nextVaccine) {
      if (!nextVaccine) {
        return {
          nextText: label("noVaccineNext"),
          nextClassName: "",
          btnClass: "is-protected",
          lightStatus: null,
        };
      }

      const status = getVaccineProtectionStatus(nextVaccine.next);
      return {
        nextText: label("nextDue", { date: nextVaccine.next }),
        nextClassName:
          status === "expired"
            ? "e-nav-expired"
            : status === "approaching"
              ? "e-nav-approaching"
              : "e-nav-protected",
        btnClass:
          status === "expired"
            ? "is-expired"
            : status === "approaching"
              ? "is-approaching"
              : "is-protected",
        lightStatus: status,
      };
    }

    function buildFormChipsHtml(groups) {
      const list = Array.isArray(groups) ? groups : [];
      return list
        .map(
          (group) => `
        <div class="vaccine-chip-row">
          <p class="vaccine-chip-row-label">${label(group.labelKey)}</p>
          <div class="chips">
            ${(group.keys || [])
              .map(
                (key) =>
                  `<button type="button" class="chip" data-vaccine-key="${key}">${label(
                    key
                  )}</button>`
              )
              .join("")}
          </div>
        </div>`
        )
        .join("");
    }

    return {
      buildEmptyListHtml,
      buildVaccineListHtml,
      buildStripPresentation,
      buildEmergencyNavPresentation,
      buildFormChipsHtml,
    };
  }

  root.domains.vaccines.createRenderer = createRenderer;
})(typeof globalThis !== "undefined" ? globalThis : window);
