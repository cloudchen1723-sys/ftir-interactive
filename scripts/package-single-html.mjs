#!/usr/bin/env node
/*
 * Build the classroom as one movable file.  This intentionally does not use a
 * bundler: index.html remains the source of truth for both asset order and
 * inline bootstrap code.
 */
import { readFile, writeFile, mkdir, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(root, 'index.html');
const output = path.join(root, 'dist', 'FTIR课堂单文件版.html');
const html = await readFile(input, 'utf8');

const mime = new Map([
  ['.css', 'text/css'], ['.js', 'text/javascript'], ['.json', 'application/json'],
  ['.svg', 'image/svg+xml'], ['.png', 'image/png'], ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'], ['.woff', 'font/woff'], ['.woff2', 'font/woff2'],
]);
const assetPath = (url, base = root) => {
  const clean = url.split('#')[0].split('?')[0].replace(/^\.\//, '');
  return path.resolve(base, clean);
};
const dataUri = async (file) => {
  const bytes = await readFile(file);
  const type = mime.get(path.extname(file).toLowerCase()) || 'application/octet-stream';
  return `data:${type};base64,${bytes.toString('base64')}`;
};

const cssFiles = [];
const jsFiles = [];
const missing = [];
const localCss = async (href) => {
  const file = assetPath(href);
  if (!existsSync(file)) { missing.push(href); return `/* missing local stylesheet: ${href} */`; }
  cssFiles.push(path.relative(root, file).replaceAll('\\', '/'));
  let text = await readFile(file, 'utf8');
  // CSS URLs are part of the stylesheet, so resolve local files before the
  // stylesheet leaves the filesystem. Remote/data URLs stay untouched.
  const urls = [...text.matchAll(/url\(\s*(['"]?)([^'"\)]+)\1\s*\)/gi)];
  for (const [, , raw] of urls) {
    const ref = raw.trim();
    if (/^(?:data:|https?:|blob:|#)/i.test(ref)) continue;
    const fileRef = path.resolve(path.dirname(file), ref);
    if (!existsSync(fileRef) || !(await stat(fileRef)).isFile()) {
      missing.push(`${path.relative(root, file)} -> ${ref}`);
      continue;
    }
    text = text.replaceAll(raw, await dataUri(fileRef));
  }
  return text;
};

const localJs = async (src) => {
  const file = assetPath(src);
  if (!existsSync(file)) { missing.push(src); return `/* missing local script: ${src} */`; }
  jsFiles.push(path.relative(root, file).replaceAll('\\', '/'));
  return readFile(file, 'utf8');
};

// Keep every JSON record available to the file:// fetch adapter. This includes
// manifest/annotation metadata, the lab catalog and all processed spectra.
const dataFiles = [];
for (const name of ['reference-data/manifest.json', 'reference-data/annotations.json', 'reference-data/verification-report.json', 'reference-data/srm-1921b.json', 'reference-data/lab-catalog.json']) {
  if (existsSync(path.join(root, name))) dataFiles.push(name);
}
for (const name of (await readdir(path.join(root, 'reference-data', 'processed'))).filter((name) => name.endsWith('.json')).sort()) {
  dataFiles.push(`reference-data/processed/${name}`);
}
// Fail the build if a catalog entry cannot be carried into the movable file.
const catalog = JSON.parse(await readFile(path.join(root, 'reference-data', 'lab-catalog.json'), 'utf8'));
for (const sample of catalog.samples) {
  if (!dataFiles.includes(`reference-data/${sample.file}`)) throw new Error(`Catalog spectrum is not bundled: ${sample.file}`);
}
const records = Object.fromEntries(await Promise.all(dataFiles.map(async (rel) => [rel, await readFile(path.join(root, rel, ''), 'utf8')])));

const safeScript = (source) => source.replace(/<\/script/gi, '<\\/script');
const fetchAdapter = `
/* FTIR single-file data bridge: only bundled reference-data URLs are handled. */
(() => {
  const records = Object.freeze(${JSON.stringify(records)});
  const originalFetch = window.fetch.bind(window);
  const normalize = (input) => {
    let raw = typeof input === 'string' ? input : (input && input.url) || '';
    try { raw = new URL(raw, window.location.href).pathname; } catch (_) {}
    raw = decodeURIComponent(String(raw)).replace(/\\\\/g, '/');
    const marker = 'reference-data/';
    const at = raw.indexOf(marker);
    return at >= 0 ? raw.slice(at) : raw.replace(/^\\.\\//, '').replace(/^\\//, '');
  };
  window.fetch = (input, init = {}) => {
    const key = normalize(input);
    if (!Object.prototype.hasOwnProperty.call(records, key)) return originalFetch(input, init);
    const signal = (init && init.signal) || (input instanceof Request ? input.signal : null);
    if (signal && signal.aborted) return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'));
    return Promise.resolve(new Response(records[key], {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    }));
  };
  document.addEventListener('click', (event) => {
    const home = event.target.closest('[data-single-file-home]');
    if (!home) return;
    event.preventDefault();
    if (typeof window.navigateFTIRView === 'function') window.navigateFTIRView('home');
    else window.location.hash = 'home';
  });
})();
`;

let body = html.replace(/<a\s+([^>]*class="(?:home-brand|brand)"[^>]*)href="\.\/"/gi, '<a $1href="#home" data-single-file-home');
// Replacement callbacks cannot await, so process stylesheet/script tags in a
// single ordered token walk below.
const token = /<link\s+([^>]*rel=["']stylesheet["'][^>]*)>|<script\s+([^>]*?)src=["']([^"']+)["'][^>]*>\s*<\/script>/gi;
let cursor = 0;
let built = '';
for (const match of body.matchAll(token)) {
  built += body.slice(cursor, match.index);
  if (match[1]) {
    const href = (match[1].match(/href=["']([^"']+)["']/i) || [])[1];
    if (!href || /^(?:https?:|data:)/i.test(href)) built += match[0];
    else built += `<style data-source="${href}">\n${safeScript(await localCss(href))}\n</style>`;
  } else {
    const src = match[3];
    if (/^(?:https?:|data:)/i.test(src)) built += match[0];
    else {
      built += `<script data-source="${src}">\n${safeScript(await localJs(src))}\n</script>`;
      // The source tag's onload callback is meaningful: instrument.js waits
      // for this readiness event before constructing the optional 3D view.
      if (/\/OrbitControls\.js(?:[?#]|$)/i.test(src)) {
        built += `<script data-source="${src}#onload">window.dispatchEvent(new Event('ftir-3d-ready'));</script>`;
      }
    }
  }
  cursor = match.index + match[0].length;
}
built += body.slice(cursor);
const firstScript = built.indexOf('<script');
if (firstScript < 0) throw new Error('index.html has no script bootstrap point');
built = `${built.slice(0, firstScript)}<script data-source="single-file-fetch-adapter">${safeScript(fetchAdapter)}</script>${built.slice(firstScript)}`;

// Keep source attribution in the artifact itself; links and citations rendered
// by the lesson remain unchanged and vendor license text travels with the file.
const license = await readFile(path.join(root, 'vendor', 'THREE-LICENSE.txt'), 'utf8');
built = built.replace('</body>', `<!-- Bundled source license: vendor/THREE-LICENSE.txt\n${license.replace(/--/g, '—')}\n-->\n</body>`);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, built, 'utf8');

const sourceText = await Promise.all(jsFiles.map((rel) => readFile(path.join(root, rel), 'utf8')));
const dynamicRefs = [...sourceText.join('\n').matchAll(/fetch\s*\(\s*[`'"`]([^`'"`$]+)[`'"`]/g)].map((m) => m[1]);
console.log(JSON.stringify({ output: path.relative(root, output), bytes: Buffer.byteLength(built), stylesheets: cssFiles.length, scripts: jsFiles.length, embeddedJson: dataFiles, dynamicFetchRefs: dynamicRefs, missing }, null, 2));
if (missing.length) process.exitCode = 1;
