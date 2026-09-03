import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);
const ALLOWLIST = JSON.parse(
  readFileSync(new URL("../fixtures/web-shared-css-allowlist.json", import.meta.url), "utf8"),
);

function read(path) {
  return readFileSync(new URL(path, WEB_ROOT), "utf8");
}

function parseRules(source, context = []) {
  const rules = [];
  let cursor = 0;

  while (cursor < source.length) {
    while (/\s/.test(source[cursor] || "")) cursor += 1;
    if (cursor >= source.length) break;

    if (source.startsWith("/*", cursor)) {
      const commentEnd = source.indexOf("*/", cursor + 2);
      cursor = commentEnd < 0 ? source.length : commentEnd + 2;
      continue;
    }

    const opening = source.indexOf("{", cursor);
    if (opening < 0) break;

    const prelude = source.slice(cursor, opening).trim().replace(/\s+/g, " ");
    let depth = 1;
    let closing = opening + 1;
    while (closing < source.length && depth > 0) {
      if (source.startsWith("/*", closing)) {
        const commentEnd = source.indexOf("*/", closing + 2);
        closing = commentEnd < 0 ? source.length : commentEnd + 2;
        continue;
      }
      if (source[closing] === "{") depth += 1;
      if (source[closing] === "}") depth -= 1;
      closing += 1;
    }

    const body = source.slice(opening + 1, closing - 1);
    if (
      prelude.startsWith("@media")
      || prelude.startsWith("@supports")
      || prelude.startsWith("@layer")
    ) {
      rules.push(...parseRules(body, [...context, prelude]));
    } else if (!prelude.startsWith("@")) {
      rules.push({
        context,
        selectors: prelude.split(",").map((selector) => selector.trim()),
        declarations: body.replace(/\/\*[\s\S]*?\*\//g, "").trim().replace(/\s+/g, " "),
        declarationCount: (body.match(/;/g) || []).length,
      });
    }
    cursor = closing;
  }

  return rules;
}

function isMigratedSelector(selector) {
  return selector.startsWith(".account-chip")
    || selector.startsWith(".screen-head-actions .account")
    || selector.startsWith(".parasite-strip")
    || selector.startsWith(".parasite-row");
}

function migratedRules(source) {
  return parseRules(source).filter((rule) => rule.selectors.some(isMigratedSelector));
}

function expandedSignatures(source) {
  return migratedRules(source)
    .flatMap((rule) => rule.selectors
      .filter(isMigratedSelector)
      .map((selector) => [
        [
          ...rule.context.filter((entry) => !entry.startsWith("@layer")),
          selector,
        ].join(" > "),
        rule.declarations,
      ]))
    .sort(([left], [right]) => left.localeCompare(right));
}

function assertHasSelector(source, selector) {
  assert.ok(
    parseRules(source).some((rule) => rule.selectors.includes(selector)),
    `missing canonical selector: ${selector}`,
  );
}

describe("Phase 1 shared CSS ownership", () => {
  const accountCss = read("shell/account-chrome.css");
  const parasiteCss = read("shell/parasite-strip.css");
  const cCss = read("c/styles.css");
  const bCss = read("styles.css");

  it("owns the approved account chip and screen-head rules in shell", () => {
    [
      ".account-chip",
      ".account-chip:hover",
      ".account-chip-avatar",
      ".account-chip-fallback",
      ".account-chip-name",
      ".screen-head-actions .account-menu",
      ".screen-head-actions .account-chip",
      ".screen-head-actions .account-chip-name",
    ].forEach((selector) => assertHasSelector(accountCss, selector));

    const rules = migratedRules(accountCss);
    assert.equal(rules.length, ALLOWLIST.canonicalOwners.account.ruleCount);
    assert.equal(
      rules.reduce((sum, rule) => sum + rule.declarationCount, 0),
      ALLOWLIST.canonicalOwners.account.declarationCount,
    );
  });

  it("owns the approved parasite layout, responsive, and status rules in shell", () => {
    [
      ".parasite-strip",
      ".parasite-row",
      ".parasite-row:hover",
      ".parasite-row:active",
      ".parasite-row-label",
      ".parasite-row-meta",
      ".parasite-row-status",
      ".parasite-row.is-protected",
      ".parasite-row.is-approaching",
      ".parasite-row.is-unprotected",
      ".parasite-row.is-optional",
    ].forEach((selector) => assertHasSelector(parasiteCss, selector));

    const canonicalSlice = parasiteCss.split(
      "/* Per-row traffic lights (reuses .e-vax-dot from emergency card). Keep last. */",
    )[0];
    const rules = migratedRules(canonicalSlice);
    assert.equal(rules.length, ALLOWLIST.canonicalOwners.parasite.ruleCount);
    assert.equal(
      rules.reduce((sum, rule) => sum + rule.declarationCount, 0),
      ALLOWLIST.canonicalOwners.parasite.declarationCount,
    );

    assert.match(parasiteCss, /\.parasite-strip-lights\s*\{/);
    assert.match(parasiteCss, /\.parasite-row \.parasite-row-status::before\s*\{/);
  });

  it("removes the measured 41-rule / 126-declaration duplicate slice from C", () => {
    assert.deepEqual(migratedRules(cCss), []);
  });

  it("temporarily allowlists only B's identical Phase 2 duplicates", () => {
    // Phase 2 deletes this fixture together with B's duplicate declarations.
    assert.equal(ALLOWLIST.delete_in, "Phase 2");
    assert.equal(ALLOWLIST.surface, "B");
    assert.equal(ALLOWLIST.file, "apps/web/styles.css");

    const canonical = `${accountCss}\n${parasiteCss.split(
      "/* Per-row traffic lights (reuses .e-vax-dot from emergency card). Keep last. */",
    )[0]}`;
    const bRules = migratedRules(bCss);
    const bSelectors = [...new Set(
      bRules.flatMap((rule) => rule.selectors.filter(isMigratedSelector)),
    )].sort();

    assert.deepEqual(expandedSignatures(bCss), expandedSignatures(canonical));
    assert.equal(bRules.length, ALLOWLIST.expected.ruleCount);
    assert.equal(
      bRules.reduce((sum, rule) => sum + rule.declarationCount, 0),
      ALLOWLIST.expected.declarationCount,
    );
    assert.deepEqual(bSelectors, [...ALLOWLIST.selectors].sort());
  });
});
