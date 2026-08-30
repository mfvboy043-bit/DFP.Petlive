import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function el(tag, attrs = {}, children = []) {
  const attributes = { ...attrs };
  const node = {
    nodeType: 1,
    tagName: tag.toUpperCase(),
    children,
    classList: {
      toggle(name, on) {
        node._class = node._class || new Set();
        if (on) node._class.add(name);
        else node._class.delete(name);
      },
    },
    dataset: { lang: attrs["data-lang"] },
    textContent: attrs.text || "",
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name)
        ? attributes[name]
        : null;
    },
    setAttribute(name, value) {
      attributes[name] = value;
    },
    querySelectorAll(selector) {
      const match = selector.match(/^\[(.+)\]$/);
      const attr = match ? match[1] : null;
      const found = [];
      const walk = (n) => {
        if (n.nodeType !== 1) return;
        if (attr && n.getAttribute(attr) != null) found.push(n);
        (n.children || []).forEach(walk);
      };
      (node.children || []).forEach(walk);
      return found;
    },
  };
  return node;
}

function loadPaint() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("shell/i18n-paint.js", WEB_ROOT), "utf8"),
    context,
    { filename: "shell/i18n-paint.js" }
  );
  return context.PetLiveWeb.shell;
}

describe("shell/i18n-paint scoped apply", () => {
  it("paints the root node and descendants in scope", () => {
    const paint = loadPaint();
    const labels = { home: "Home", title: "Title" };
    const t = (key) => labels[key] || key;
    const heading = el("h1", { "data-i18n": "title", text: "x" });
    const section = el("section", { "data-i18n-aria": "home" }, [heading]);
    paint.applyI18nInScope(section, t);
    assert.equal(section.getAttribute("aria-label"), "Home");
    assert.equal(heading.textContent, "Title");
  });

  it("scoped paint skips hidden screens", () => {
    const paint = loadPaint();
    const t = (key) => (key === "a" ? "A" : key === "b" ? "B" : key);
    const homeP = el("p", { "data-i18n": "a", text: "a" });
    const hiddenP = el("p", { "data-i18n": "b", text: "b" });
    const home = el("section", {}, [homeP]);
    const hidden = el("section", {}, [hiddenP]);
    const app = el("div", {}, [home, hidden]);
    const doc = {
      documentElement: { lang: "zh-Hant" },
      title: "",
      querySelector(sel) {
        if (sel === "#app .screen.is-active") return home;
        return null;
      },
      getElementById() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
    };
    home.parent = app;
    paint.applyI18nPaint(doc, t, { currentLang: "en" });
    assert.equal(homeP.textContent, "A");
    assert.equal(hiddenP.textContent, "b");
  });
});
