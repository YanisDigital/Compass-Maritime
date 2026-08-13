/**
 * Folds the built application into one self-contained HTML file.
 *
 * The result opens by double-clicking, from a USB stick or an email attachment, with no
 * install and no server. Inline module scripts run from `file://`; external ones do not,
 * which is why everything has to end up inside the single document.
 *
 *   npm run build
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertSelfContained } from './assert-self-contained.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'apps', 'web');
const BUILD = join(WEB, 'dist-single');
const PUBLIC = join(WEB, 'public');
const OUTPUT = join(BUILD, 'compass-error.html');
const RELEASE = join(ROOT, 'release');

rmSync(BUILD, { recursive: true, force: true });

// Vite is resolved the way Node would resolve it from the web workspace, and driven through
// its own API. Nothing here depends on where the installer chose to put the package or on
// spawning a shell, both of which vary by npm version and by platform.
const requireFromWeb = createRequire(pathToFileURL(join(WEB, 'package.json')));
let vite;
try {
  vite = await import(pathToFileURL(requireFromWeb.resolve('vite')).href);
} catch {
  console.error('Vite could not be resolved from apps/web. Run npm install first.');
  process.exit(1);
}

await vite.build({ root: WEB });

if (!existsSync(join(BUILD, 'index.html'))) {
  console.error(`No build found at ${BUILD}.`);
  process.exit(1);
}

/** A closing tag inside inlined text would end the element early. */
const neutralise = (text, tag) =>
  text.replace(new RegExp(`</(${tag})`, 'gi'), String.raw`<\/$1`);

const MIME = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function dataUri(relativePath) {
  const clean = relativePath.replace(/^\.?\//, '');
  const source = existsSync(join(BUILD, clean)) ? join(BUILD, clean) : join(PUBLIC, clean);
  if (!existsSync(source)) return undefined;
  const mime = MIME[extname(clean).toLowerCase()] ?? 'application/octet-stream';
  return `data:${mime};base64,${readFileSync(source).toString('base64')}`;
}

let html = readFileSync(join(BUILD, 'index.html'), 'utf8');

// Stylesheets become <style> blocks.
html = html.replace(
  /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/gi,
  (match, href) => {
    const file = join(BUILD, href.replace(/^\.?\//, ''));
    if (!existsSync(file)) return match;
    return `<style>\n${neutralise(readFileSync(file, 'utf8'), 'style')}\n</style>`;
  },
);

// The module bundle becomes an inline module script.
html = html.replace(
  /<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*><\/script>/gi,
  (match, src) => {
    const file = join(BUILD, src.replace(/^\.?\//, ''));
    if (!existsSync(file)) return match;
    return `<script type="module">\n${neutralise(readFileSync(file, 'utf8'), 'script')}\n</script>`;
  },
);

// Icons become data URIs.
html = html.replace(/href="(\.\/[^"]+\.(?:svg|png|ico))"/gi, (match, href) => {
  const uri = dataUri(href);
  return uri ? `href="${uri}"` : match;
});

/**
 * The application makes no network requests. This makes the browser enforce that, instead of
 * leaving it a property of how the code happens to be written today: `default-src 'none'`
 * covers connect-src, so fetch, XHR and WebSocket are refused whatever runs.
 *
 * It goes in at build time rather than sitting in index.html because the dev server needs the
 * opposite — its module graph and hot-reload socket are all external requests.
 *
 * A meta tag rather than a header, because this file is carried about on USB sticks and as an
 * email attachment, and a header would not survive the copy. `frame-ancestors` is deliberately
 * absent: browsers ignore it when it arrives this way, and a policy that claims a protection
 * it does not deliver is worse than not claiming it.
 *
 * `'unsafe-inline'` is unavoidable once script and style are inlined into the document, which
 * is the whole point of the build. It concedes nothing here: there is no injection point, and
 * no origin the page is allowed to reach.
 */
const CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'img-src data:',
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

html = html.replace(
  '</head>',
  `<meta http-equiv="Content-Security-Policy" content="${CSP}" />\n` +
    '    <meta name="robots" content="noindex" />\n  </head>',
);

writeFileSync(OUTPUT, html);

// Nothing may remain that the browser would have to fetch. CI runs this same check again
// against the page it is about to publish.
try {
  assertSelfContained(html, 'compass-error.html');
} catch {
  process.exit(1);
}

// A copy outside the ignored build directory, so the file somebody is meant to be handed
// can be committed and downloaded straight from the repository.
mkdirSync(RELEASE, { recursive: true });
writeFileSync(join(RELEASE, 'compass-error.html'), html);

const kb = (readFileSync(OUTPUT).length / 1024).toFixed(0);
console.log(`wrote release/compass-error.html (${kb} kB, fully self-contained)`);
