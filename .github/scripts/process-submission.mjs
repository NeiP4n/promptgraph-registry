#!/usr/bin/env node
/**
 * Auto-processes skill and bundle submission issues.
 * On success: commits to main, closes issue with ✅ comment.
 * On failure: posts ❌ comment with reasons, leaves issue open.
 */
import fs from 'fs';
import https from 'https';
import { execSync } from 'child_process';
import matter from 'gray-matter';
import { createRequire } from 'module';

const TOKEN = process.env.GITHUB_TOKEN;
const ISSUE_NUMBER = process.env.ISSUE_NUMBER;
const ISSUE_BODY = process.env.ISSUE_BODY || '';
const ISSUE_LABELS = (process.env.ISSUE_LABELS || '').split(',');
const ISSUE_USER = process.env.ISSUE_USER || 'unknown';
const REPO = process.env.GITHUB_REPOSITORY || 'NeiP4n/promptgraph-registry';

const isBundle = ISSUE_LABELS.some(l => l.includes('bundle'));
const isSkill  = ISSUE_LABELS.some(l => l.includes('skill'));

// ── Helpers ──────────────────────────────────────────────────────────────────

function fetch(url) {
  return new Promise((res, rej) => {
    const req = https.get(url, { headers: { 'User-Agent': 'promptgraph-registry-bot', Authorization: `token ${TOKEN}` } }, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return fetch(r.headers.location).then(res, rej);
      if (r.statusCode !== 200) { r.resume(); return rej(new Error(`HTTP ${r.statusCode} for ${url}`)); }
      let d = ''; r.setEncoding('utf8'); r.on('data', c => d += c); r.on('end', () => res(d));
    });
    req.on('error', rej);
  });
}

async function postComment(body) {
  const data = JSON.stringify({ body });
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${REPO}/issues/${ISSUE_NUMBER}/comments`,
      method: 'POST',
      headers: { 'User-Agent': 'promptgraph-registry-bot', Authorization: `token ${TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res()); });
    req.on('error', rej);
    req.write(data); req.end();
  });
}

async function closeIssue() {
  const data = JSON.stringify({ state: 'closed' });
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${REPO}/issues/${ISSUE_NUMBER}`,
      method: 'PATCH',
      headers: { 'User-Agent': 'promptgraph-registry-bot', Authorization: `token ${TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res()); });
    req.on('error', rej);
    req.write(data); req.end();
  });
}

function parseField(label, body) {
  // GitHub forms output: "### Field Label\n\nvalue\n"
  const re = new RegExp(`###\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n+([\\s\\S]*?)(?=\\n###|$)`, 'i');
  const m = body.match(re);
  return m ? m[1].trim() : '';
}

function gistToRaw(url) {
  // https://gist.github.com/user/abc123  → https://gist.githubusercontent.com/user/abc123/raw
  const m = url.match(/gist\.github\.com\/([^/]+\/[a-f0-9]+)/i);
  if (m) return `https://gist.githubusercontent.com/${m[1]}/raw`;
  // Already raw or raw.githubusercontent
  return url;
}

function codeFor(id) {
  const { createHash } = createRequire(import.meta.url)('crypto');
  return 'pg-' + createHash('md5').update(String(id)).digest('hex').slice(0, 6);
}

// ── Validators ────────────────────────────────────────────────────────────────

