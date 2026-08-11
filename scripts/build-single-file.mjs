/**
 * Folds the built application into one self-contained HTML file.
 *
 * The result opens by double-clicking, from a USB stick or an email attachment, with no
 * install and no server. Inline module scripts run from `file://`; external ones do not,
 * which is why everything has to end up inside the single document.
 *
 *   npm run build:single
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'apps', 'web');
const BUILD = join(WEB, 'dist-single');
const PUBLIC = join(WEB, 'public');
const OUTPUT = join(BUILD, 'compass-error.html');
const RELEASE = join(ROOT, 'release');

rmSync(BUILD, { recursive: true, force: true });

// Vite's own entry point, run on this Node binary: no shell, so it behaves the same on
// Windows as it does anywhere else.
const viteBin = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
if (!existsSync(viteBin)) {
  console.error(`Vite not found at ${viteBin}. Run npm install first.`);
  process.exit(1);
}

execFileSync(process.execPath, [viteBin, 'build'], {
  cwd: WEB,
  stdio: 'inherit',
  env: { ...process.env, VITE_SINGLE_FILE: 'true' },
});

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

html = html.replace(
  '</head>',
  '<meta name="robots" content="noindex" />\n  </head>',
);

writeFileSync(OUTPUT, html);

// Nothing may remain that the browser would have to fetch from disk.
const leftovers = [...html.matchAll(/(?:src|href)="((?!data:|#)[^"]+)"/gi)].map((m) => m[1]);
if (leftovers.length > 0) {
  console.error(`Not self-contained — still references: ${leftovers.join(', ')}`);
  process.exit(1);
}

// A copy outside the ignored build directory, so the file somebody is meant to be handed
// can be committed and downloaded straight from the repository.
mkdirSync(RELEASE, { recursive: true });
writeFileSync(join(RELEASE, 'compass-error.html'), html);

const kb = (readFileSync(OUTPUT).length / 1024).toFixed(0);
console.log(`wrote release/compass-error.html (${kb} kB, fully self-contained)`);
