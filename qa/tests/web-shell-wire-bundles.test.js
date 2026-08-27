import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadShell(files) {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  for (const file of files) {
    vm.runInContext(
      readFileSync(new URL(file, WEB_ROOT), "utf8"),
      context,
      { filename: file }
    );
  }
  return context.PetLiveWeb.shell;
}

describe("wire-bundles shell helpers", () => {
  it("resolveOriginHint keeps needConfig / LAN / origin branches", () => {
    const shell = loadShell(["shell/account-chrome.js"]);
    const need = shell.resolveOriginHint(
      { configured: false, origin: "https://example.com" },
      {
        needConfig: "NEED",
        lanBlocked: "LAN",
        originHint: "HINT",
      }
    );
    assert.equal(need.hidden, false);
    assert.equal(need.text, "NEED");

    const lan = shell.resolveOriginHint(
      { configured: true, origin: "http://192.168.1.10:5173" },
      {
        needConfig: "NEED",
        lanBlocked: "LAN",
        originHint: "HINT",
      }
    );
    assert.equal(lan.hidden, false);
    assert.equal(lan.text, "LAN");

    const hint = shell.resolveOriginHint(
      { configured: true, origin: "http://localhost:5173" },
      {
        needConfig: "NEED",
        lanBlocked: "LAN",
        originHint: "HINT",
      }
    );
    assert.equal(hint.hidden, false);
    assert.equal(hint.text, "HINT");
  });

  it("applyIntroCloudVisibility toggles login/account/avatar", () => {
    const shell = loadShell(["shell/account-chrome.js"]);
    const els = {
      loginBtn: { hidden: false },
      account: { hidden: true },
      avatar: {
        hidden: true,
        src: "",
        removeAttribute(name) {
          if (name === "src") this.src = "";
        },
      },
    };
    shell.applyIntroCloudVisibility(els, {
      signedIn: true,
      profile: { picture: "https://img/x" },
    });
    assert.equal(els.loginBtn.hidden, true);
    assert.equal(els.account.hidden, false);
    assert.equal(els.avatar.hidden, false);
    assert.equal(els.avatar.src, "https://img/x");

    shell.applyIntroCloudVisibility(els, { signedIn: false, profile: {} });
    assert.equal(els.loginBtn.hidden, false);
    assert.equal(els.account.hidden, true);
    assert.equal(els.avatar.hidden, true);
  });

  it("closeAppNavMenu hides panel and syncs icons", () => {
    const shell = loadShell(["shell/app-nav.js"]);
    const closed = { hidden: false };
    const opened = { hidden: true };
    const btn = {
      attrs: {},
      setAttribute(k, v) {
        this.attrs[k] = v;
      },
      querySelector(sel) {
        if (sel === ".app-nav-label-closed") return closed;
        if (sel === ".app-nav-label-open") return opened;
        return null;
      },
    };
    const panel = { hidden: false, style: {} };
    const doc = {
      getElementById(id) {
        return id === "app-nav-panel" ? panel : null;
      },
      querySelectorAll(sel) {
        return sel === ".js-app-nav-btn" ? [btn] : [];
      },
    };
    shell.closeAppNavMenu(doc);
    assert.equal(panel.hidden, true);
    assert.equal(btn.attrs["aria-expanded"], "false");
    assert.equal(closed.hidden, false);
    assert.equal(opened.hidden, true);
  });

  it("bootSurfaceToHome hides intro and activates home", () => {
    const shell = loadShell(["shell/intro-cloud.js"]);
    let seen = false;
    const intro = {
      classList: {
        removed: [],
        remove(c) {
          this.removed.push(c);
        },
      },
      hidden: false,
    };
    const home = {
      classList: {
        added: [],
        add(c) {
          this.added.push(c);
        },
      },
      hidden: true,
    };
    const app = {
      querySelector(sel) {
        if (sel.includes("intro")) return intro;
        if (sel.includes("home")) return home;
        return null;
      },
    };
    assert.equal(
      shell.bootSurfaceToHome(app, {
        markIntroSeen: () => {
          seen = true;
        },
      }),
      true
    );
    assert.equal(intro.hidden, true);
    assert.ok(intro.classList.removed.includes("is-active"));
    assert.equal(home.hidden, false);
    assert.ok(home.classList.added.includes("is-active"));
    assert.equal(seen, true);
  });
});
