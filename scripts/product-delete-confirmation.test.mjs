import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

test("product deletion uses an accessible in-app confirmation", () => {
  const source = fs.readFileSync(
    path.join(projectRoot, "src/features/product/product-state-control.tsx"),
    "utf8",
  );

  assert.match(source, /deleteConfirmationOpen/);
  assert.match(source, /role="alertdialog"/);
  assert.match(source, /aria-labelledby="delete-product-title"/);
  assert.match(source, /aria-describedby="delete-product-description"/);
  assert.match(source, /aria-label="Подтвердить удаление товара"/);
  assert.match(source, /autoFocus/);
  assert.match(source, />\s*Отмена\s*</);
  assert.match(source, /event\.key !== "Escape"/);
  assert.match(source, /delete-product-trigger/);
  assert.match(source, /requestAnimationFrame/);
  assert.doesNotMatch(source, /window\.confirm/);
});
