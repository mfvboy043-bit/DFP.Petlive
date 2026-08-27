import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function referenceAddDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadCalendar() {
  const context = vm.createContext({ console, URL });
  context.globalThis = context;
  context.window = context;
  context.document = undefined;
  context.localStorage = undefined;
  context.open = () => {
    throw new Error("calendar domain must not call window.open");
  };

  vm.runInContext(
    readFileSync(new URL("domains/calendar/helpers.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/calendar/helpers.js" }
  );

  return context.PetLiveWeb.domains.calendar;
}

describe("CAL-01 calendar helpers", () => {
  it("isoToCompactDate strips hyphens", () => {
    const calendar = loadCalendar();
    assert.equal(calendar.isoToCompactDate("2026-08-27"), "20260827");
    assert.equal(calendar.isoToCompactDate(""), "");
  });

  it("escapeIcsText escapes backslash, semicolon, comma, newlines", () => {
    const calendar = loadCalendar();
    assert.equal(calendar.escapeIcsText("a;b"), "a\\;b");
    assert.equal(calendar.escapeIcsText("a,b"), "a\\,b");
    assert.equal(calendar.escapeIcsText("a\\b"), "a\\\\b");
    assert.equal(calendar.escapeIcsText("line1\nline2"), "line1\\nline2");
  });

  it("buildGoogleCalendarUrl uses all-day span nextDue through nextDue+1", () => {
    const calendar = loadCalendar();
    const url = calendar.buildGoogleCalendarUrl(
      {
        title: "Vaccine",
        details: "Details",
        nextDue: "2026-08-27",
      },
      { addDays: referenceAddDays }
    );
    assert.ok(url);
    const parsed = new URL(url);
    assert.equal(parsed.hostname, "calendar.google.com");
    assert.equal(parsed.searchParams.get("action"), "TEMPLATE");
    assert.equal(parsed.searchParams.get("text"), "Vaccine");
    assert.equal(parsed.searchParams.get("details"), "Details");
    assert.equal(parsed.searchParams.get("dates"), "20260827/20260828");
  });

  it("buildGoogleCalendarUrl returns null without nextDue or addDays", () => {
    const calendar = loadCalendar();
    assert.equal(
      calendar.buildGoogleCalendarUrl({ title: "t", details: "d" }, { addDays: referenceAddDays }),
      null
    );
    assert.equal(
      calendar.buildGoogleCalendarUrl(
        { title: "t", details: "d", nextDue: "2026-08-27" },
        {}
      ),
      null
    );
  });

  it("buildAppleIcsDocument all-day end is nextDue+1 and escapes summary text", () => {
    const calendar = loadCalendar();
    const ics = calendar.buildAppleIcsDocument(
      {
        title: "Title; special",
        details: "Line1\nLine2",
        nextDue: "2026-08-27",
        uid: "test-uid",
      },
      { todayISO: "2026-08-26", addDays: referenceAddDays, uid: "test-uid" }
    );
    assert.ok(ics);
    assert.match(ics, /DTSTART;VALUE=DATE:20260827/);
    assert.match(ics, /DTEND;VALUE=DATE:20260828/);
    assert.match(ics, /SUMMARY:Title\\; special/);
    assert.match(ics, /DESCRIPTION:Line1\\nLine2/);
    assert.match(ics, /UID:petlive-test-uid@petlive/);
    assert.match(ics, /DTSTAMP:20260826T000000Z/);
  });

  it("domain script does not reference document, localStorage, or window.open", () => {
    const src = readFileSync(
      new URL("domains/calendar/helpers.js", WEB_ROOT),
      "utf8"
    );
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\blocalStorage\b/.test(src), false);
    assert.equal(/\bwindow\.open\b/.test(src), false);
  });
});
