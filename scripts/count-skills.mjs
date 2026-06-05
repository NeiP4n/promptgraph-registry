#!/usr/bin/env node
/**
 * Counts real skill files in each repo bundle using the same logic as detectSkillsDir.
 * Updates registry.json skillCount fields with accurate numbers.
 */
import fs from 'fs';
import https from 'https';

const SKILL_DIRS = ['skills', 'commands', 'prompts', 'agents', 'skills-store', 'slash-commands', 'custom-commands', 'templates'];
const SKIP_NAMES = /^(readme|changelog|license|contributing|code.of.conduct|security|authors|credits|install|installation|usage|faq|glossary|index|overview|summary|roadmap|todo|notes|template|example|sample|demo|getting.started|quickstart|guide|tutorial|walkthrough|architecture|design|spec|specification|requirements|privacy|terms|disclaimer|notice|copying|warranty|funding)/i;
const SKIP_DIRS  = /^(\.(github|git)|docs?|documentation|examples?|tests?|__tests__|spec|fixtures|assets|images|img|screenshots|media|static|public|dist|build|node_modules|vendor)/i;

const TOKEN = process.env.GITHUB_TOKEN || '';

function fetch(url) {
  return new Promise((res, rej) => {
    const headers = { 'User-Agent': 'promptgraph-counter' };
    if (TOKEN) headers['Authorization'] = `token ${TOKEN}`;
    const req = https.get(url, { headers }, r => {
      if (r.statusCode === 403) return rej(new Error(`Rate limited: ${url}`));
      if (r.statusCode !== 200) return rej(new Error(`HTTP ${r.statusCode}: ${url}`));
      let d = ''; r.setEncoding('utf8'); r.on('data', c => d += c); r.on('end', () => res(d));
    });
    req.on('error', rej);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function countFromTree(files) {
  const allMd = files.filter(f => f.type === 'blob' && f.path.endsWith('.md'));

  // 1. Try known skill subdirs in priority order
  for (const dir of SKILL_DIRS) {
    const inDir = allMd.filter(f => f.path === dir + '/' || f.path.startsWith(dir + '/'));
    if (inDir.length >= 2) {
      const count = inDir.filter(f => {
        const base = f.path.split('/').pop().replace(/\.md$/i, '').toLowerCase();
        return !SKIP_NAMES.test(base);
      }).length;
      return { count, detected: dir };
    }
  }

  // 2. Root fallback — skip meta files and skip dirs
  const count = allMd.filter(f => {
    const parts = f.path.split('/');
    const base  = parts[parts.length - 1].replace(/\.md$/i, '').toLowerCase();
    if (SKIP_NAMES.test(base)) return false;
    if (parts.slice(0, -1).some(p => SKIP_DIRS.test(p))) return false;
    return true;
  }).length;
  return { count, detected: '(root)' };
}

async function countRepo(ownerRepo) {
  const url = `https://api.github.com/repos/${ownerRepo}/git/trees/HEAD?recursive=1`;
  const json = await fetch(url);
  const tree = JSON.parse(json);
  if (!tree.tree) throw new Error('No tree in response');
  return countFromTree(tree.tree);
}

// ── main ──────────────────────────────────────────────────────────────────────

const registry = JSON.parse(fs.readFileSync('registry.json', 'utf8'));
let changed = false;

for (const bundle of registry.bundles) {
  if (!bundle.repo_url) continue;

  process.stdout.write(`Counting ${bundle.repo_url} ... `);
  try {
    const { count, detected } = await countRepo(bundle.repo_url);
    console.log(`${count} skills (from ${detected})`);
    if (bundle.skillCount !== count) {
      bundle.skillCount = count;
      changed = true;
    }
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }

  await sleep(TOKEN ? 200 : 1500); // unauthenticated = slower to avoid rate limit
}

if (changed) {
  fs.writeFileSync('registry.json', JSON.stringify(registry, null, 2));
  console.log('\n✓ registry.json updated');
} else {
  console.log('\n✓ All counts already accurate');
}
