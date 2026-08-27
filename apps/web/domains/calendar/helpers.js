(function initPetLiveWebCalendarHelpers(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.calendar = root.domains.calendar || {};

  function isoToCompactDate(iso) {
    return String(iso || "").replace(/-/g, "");
  }

  function escapeIcsText(text) {
    return String(text || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  function buildGoogleCalendarUrl(payload, { addDays } = {}) {
    if (!payload?.nextDue || typeof addDays !== "function") return null;
    const start = isoToCompactDate(payload.nextDue);
    const end = isoToCompactDate(addDays(payload.nextDue, 1));
    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", payload.title);
    url.searchParams.set("dates", `${start}/${end}`);
    url.searchParams.set("details", payload.details);
    return url.toString();
  }

  function buildAppleIcsDocument(payload, { todayISO, addDays, uid } = {}) {
    if (!payload?.nextDue || typeof addDays !== "function" || !todayISO) return null;
    const start = isoToCompactDate(payload.nextDue);
    const end = isoToCompactDate(addDays(payload.nextDue, 1));
    const stamp = isoToCompactDate(todayISO) + "T000000Z";
    const eventUid = uid || payload.uid || `event-${start}`;
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Petlive//Dragon Fruit Passport//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:petlive-${eventUid}@petlive`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeIcsText(payload.title)}`,
      `DESCRIPTION:${escapeIcsText(payload.details)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  }

  root.domains.calendar.isoToCompactDate = isoToCompactDate;
  root.domains.calendar.escapeIcsText = escapeIcsText;
  root.domains.calendar.buildGoogleCalendarUrl = buildGoogleCalendarUrl;
  root.domains.calendar.buildAppleIcsDocument = buildAppleIcsDocument;
})(typeof window !== "undefined" ? window : globalThis);
