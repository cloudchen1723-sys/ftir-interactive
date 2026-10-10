import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
  const item = path.join(dir, entry.name);
  assert.ok(!entry.isSymbolicLink(), `Runtime link found: ${item}`);
  return entry.isDirectory() ? walk(item) : [item];
});
const files = walk(root);
const relative = file => path.relative(root, file).replaceAll('\\', '/');
const records = new Map(manifest.files.map(file => [file.path, file]));
assert.equal(records.size, manifest.files.length, 'Duplicate manifest paths');
const expectedFiles = files.filter(file => relative(file) !== 'manifest.json');
assert.equal(records.size, expectedFiles.length, 'Unmanifested or missing files');
let bytes = 0;
for (const file of expectedFiles) {
  const name = relative(file);
  const record = records.get(name);
  assert.ok(record, `Unmanifested file: ${name}`);
  assert.ok(!/(?:^|\/)(?:node_modules|dist|out|build|render-temp|\.git|puppeteer[^/]*|chrome[^/]*|cache)(?:\/|$)/i.test(name), `Runtime directory: ${name}`);
  assert.ok(!/(?:^|\/)\.env(?:\.|$)/i.test(name), `Environment file: ${name}`);
  assert.ok(!/\.(?:wav|log)$/i.test(name), `Excluded output: ${name}`);
  const data = fs.readFileSync(file);
  assert.equal(data.length, record.bytes, `Size mismatch: ${name}`);
  assert.equal(crypto.createHash('sha256').update(data).digest('hex').toUpperCase(), record.sha256, `Hash mismatch: ${name}`);
  bytes += data.length;
}
const media = expectedFiles.map(relative).filter(name => /\.(?:mp4|mp3|m4a)$/i.test(name)).sort();
assert.deepEqual(media, [
  'source/music/ftir-music-part-1.mp3',
  'source/music/ftir-music-part-2.mp3',
  'source/music/ftir-music-part-3.mp3',
  'source/public/audio/music/ftir-preview-continuous.m4a',
  'video/FTIR_final_bilingual.mp4',
]);
assert.deepEqual(fs.readdirSync(path.join(root, 'video')), ['FTIR_final_bilingual.mp4']);
assert.equal(records.get('video/FTIR_final_bilingual.mp4').sha256, 'CE9926DAEC055EFFA6B18C3F8EF13737A4BFA33A006FA77214E3E21FA9FAF1DA');
assert.equal(records.get('video/FTIR_final_bilingual.mp4').bytes, 120308318);

let checkedImports = 0;
let checkedAssets = 0;
const secretSignatures = /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk-proj-[A-Za-z0-9_-]{30,}|AIza[0-9A-Za-z_-]{35}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/;
for (const file of expectedFiles.filter(file => /\.(?:[cm]?[jt]sx?|json|md|html|txt|srt)$/.test(file))) {
  const text = fs.readFileSync(file, 'utf8');
  assert.ok(!secretSignatures.test(text), `Credential signature: ${relative(file)}`);
  if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
  for (const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"](\.[^'"]+)['"]/g)) {
    const target = path.resolve(path.dirname(file), match[1]);
    const candidates = [target, ...['.ts', '.tsx', '.js', '.jsx', '.json', '.css'].map(ext => target + ext), ...['index.ts', 'index.tsx', 'index.js'].map(name => path.join(target, name))];
    assert.ok(candidates.some(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()), `Missing local import ${match[1]} in ${relative(file)}`);
    checkedImports++;
  }
  for (const match of text.matchAll(/staticFile\(['"]([^'"]+)['"]\)/g)) {
    assert.ok(fs.existsSync(path.join(root, 'source/public', match[1])), `Missing asset: ${match[1]}`);
    checkedAssets++;
  }
}
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
assert.match(read('source/src/remotion/Root.tsx'), /id="FTIRFullPreview"/);
assert.match(read('source/src/timeline/fullPreviewTimeline.ts'), /totalFrames:\s*10800/);
assert.match(read('source/src/remotion/FTIRFullPreview.tsx'), /NARRATIVE_SAMPLE_RECORD/);
const pkg = JSON.parse(read('source/package.json'));
const lock = JSON.parse(read('source/package-lock.json')).packages[''];
assert.deepEqual(pkg.dependencies, lock.dependencies);
assert.deepEqual(pkg.devDependencies, lock.devDependencies);
console.log(JSON.stringify({status: 'PASS', hashedFiles: records.size, manifestedBytes: bytes, checkedImports, checkedAssets, mediaFiles: media.length, forbiddenRuntimeFiles: 0, credentialSignatureFindings: 0, videoSidecars: 0}, null, 2));
