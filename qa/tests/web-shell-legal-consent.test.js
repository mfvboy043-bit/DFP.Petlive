import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);
const CONSENT_VERSION = "v1.3";
const DEFAULT_KEY = "petlive-legal-consent";

class FakeStorage {
  constructor(seed = {}) {
    this.values = new Map(Object.entries(seed));
    this.throwOnGet = false;
    this.throwOnSet = false;
  }

  getItem(key) {
    if (this.throwOnGet) throw new Error("blocked");
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    if (this.throwOnSet) throw new Error("quota");
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function fakeDoc({ consentKey } = {}) {
  return {
    body: { dataset: consentKey ? { legalConsentKey: consentKey } : {} },
    getElementById: () => null,
  };
}

function loadLegalConsent(storage = new FakeStorage()) {
  const clone =
    globalThis.structuredClone ||
    ((value) => JSON.parse(JSON.stringify(value)));
  const context = vm.createContext({
    console,
    localStorage: storage,
    structuredClone: clone,
    document: fakeDoc(),
  });
  context.globalThis = context;
  context.window = context;

  for (const path of ["core/storage.js", "shell/legal-consent.js"]) {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  }

  return { shell: context.PetLiveWeb.shell, storage };
}

describe("legal consent storage boundary (BB-2)", () => {
  it("never touches localStorage itself", () => {
    const source = readFileSync(
      new URL("shell/legal-consent.js", WEB_ROOT),
      "utf8"
    );
    assert.ok(
      !source.includes("localStorage"),
      "shell/legal-consent.js must read consent through a core slot"
    );
  });

  it("keeps consent already granted before the slot layer", () => {
    const { shell } = loadLegalConsent(
      new FakeStorage({ [DEFAULT_KEY]: CONSENT_VERSION })
    );

    assert.equal(shell.hasLegalConsent(fakeDoc()), true);
    assert.equal(shell.isLegalConsentGranted(fakeDoc()), true);
  });

  it("stores the bare version string, not a JSON envelope", () => {
    const { shell, storage } = loadLegalConsent();
    const doc = fakeDoc();

    assert.equal(shell.hasLegalConsent(doc), false);
    shell.markLegalConsent(doc);

    assert.equal(
      storage.values.get(DEFAULT_KEY),
      CONSENT_VERSION,
      "a JSON-wrapped value would re-prompt everyone who already consented"
    );
    assert.equal(shell.hasLegalConsent(doc), true);
  });

  it("treats an older consent version as not granted", () => {
    const { shell } = loadLegalConsent(new FakeStorage({ [DEFAULT_KEY]: "v1.1" }));
    assert.equal(shell.hasLegalConsent(fakeDoc()), false);
  });

  it("honours a per-surface consent key from the body dataset", () => {
    const { shell, storage } = loadLegalConsent();
    const doc = fakeDoc({ consentKey: "petlive-c-legal-consent" });

    shell.markLegalConsent(doc);

    assert.equal(storage.values.get("petlive-c-legal-consent"), CONSENT_VERSION);
    assert.equal(storage.values.has(DEFAULT_KEY), false);
    assert.equal(shell.hasLegalConsent(fakeDoc()), false);
  });

  it("fails closed and stays quiet when storage is unavailable", () => {
    const storage = new FakeStorage();
    storage.throwOnGet = true;
    storage.throwOnSet = true;
    const { shell } = loadLegalConsent(storage);
    const doc = fakeDoc();

    assert.equal(shell.hasLegalConsent(doc), false);
    assert.doesNotThrow(() => shell.markLegalConsent(doc));
  });

  it("accepts an injected storage port", () => {
    const { shell } = loadLegalConsent();
    const writes = [];
    shell.setLegalConsentStorage(({ key }) => ({
      read: () => (key === DEFAULT_KEY ? CONSENT_VERSION : ""),
      write: (value) => writes.push([key, value]),
    }));

    assert.equal(shell.hasLegalConsent(fakeDoc()), true);
    shell.markLegalConsent(fakeDoc());
    assert.deepEqual(writes, [[DEFAULT_KEY, CONSENT_VERSION]]);
  });

  it("exposes v1.3 as the entry gate version (legal + 18+ attestation)", () => {
    const { shell } = loadLegalConsent();
    assert.equal(shell.LEGAL_CONSENT_VERSION, "v1.3");
  });

  it("mounts a single modal with both legal and adult checkboxes", () => {
    const children = [];
    const elements = new Map();
    const doc = {
      body: {
        dataset: {},
        insertAdjacentHTML(_pos, html) {
          assert.equal(elements.has("legal-consent-modal"), false, "must not remount");
          assert.match(html, /id="legal-consent-modal"/);
          assert.match(html, /id="legal-consent-modal-cb"/);
          assert.match(html, /id="legal-consent-modal-adult-cb"/);
          assert.match(html, /legalAdultAttestLabel/);
          const modal = {
            id: "legal-consent-modal",
            hidden: true,
            children,
          };
          elements.set("legal-consent-modal", modal);
          elements.set("legal-consent-modal-cb", {
            id: "legal-consent-modal-cb",
            checked: false,
            addEventListener() {},
            focus() {},
          });
          elements.set("legal-consent-modal-adult-cb", {
            id: "legal-consent-modal-adult-cb",
            checked: false,
            addEventListener() {},
          });
          elements.set("legal-consent-modal-confirm", {
            id: "legal-consent-modal-confirm",
            disabled: true,
            addEventListener() {},
          });
          elements.set("intro-login-btn", { id: "intro-login-btn", disabled: false });
        },
      },
      documentElement: { dataset: {}, classList: { toggle() {} } },
      getElementById(id) {
        if (id === "intro-login-btn") return elements.get("intro-login-btn") || { id };
        return elements.get(id) || null;
      },
    };

    const { shell } = loadLegalConsent();
    const first = shell.mountLegalConsentModal(doc);
    const second = shell.mountLegalConsentModal(doc);
    assert.equal(first, second);
    assert.equal(shell.areLegalEntryChecksComplete(doc), false);
    elements.get("legal-consent-modal-cb").checked = true;
    assert.equal(shell.areLegalEntryChecksComplete(doc), false);
    elements.get("legal-consent-modal-adult-cb").checked = true;
    assert.equal(shell.areLegalEntryChecksComplete(doc), true);
  });

  it("bindLegalConsent is idempotent (no second listener registration pass)", () => {
    const listeners = [];
    const elements = new Map();
    function makeCb(id) {
      return {
        id,
        checked: false,
        addEventListener(type, fn) {
          listeners.push([id, type, fn]);
        },
        focus() {},
      };
    }
    elements.set("intro-login-btn", { id: "intro-login-btn" });
    elements.set("legal-consent-modal", { id: "legal-consent-modal", hidden: true });
    elements.set("legal-consent-modal-cb", makeCb("legal-consent-modal-cb"));
    elements.set("legal-consent-modal-adult-cb", makeCb("legal-consent-modal-adult-cb"));
    elements.set("legal-consent-modal-confirm", {
      id: "legal-consent-modal-confirm",
      disabled: true,
      addEventListener(type, fn) {
        listeners.push(["legal-consent-modal-confirm", type, fn]);
      },
    });
    const doc = {
      body: {
        dataset: {},
        insertAdjacentHTML() {
          assert.fail("should use pre-mounted modal");
        },
      },
      documentElement: { dataset: {}, classList: { toggle() {} } },
      getElementById(id) {
        return elements.get(id) || null;
      },
    };
    const { shell } = loadLegalConsent();
    shell.bindLegalConsent(doc, {});
    const afterFirst = listeners.length;
    shell.bindLegalConsent(doc, {});
    assert.equal(listeners.length, afterFirst);
  });
});
