import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

test("product media deletion uses an accessible in-app confirmation", () => {
  const manager = fs.readFileSync(
    path.join(projectRoot, "src/features/product/product-media-manager.tsx"),
    "utf8",
  );

  assert.match(manager, /pendingRemovalId/);
  assert.match(manager, /role="alertdialog"/);
  assert.match(manager, /aria-labelledby=/);
  assert.match(manager, /aria-describedby=/);
  assert.match(manager, /autoFocus/);
  assert.match(manager, /Подтвердить удаление фото/);
  assert.match(manager, /Отмена/);
  assert.match(manager, /event\.key !== "Escape"/);
  assert.match(manager, /remove-photo-trigger-/);
  assert.match(manager, /requestAnimationFrame/);
  assert.doesNotMatch(manager, /window\.confirm/);
});
