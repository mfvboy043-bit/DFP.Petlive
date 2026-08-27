(function initPetLiveWebCoreDates(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.core = root.core || {};

  /** Local calendar date + days → YYYY-MM-DD (midnight-local semantics). */
  function addDays(isoDate, days) {
    const date = new Date(`${isoDate}T00:00:00`);
    date.setDate(date.getDate() + days);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  /** Days from local midnight today to isoDate (ceil). */
  function daysUntil(isoDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${isoDate}T00:00:00`);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  }

  /** Today's local calendar date as YYYY-MM-DD. */
  function todayIsoLocal() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  root.core.dates = {
    addDays,
    daysUntil,
    todayIsoLocal,
    /** Alias used by vaccines / parasite injects. */
    todayISODate: todayIsoLocal,
  };
})(typeof window !== "undefined" ? window : globalThis);
