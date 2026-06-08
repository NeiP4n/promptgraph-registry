import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = path.join(__dirname, '..', 'registry.json');

function httpsGet(url) {
  const token = process.env.GITHUB_TOKEN;
  const headers = { 'User-Agent': 'promptgraph-mcp' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Promise((res, rej) => {
    const req = https.get(url, { headers }, r => {
      if (r.statusCode === 403 || r.statusCode === 429) return rej(new Error('Rate limited'));
      if (r.statusCode !== 200) { r.resume(); return rej(new Error(`HTTP ${r.statusCode}`)); }
      const chunks = []; r.setEncoding('utf8');
      r.on('data', c => chunks.push(c)); r.on('end', () => res(chunks.join('')));
    });
    req.on('error', rej);
  });
}

const reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
let updated = 0, skipped = 0, failed = 0;

for (const bundle of reg.bundles) {
  if (!bundle.repo_url) { skipped++; continue; }
  if (bundle.created_at) { skipped++; continue; }

  const ownerRepo = bundle.repo_url.replace(/^https?:\/\/github\.com\//, '');
  process.stdout.write(`  ${ownerRepo}... `);

  try {
    const json = await httpsGet(`https://api.github.com/repos/${ownerRepo}`);
    const data = JSON.parse(json);
    bundle.created_at = data.created_at.slice(0, 10); // YYYY-MM-DD
    console.log(bundle.created_at);
    updated++;
    await new Promise(r => setTimeout(r, process.env.GITHUB_TOKEN ? 100 : 1500));
  } catch (e) {
    console.log(`failed: ${e.message}`);
    failed++;
  }
}

reg.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(REGISTRY, JSON.stringify(reg, null, 2) + '\n');
console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${failed} failed`);
