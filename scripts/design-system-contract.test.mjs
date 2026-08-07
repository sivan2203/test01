import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function collectSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(entryPath);
    return /\.(?:css|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

function readHexVariable(source, name) {
  const match = source.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(match, `Missing --${name}`);
  return match[1];
}

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((part) => Number.parseInt(part, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(left, right) {
  const leftLuminance = relativeLuminance(left);
  const rightLuminance = relativeLuminance(right);
  return (
    (Math.max(leftLuminance, rightLuminance) + 0.05) /
    (Math.min(leftLuminance, rightLuminance) + 0.05)
  );
}

test("the implemented visual language keeps the canonical light tokens and typography", () => {
  const globals = read("src/app/globals.css");
  const fonts = read("src/app/fonts.ts");
  const layout = read("src/app/layout.tsx");

  assert.match(globals, /color-scheme: light/);
  assert.match(globals, /--background: #f5f3ee/i);
  assert.match(globals, /--surface-raised: #fbfaf7/i);
  assert.match(globals, /--foreground: #171716/i);
  assert.match(globals, /--primary: #2457e6/i);
  assert.ok(
    contrastRatio(
      readHexVariable(globals, "border-strong"),
      readHexVariable(globals, "background"),
    ) >= 3,
    "Strong control boundaries must reach 3:1 against the canvas",
  );
  assert.ok(
    contrastRatio(
      readHexVariable(globals, "ink-disabled"),
      readHexVariable(globals, "surface-raised"),
    ) >= 4.5,
    "Placeholder and disabled text must reach 4.5:1 against raised controls",
  );
  assert.match(globals, /--radius-sm: 0\.375rem/);
  assert.match(globals, /--radius-lg: 0\.625rem/);
  assert.doesNotMatch(globals, /prefers-color-scheme:\s*dark/i);

  assert.match(fonts, /Onest/);
  assert.match(fonts, /JetBrains_Mono/);
  assert.match(fonts, /subsets: \["cyrillic", "latin"\]/);
  assert.match(layout, /lang="ru"/);
  assert.match(layout, /onest\.variable/);
  assert.match(layout, /jetBrainsMono\.variable/);
});

test("shared controls remain rectangular, keyboard-visible, and motion-safe", () => {
  const globals = read("src/app/globals.css");
  const button = read("src/components/ui/button.tsx");
  const field = read("src/components/ui/field.tsx");
  const surface = read("src/components/design-system/surface.tsx");
  const layout = read("src/app/layout.tsx");

  assert.match(button, /min-h-11 min-w-11/);
  assert.match(button, /rounded-md/);
  assert.doesNotMatch(button, /rounded-full/);
  assert.match(field, /min-h-11/);
  assert.match(field, /focus:ring-2/);
  assert.match(surface, /rounded-lg border border-border/);
  assert.doesNotMatch(surface, /backdrop|blur|gradient/i);
  assert.match(globals, /:focus-visible/);
  assert.match(globals, /prefers-reduced-motion: reduce/);
  assert.match(globals, /forced-colors: active/);
  assert.match(layout, /className="skip-link"/);
  assert.match(layout, /href="#main-content"/);
});

test("application source does not regress to glass, decorative gradients, or oversized radius", () => {
  const source = collectSourceFiles(path.join(projectRoot, "src"))
    .map((filePath) => fs.readFileSync(filePath, "utf8"))
    .join("\n");

  assert.doesNotMatch(source, /\bGlassPanel\b/);
  assert.doesNotMatch(source, /\bbg-glass\b/);
  assert.doesNotMatch(source, /backdrop-blur/);
  assert.doesNotMatch(source, /(?:linear|radial|conic)-gradient\(/i);
  assert.doesNotMatch(source, /rounded-(?:2xl|3xl)/);
});

test("seller navigation is Russian, responsive, and exposes the active destination", () => {
  const navigation = read("src/components/seller/seller-navigation.tsx");
  const shell = read("src/components/seller/seller-shell.tsx");

  for (const label of ["Сводка", "Товары", "Аналитика", "Магазин"]) {
    assert.match(navigation, new RegExp(label));
  }
  assert.match(navigation, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(navigation, /grid grid-cols-4/);
  assert.match(shell, /lg:grid-cols-\[232px_minmax\(0,1fr\)\]/);
  assert.match(shell, /env\(safe-area-inset-bottom\)/);
  assert.match(shell, /<main/);
  assert.match(shell, /id="main-content"/);
});
