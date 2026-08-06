import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

test("an empty seller cover result does not call storage signing", () => {
  const source = fs.readFileSync(
    path.join(projectRoot, "src/features/product/media-queries.ts"),
    "utf8",
  );
  const emptyGuard = source.indexOf("if (mediaRows.length === 0)");
  const signingCall = source.indexOf("createSignedUrls(", emptyGuard);

  assert.notEqual(emptyGuard, -1);
  assert.notEqual(signingCall, -1);
  assert.ok(emptyGuard < signingCall);
  assert.match(
    source.slice(emptyGuard, signingCall),
    /return \{ status: "found", covers: new Map\(\) \}/,
  );
});
