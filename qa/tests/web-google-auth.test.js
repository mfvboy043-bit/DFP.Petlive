import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);
const TOKEN_KEY = "petlive-google-token";
const PROFILE_KEY = "petlive-google-profile";
const REMEMBER_KEY = "petlive-google-remember";

class FakeStorage {
  constructor(seed = {}) {
    this.values = new Map(Object.entries(seed));
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function loadGoogleDrive({ localSeed = {}, sessionSeed = {} } = {}) {
  const localStorage = new FakeStorage(localSeed);
  const sessionStorage = new FakeStorage(sessionSeed);
  const context = vm.createContext({
    console,
    localStorage,
    sessionStorage,
    document: {
      querySelector() {
        return null;
      },
      createElement() {
        return { async: false, onload: null, onerror: null };
      },
      head: { appendChild() {} },
    },
    PETLIVE_CONFIG: { googleClientId: "test-client.apps.googleusercontent.com" },
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout,
    fetch: async () => {
      throw new Error("fetch_not_mocked");
    },
  });
  context.globalThis = context;
  context.window = context;

  vm.runInContext(
    readFileSync(new URL("auth/google-drive.js", WEB_ROOT), "utf8"),
    context,
    { filename: "auth/google-drive.js" }
  );

  return {
    api: context.PetLiveWeb.auth.googleDrive,
    localStorage,
    sessionStorage,
  };
}

describe("google-drive session durability helpers", () => {
  it("remembered profile alone is not signedIn", () => {
    const { api } = loadGoogleDrive({
      localSeed: {
        [PROFILE_KEY]: JSON.stringify({
          email: "owner@example.com",
          name: "Owner",
          picture: "",
          sub: "sub-1",
        }),
        [REMEMBER_KEY]: "1",
      },
    });
    const session = api.getSession();
    assert.equal(session.signedIn, false);
    assert.equal(session.remembered, true);
    assert.equal(session.profile?.email, "owner@example.com");
    assert.equal(session.accessToken, null);
  });

  it("near-expired token is treated as absent but remember can remain", () => {
    const { api } = loadGoogleDrive({
      localSeed: {
        [TOKEN_KEY]: JSON.stringify({
          access_token: "stale-token",
          expires_at: Date.now() + 10_000,
        }),
        [PROFILE_KEY]: JSON.stringify({ email: "a@b.c", name: "", picture: "", sub: "" }),
        [REMEMBER_KEY]: "1",
      },
    });
    const session = api.getSession();
    assert.equal(session.signedIn, false);
    assert.equal(session.remembered, true);
    assert.equal(session.profile?.email, "a@b.c");
  });

  it("valid localStorage token yields signedIn", () => {
    const { api } = loadGoogleDrive({
      localSeed: {
        [TOKEN_KEY]: JSON.stringify({
          access_token: "live-token",
          expires_at: Date.now() + 3_600_000,
        }),
        [PROFILE_KEY]: JSON.stringify({ email: "a@b.c", name: "", picture: "", sub: "" }),
        [REMEMBER_KEY]: "1",
      },
    });
    const session = api.getSession();
    assert.equal(session.signedIn, true);
    assert.equal(session.accessToken, "live-token");
    assert.equal(session.remembered, true);
  });

  it("migrates sessionStorage token/profile once into localStorage", () => {
    const { api, localStorage, sessionStorage } = loadGoogleDrive({
      sessionSeed: {
        [TOKEN_KEY]: JSON.stringify({
          access_token: "migrated-token",
          expires_at: Date.now() + 3_600_000,
        }),
        [PROFILE_KEY]: JSON.stringify({
          email: "mig@example.com",
          name: "Mig",
          picture: "",
          sub: "s",
        }),
      },
    });
    assert.equal(sessionStorage.getItem(TOKEN_KEY), null);
    assert.equal(sessionStorage.getItem(PROFILE_KEY), null);
    assert.ok(localStorage.getItem(TOKEN_KEY));
    assert.ok(localStorage.getItem(PROFILE_KEY));
    const session = api.getSession();
    assert.equal(session.signedIn, true);
    assert.equal(session.remembered, true);
    assert.equal(session.profile?.email, "mig@example.com");
  });

  it("signOut clears token, profile, and remember intent", () => {
    const { api, localStorage, sessionStorage } = loadGoogleDrive({
      localSeed: {
        [TOKEN_KEY]: JSON.stringify({
          access_token: "live-token",
          expires_at: Date.now() + 3_600_000,
        }),
        [PROFILE_KEY]: JSON.stringify({ email: "a@b.c", name: "", picture: "", sub: "" }),
        [REMEMBER_KEY]: "1",
      },
      sessionSeed: {
        [TOKEN_KEY]: "leftover",
        [PROFILE_KEY]: "leftover",
      },
    });
    api.signOut();
    const session = api.getSession();
    assert.equal(session.signedIn, false);
    assert.equal(session.remembered, false);
    assert.equal(session.profile, null);
    assert.equal(localStorage.getItem(TOKEN_KEY), null);
    assert.equal(localStorage.getItem(PROFILE_KEY), null);
    assert.equal(localStorage.getItem(REMEMBER_KEY), null);
    assert.equal(sessionStorage.getItem(TOKEN_KEY), null);
    assert.equal(sessionStorage.getItem(PROFILE_KEY), null);
  });

  it("trySilentRestore is a no-op when not remembered", async () => {
    const { api } = loadGoogleDrive();
    const session = await api.trySilentRestore();
    assert.equal(session.signedIn, false);
    assert.equal(session.remembered, false);
    assert.equal(api.isAuthBusy(), false);
  });
});

describe("intro-cloud applyAuthBusyState", () => {
  it("disables intro login and account switch while busy", () => {
    const context = vm.createContext({ console });
    context.globalThis = context;
    context.window = context;
    vm.runInContext(
      readFileSync(new URL("shell/intro-cloud.js", WEB_ROOT), "utf8"),
      context,
      { filename: "shell/intro-cloud.js" }
    );
    const loginBtn = { disabled: false };
    const switchBtn = { disabled: false };
    const doc = {
      getElementById(id) {
        if (id === "intro-login-btn") return loginBtn;
        if (id === "account-popover-switch") return switchBtn;
        return null;
      },
    };
    context.PetLiveWeb.shell.applyAuthBusyState(doc, true);
    assert.equal(loginBtn.disabled, true);
    assert.equal(switchBtn.disabled, true);
    context.PetLiveWeb.shell.applyAuthBusyState(doc, false);
    assert.equal(loginBtn.disabled, false);
    assert.equal(switchBtn.disabled, false);
  });
});
