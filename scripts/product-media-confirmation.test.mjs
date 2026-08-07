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
  const dialog = fs.readFileSync(
    path.join(projectRoot, "src/components/ui/dialog.tsx"),
    "utf8",
  );

  assert.match(manager, /pendingRemovalId/);
  assert.match(manager, /<Dialog/);
  assert.match(manager, /open=\{Boolean\(removalMedia\)\}/);
  assert.match(manager, /data-dialog-initial-focus/);
  assert.match(manager, /fallbackFocusId="product-media-heading"/);
  assert.match(manager, /Подтвердить удаление фотографии/);
  assert.match(manager, /Отмена/);
  assert.match(manager, /remove-photo-trigger-/);
  assert.match(dialog, /<dialog/);
  assert.match(dialog, /dialog\.showModal\(\)/);
  assert.match(dialog, /aria-labelledby=\{titleId\}/);
  assert.match(dialog, /aria-describedby=\{description \? descriptionId : undefined\}/);
  assert.match(dialog, /onCancel=/);
  assert.match(dialog, /requestAnimationFrame/);
  assert.match(dialog, /restoreTarget\?\.isConnected/);
  assert.match(dialog, /focusWasMoved/);
  assert.match(dialog, /querySelector<HTMLElement>\("#main-content"\)/);
  assert.match(dialog, /focusTarget\?\.focus\(\)/);
  assert.match(
    manager,
    /if \(!open\) \{[\s\S]*removalDialogOpenRef\.current = false[\s\S]*setPendingRemovalId\(null\)/,
  );
  assert.match(manager, /mutationPending \? "Закрыть" : "Отмена"/);
  assert.doesNotMatch(manager, /window\.confirm/);
});
