import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadProofMerge() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("domains/cloud/proof-merge.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/cloud/proof-merge.js" }
  );
  return context.PetLiveWeb.domains.cloud;
}

describe("cloud proof-merge", () => {
  it("mergeLocalRxProofs restores bag/rx/drug on matched visit and med", () => {
    const cloud = loadProofMerge();
    const local = [
      {
        id: "p1",
        visits: [
          {
            date: "2026-09-01",
            bagPhoto: "bag",
            rxPhoto: "rx",
            drugPhoto: "drug",
            medications: [
              { id: "m1", name: "A", bagPhoto: "mbag", rxPhoto: null },
            ],
          },
        ],
      },
    ];
    const incoming = [
      {
        id: "p1",
        visits: [
          {
            date: "2026-09-01",
            medications: [{ id: "m1", name: "A" }],
          },
        ],
      },
    ];
    const merged = cloud.mergeLocalRxProofs(local, incoming);
    assert.equal(merged[0].visits[0].bagPhoto, "bag");
    assert.equal(merged[0].visits[0].rxPhoto, "rx");
    assert.equal(merged[0].visits[0].drugPhoto, "drug");
    assert.equal(merged[0].visits[0].medications[0].bagPhoto, "mbag");
    assert.equal(merged[0].visits[0].medications[0].rxPhoto, undefined);
  });

  it("does not overwrite non-empty cloud proof or invent for other pets", () => {
    const cloud = loadProofMerge();
    const local = [
      {
        id: "p1",
        visits: [{ date: "2026-09-01", bagPhoto: "local-bag" }],
      },
      {
        id: "p2",
        visits: [{ date: "2026-09-01", bagPhoto: "other" }],
      },
    ];
    const incoming = [
      {
        id: "p1",
        visits: [{ date: "2026-09-01", bagPhoto: "already" }],
      },
      {
        id: "p3",
        visits: [{ date: "2026-09-01" }],
      },
    ];
    const merged = cloud.mergeLocalRxProofs(local, incoming);
    assert.equal(merged[0].visits[0].bagPhoto, "already");
    assert.equal(merged[1].id, "p3");
    assert.equal(merged[1].visits[0].bagPhoto, undefined);
  });

  it("proof-merge.js has no document, localStorage, or fetch", () => {
    const src = readFileSync(
      new URL("domains/cloud/proof-merge.js", WEB_ROOT),
      "utf8"
    );
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\blocalStorage\b/.test(src), false);
    assert.equal(/\bfetch\b/.test(src), false);
  });
});
