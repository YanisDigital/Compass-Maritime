/**
 * Fails if an HTML file would make the browser fetch anything.
 *
 * This is the whole guarantee behind "double-click it and it works, with no network", so it
 * looks for every way an external load can get in — not just the attributes this project's
 * build happens to inline today.
 *
 * One implementation, used by the build and again by CI against the file about to be
 * published, so the two cannot drift apart.
 *
 *   node scripts/assert-self-contained.mjs <file>
 */
import { readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** Namespace declarations on `<svg>` are identifiers. The browser never fetches them. */
const XML_NAMESPACE = /^http:\/\/www\.w3\.org\//;

/** `data:` is the point of the build; `#` is a same-document reference. */
const isLocal = (value) =>
  value === '' || value.startsWith('data:') || value.startsWith('#') || XML_NAMESPACE.test(value);

/** Every external reference the page would act on, as `{ reference, context }`. */
export function findExternalReferences(html) {
  const found = [];

  const scan = (pattern, describe) => {
    for (const match of html.matchAll(pattern)) {
      const reference = match[1].trim();
      if (!isLocal(reference)) found.push({ reference, context: describe(match) });
    }
  };

  // Attributes that make the browser go and get something.
  scan(
    /\b(?:src|href|srcset|poster|data|action|formaction)\s*=\s*"([^"]*)"/gi,
    (m) => m[0].slice(0, 80),
  );
  // Stylesheet fetches, which no attribute scan would ever see.
  scan(/url\(\s*['"]?([^)'"]+)/gi, (m) => `url(${m[1].trim()})`);
  scan(/@import\s+(?:url\()?\s*['"]?([^;)'"]+)/gi, (m) => `@import ${m[1].trim()}`);

  return found;
}

export function assertSelfContained(html, label) {
  const found = findExternalReferences(html);
  if (found.length === 0) return;

  console.error(`${label} is not self-contained — the page would still fetch:`);
  for (const context of [...new Set(found.map((f) => f.context))]) console.error(`  ${context}`);
  throw new Error(`${found.length} external reference(s)`);
}

// Also usable straight from the shell, which is how CI checks the assembled page. Comparing
// resolved file URLs keeps this working on Windows, where argv[1] is a drive-letter path.
const invokedDirectly =
  process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url;

if (invokedDirectly) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node scripts/assert-self-contained.mjs <file>');
    process.exit(2);
  }
  try {
    assertSelfContained(readFileSync(file, 'utf8'), file);
    console.log(`${file}: no external references.`);
  } catch {
    process.exit(1);
  }
}