const DANGEROUS = [
  { re: /curl\s+[^\n|]*\|\s*(ba)?sh/i,       msg: 'pipes remote content to shell (curl | sh)' },
  { re: /wget\s+[^\n|]*\|\s*(ba)?sh/i,        msg: 'pipes remote content to shell (wget | sh)' },
  { re: /rm\s+-rf\s+[~/]/i,                   msg: 'destructive rm -rf' },
  { re: /\b(eval|exec)\s*\(\s*(atob|base64)/i, msg: 'obfuscated execution' },
  { re: /(AWS|SECRET|PRIVATE|API)_?KEY\s*=\s*["'][A-Za-z0-9/+]{16,}/i, msg: 'hardcoded credential' },
  { re: /\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts?|rules)/i, msg: 'prompt injection' },
  { re: /\b(reveal|print|output|show)\s+(your\s+)?(system\s+prompt|instructions|api\s*key)/i, msg: 'prompt extraction' },
];
const NAME_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;

function validateSkillContent(raw) {
  const errors = [];
  if (raw.length < 200) errors.push(`Too short (${raw.length} chars, min 200)`);
  if (raw.length > 100000) errors.push(`Too large (> 100 KB)`);
  let data;
  try { ({ data } = matter(raw)); } catch (e) { return [`Invalid frontmatter: ${e.message}`]; }
  if (!data.name || !NAME_RE.test(String(data.name))) errors.push(`Invalid or missing name — use lowercase-hyphens`);
  if (!data.description || String(data.description).trim().length < 15) errors.push(`Missing or too short description (min 15 chars)`);
  for (const { re, msg } of DANGEROUS) if (re.test(raw)) errors.push(`Security: ${msg}`);
  return { errors, name: String(data.name || ''), description: String(data.description || '') };
}

function validateBundleDef(def) {
  const errors = [];
  if (!def.id || !NAME_RE.test(def.id)) errors.push(`Invalid or missing id — use lowercase-hyphens`);
  if (!def.name || def.name.trim().length < 3) errors.push(`Missing or too short name`);
  if (!def.description || def.description.trim().length < 15) errors.push(`Missing or too short description`);
  if (!Array.isArray(def.skills) || def.skills.length < 2) errors.push(`Need at least 2 skill IDs`);
  return errors;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  if (!isSkill && !isBundle) {
    console.log('Not a skill/bundle submission issue — skipping');
    return;
  }

  const registry = JSON.parse(fs.readFileSync('registry.json', 'utf8'));

  if (isSkill) await processSkill(registry);
  else await processBundle(registry);
}

async function processSkill(registry) {
  const rawUrl = gistToRaw(parseField('Gist URL (or raw GitHub URL)', ISSUE_BODY));
  const skillName = parseField('Skill name', ISSUE_BODY);
  const tags = parseField('Tags (comma-separated)', ISSUE_BODY)
    .split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

  if (!rawUrl) {
    await postComment('❌ **No URL found.**\n\nPlease include a Gist URL or raw GitHub URL in the "Gist URL" field.');
    return;
  }

  let raw;
  try { raw = await fetch(rawUrl); }
  catch (e) {
    await postComment(`❌ **Could not fetch skill file.**\n\nURL: \`${rawUrl}\`\nError: ${e.message}\n\nMake sure the Gist is **public**.`);
    return;
  }

  const result = validateSkillContent(raw);
  if (result.errors && result.errors.length) {
    await postComment(`❌ **Skill validation failed:**\n\n${result.errors.map(e => `- ${e}`).join('\n')}\n\nFix these issues and reopen the issue.`);
    return;
  }

  const { name, description } = result;

  // Check for duplicate
  if (registry.skills.some(s => s.id === name)) {
    await postComment(`❌ **Skill \`${name}\` already exists** in the registry.\n\nIf this is an update, please open a separate PR.`);
    return;
  }

  // Derive raw_url: for Gist keep as-is; for github.com/blob → raw
  const finalRawUrl = rawUrl.includes('github.com') && rawUrl.includes('/blob/')
    ? rawUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
    : rawUrl;

  // Write skill file
  fs.writeFileSync(`skills/${name}.md`, raw);

  // Update registry.json
  registry.skills.push({
    id: name,
    name: name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
    description,
    raw_url: finalRawUrl,
    author: ISSUE_USER,
    tags,
    stars: 0,
  });
  registry.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync('registry.json', JSON.stringify(registry, null, 2));

  // Git commit
  execSync('git config user.name "promptgraph-bot"');
  execSync('git config user.email "bot@promptgraph.dev"');
  execSync(`git add skills/${name}.md registry.json`);
  execSync(`git commit -m "feat(registry): add skill '${name}' from @${ISSUE_USER} (#${ISSUE_NUMBER})"`);
  execSync('git push');

  await postComment(`✅ **Skill \`${name}\` has been added to the marketplace!**\n\nUsers can now install it:\n\`\`\`\ninstall ${name}\n\`\`\`\n\nOr by code after next indexing. Thanks @${ISSUE_USER}! 🎉`);
  await closeIssue();
}

async function processBundle(registry) {
  let def;

  // Format A: simple "Gist: <url>" body (from `pg bundle add-repo`)
  const gistMatch = ISSUE_BODY.match(/Gist:\s*(https?:\/\/\S+)/i);
  if (gistMatch) {
    const rawUrl = gistToRaw(gistMatch[1].trim());
    let content;
    try { content = await fetch(rawUrl); }
    catch (e) {
      await postComment(`❌ **Could not fetch Gist.**\n\nURL: \`${rawUrl}\`\nError: ${e.message}\n\nMake sure the Gist is **public**.`);
      return;
    }
    try { def = JSON.parse(content); }
    catch (e) {
      await postComment(`❌ **Gist does not contain valid JSON.**\n\nError: ${e.message}\n\nThe Gist should be a bundle definition JSON file.`);
      return;
    }
  } else {
    // Format B: GitHub issue form with ### fields
    const bundleIdField = parseField('Bundle ID', ISSUE_BODY);
    const bundleName    = parseField('Display name', ISSUE_BODY);
    const description   = parseField('Description', ISSUE_BODY);
    const skillsRaw     = parseField('Skill IDs (one per line)', ISSUE_BODY);
    const tags          = parseField('Tags (comma-separated)', ISSUE_BODY)
      .split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const skills        = skillsRaw.split('\n').map(s => s.trim()).filter(Boolean);
    def = { id: bundleIdField, name: bundleName, description, skills, tags };
  }

  if (!def.tags) def.tags = [];
  const errors = validateBundleDef(def);

  // Check all skills exist
  const registrySkillIds = new Set(registry.skills.map(s => s.id));
  const missing = skills.filter(s => !registrySkillIds.has(s));
  if (missing.length) errors.push(`These skill IDs don't exist in the registry: ${missing.join(', ')}`);

  if (errors.length) {
    await postComment(`❌ **Bundle validation failed:**\n\n${errors.map(e => `- ${e}`).join('\n')}\n\nFix these issues and reopen the issue.`);
    return;
  }

  // Duplicate check
  if ((registry.bundles || []).some(b => b.id === def.id)) {
    await postComment(`❌ **Bundle \`${def.id}\` already exists.** Open a PR to update it.`);
    return;
  }

  registry.bundles = registry.bundles || [];
  registry.bundles.push({ id: def.id, name: def.name, description: def.description, skills: def.skills, author: ISSUE_USER, tags: def.tags, stars: 0 });
  registry.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync('registry.json', JSON.stringify(registry, null, 2));

  execSync('git config user.name "promptgraph-bot"');
  execSync('git config user.email "bot@promptgraph.dev"');
  execSync('git add registry.json');
  execSync(`git commit -m "feat(registry): add bundle '${def.id}' from @${ISSUE_USER} (#${ISSUE_NUMBER})"`);
  execSync('git push');

  const skillList = skills.map(s => `\`${s}\``).join(', ');
  await postComment(`✅ **Bundle \`${def.id}\` has been added to the marketplace!**\n\nIncludes: ${skillList}\n\nUsers can install it:\n\`\`\`\ninstall bundle ${def.id}\n\`\`\`\n\nThanks @${ISSUE_USER}! 🎉`);
  await closeIssue();
}

run().catch(async e => {
  console.error(e);
  await postComment(`❌ **Internal bot error:** ${e.message}\n\nPlease try again or open a PR manually.`).catch(() => {});
  process.exit(1);
});
