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
  const dialog = fs.readFileSync(
    path.join(projectRoot, "src/components/ui/dialog.tsx"),
    "utf8",
  );

  assert.match(source, /<Dialog/);
  assert.match(source, /confirmation === "delete"/);
  assert.match(source, /open=\{confirmation !== null\}/);
  assert.match(source, /aria-label="Подтвердить удаление товара"/);
  assert.match(source, /data-dialog-initial-focus/);
  assert.match(source, /fallbackFocusId="product-state-heading"/);
  assert.match(source, /Отмена/);
  assert.match(source, /delete-product-trigger/);
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
    source,
    /if \(!open\) \{[\s\S]*confirmationDialogOpenRef\.current = false[\s\S]*setConfirmation\(null\)/,
  );
  assert.match(source, /pending \? "Закрыть" : "Отмена"/);
  assert.doesNotMatch(source, /window\.confirm/);
});
