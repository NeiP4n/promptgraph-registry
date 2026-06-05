#!/usr/bin/env node
import fs from 'fs';
import https from 'https';

const SKILL_DIRS = ['skills', 'commands', 'prompts', 'agents', 'skills-store', 'slash-commands', 'custom-commands', 'templates'];
const SKIP_DIRS = new Set(['.github', 'docs', 'doc', 'assets', 'images', 'img', 'media', 'static', 'scripts', 'ci_scripts', 'node_modules', 'vendor', 'dist', 'build', 'tests', 'test', 'examples', 'example', 'fixtures']);
const TOKEN = process.env.GITHUB_TOKEN || '';

function fetch(url) {
  return new Promise((res, rej) => {
    const headers = { 'User-Agent': 'promptgraph-validator' };
    if (TOKEN) headers['Authorization'] = `token ${TOKEN}`;
    const req = https.get(url, { headers }, r => {
      if (r.statusCode === 403 || r.statusCode === 429) return rej(new Error(`rate-limited`));
      if (r.statusCode === 404) return rej(new Error(`404`));
      if (r.statusCode !== 200) { r.resume(); return rej(new Error(`HTTP ${r.statusCode}`)); }
      let d = ''; r.setEncoding('utf8'); r.on('data', c => d += c); r.on('end', () => res(d));
    });
    req.on('error', rej);
  });
}

const DELAY = TOKEN ? 300 : 4000;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function detectSubdir(ownerRepo) {
  const entries = JSON.parse(await fetch(`https://api.github.com/repos/${ownerRepo}/contents`));
  if (!Array.isArray(entries)) return null;

  const dirMap = new Map(entries.filter(e => e.type === 'dir').map(e => [e.name.toLowerCase(), e.name]));
  for (const d of SKILL_DIRS) {
    if (dirMap.has(d)) return dirMap.get(d);
  }

  const subdirs = entries.filter(e => e.type === 'dir' && !SKIP_DIRS.has(e.name.toLowerCase()));
  let best = null, bestCount = 0;
  for (const dir of subdirs) {
    try {
      const sub = JSON.parse(await fetch(`https://api.github.com/repos/${ownerRepo}/contents/${dir.name}`));
      const mdCount = Array.isArray(sub) ? sub.filter(e => e.type === 'file' && e.name.endsWith('.md')).length : 0;
      if (mdCount >= 1 && mdCount > bestCount) { best = dir.name; bestCount = mdCount; }
    } catch {}
    await sleep(DELAY);
  }
  return best;
}

const registry = JSON.parse(fs.readFileSync('registry.json', 'utf8'));
const keep = [], removed = [], errors = [];

for (const b of registry.bundles) {
  if (!b.repo_url) { keep.push(b); continue; }

  process.stdout.write(`Checking ${b.repo_url}... `);
  try {
    const subdir = await detectSubdir(b.repo_url);
    if (subdir) {
      console.log(`✓ ${subdir}/`);
      keep.push(b);
    } else {
      console.log(`✗ no skill subdir`);
      removed.push(b.id);
    }
  } catch (e) {
    console.log(`? ${e.message} (keeping)`);
    errors.push(b.id);
    keep.push(b); // don't remove on network error
  }
  await sleep(DELAY);
}

console.log(`\nResult: ${keep.length} kept, ${removed.length} removed, ${errors.length} errors`);
if (removed.length) {
  console.log(`Removed: ${removed.join(', ')}`);
  registry.bundles = keep;
  registry.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync('registry.json', JSON.stringify(registry, null, 2));
  console.log('✓ registry.json updated');
}
if (errors.length) console.log(`Kept on error (check manually): ${errors.join(', ')}`);
