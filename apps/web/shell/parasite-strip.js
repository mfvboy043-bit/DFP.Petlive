(function initPetLiveWebShellParasiteStrip(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Map domain strip status → traffic-light key for .e-vax-dot[data-status].
   * @returns {"protected"|"approaching"|"expired"|null}
   */
  function mapStripLightStatus(domainStatus) {
    if (!domainStatus || domainStatus === "optional") return null;
    if (domainStatus === "unprotected" || domainStatus === "expired") {
      return "expired";
    }
    if (domainStatus === "approaching" || domainStatus === "protected") {
      return domainStatus;
    }
    return null;
  }

  function stripLightsMarkup(id) {
    const idAttr = id ? ` id="${id}"` : "";
    return `<span class="e-vax-lights parasite-strip-lights"${idAttr} role="img" aria-label=""><i class="e-vax-dot is-green" data-status="protected"></i><i class="e-vax-dot is-orange" data-status="approaching"></i><i class="e-vax-dot is-red" data-status="expired"></i></span>`;
  }

  function syncStripLights({
    lightsEl,
    lightStatus,
    titleByStatus = {},
    emptyLabel = "",
  } = {}) {
    if (!lightsEl) return;
    lightsEl.querySelectorAll(".e-vax-dot").forEach((dot) => {
      const key = dot.dataset.status;
      const on = lightStatus && key === lightStatus;
      dot.classList.toggle("is-on", Boolean(on));
      if (titleByStatus[key]) dot.title = titleByStatus[key];
    });
    lightsEl.setAttribute(
      "aria-label",
      lightStatus ? titleByStatus[lightStatus] || "" : emptyLabel
    );
  }

  root.shell.mapStripLightStatus = mapStripLightStatus;
  root.shell.stripLightsMarkup = stripLightsMarkup;
  root.shell.syncStripLights = syncStripLights;
})(typeof window !== "undefined" ? window : globalThis);
