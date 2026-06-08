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

function httpFetch(url) {
  return new Promise((res, rej) => {
    const req = https.get(url, { headers: { 'User-Agent': 'promptgraph-registry-bot', Authorization: `token ${TOKEN}` } }, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return httpFetch(r.headers.location).then(res, rej);
      if (r.statusCode !== 200) { r.resume(); return rej(new Error(`HTTP ${r.statusCode} for ${url}`)); }
      let d = ''; r.setEncoding('utf8'); r.on('data', c => d += c); r.on('end', () => res(d));
    });
    req.on('error', rej);
  });
}

async function repoExists(ownerRepo) {
  return new Promise(resolve => {
    const req = https.request(
      { host: 'github.com', path: `/${ownerRepo}`, method: 'HEAD', headers: { 'User-Agent': 'promptgraph-registry-bot', Authorization: `token ${TOKEN}` } },
      res => resolve(res.statusCode < 400)
    );
    req.on('error', () => resolve(false));
    req.end();
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
  const re = new RegExp(`###\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n+([\\s\\S]*?)(?=\\n###|$)`, 'i');
  const m = body.match(re);
  return m ? m[1].trim() : '';
}

function gistToRaw(url) {
  const m = url.match(/gist\.github\.com\/([^/]+\/[a-f0-9]+)/i);
  if (m) return `https://gist.githubusercontent.com/${m[1]}/raw`;
  return url;
}

function codeFor(id) {
  const { createHash } = createRequire(import.meta.url)('crypto');
  return 'pg-' + createHash('md5').update(String(id)).digest('hex').slice(0, 6);
}

// Retry git push with pull --rebase to handle concurrent runs
function gitPushWithRetry(maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      execSync('git pull --rebase origin main', { stdio: 'pipe' });
      execSync('git push origin main', { stdio: 'pipe' });
      return;
    } catch (e) {
      if (i === maxRetries - 1) throw new Error(`git push failed after ${maxRetries} retries: ${e.message}`);
      const delay = (i + 1) * 2;
      console.log(`Push failed (attempt ${i + 1}/${maxRetries}), retrying in ${delay}s...`);
      execSync(`sleep ${delay}`);
    }
  }
}

// ── Anti-spam & Quality ───────────────────────────────────────────────────────

const DANGEROUS = [
  { re: /curl\s+[^\n|]*\|\s*(ba)?sh/i,        msg: 'pipes remote content to shell (curl | sh)' },
  { re: /wget\s+[^\n|]*\|\s*(ba)?sh/i,         msg: 'pipes remote content to shell (wget | sh)' },
  { re: /rm\s+-rf\s+[~/]/i,                    msg: 'destructive rm -rf' },
  { re: /\b(eval|exec)\s*\(\s*(atob|base64)/i, msg: 'obfuscated execution' },
  { re: /(AWS|SECRET|PRIVATE|API)_?KEY\s*=\s*["'][A-Za-z0-9/+]{16,}/i, msg: 'hardcoded credential' },
  { re: /\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts?|rules)/i, msg: 'prompt injection' },
  { re: /\b(reveal|print|output|show)\s+(your\s+)?(system\s+prompt|instructions|api\s*key)/i, msg: 'prompt extraction' },
  { re: /\bDAN\b.*jailbreak|jailbreak.*\bDAN\b/i, msg: 'jailbreak attempt' },
  { re: /act\s+as\s+(an?\s+)?unfiltered|without\s+(any\s+)?restrictions|no\s+content\s+policy/i, msg: 'policy bypass attempt' },
];

const SPAM_PATTERNS = [
  { re: /buy\s+now|click\s+here|free\s+trial|limited\s+offer|act\s+now/i, msg: 'advertising/spam content' },
  { re: /\b(viagra|casino|porn|xxx|adult\s+content)\b/i,                   msg: 'inappropriate content' },
  { re: /https?:\/\/bit\.ly|tinyurl\.com|t\.co\/[A-Za-z0-9]+/i,           msg: 'shortened/suspicious URLs' },
  { re: /(.)\1{15,}/,                                                       msg: 'excessive character repetition' },
];

const NAME_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;

// Rough text similarity — normalized word overlap (Jaccard-like)
function textSimilarity(a, b) {
  const words = s => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3));
  const wa = words(a), wb = words(b);
  if (!wa.size || !wb.size) return 0;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / Math.min(wa.size, wb.size);
}

// Check if this user submitted too many issues recently via git log
function userSubmissionsLast24h(user, log) {
  const since = Date.now() - 86400000;
  const re = new RegExp(`@${user}\\s+\\(#\\d+\\)`, 'g');
  const lines = log.split('\n').filter(l => re.test(l));
  return lines.length;
}

function validateSkillContent(raw) {
  const errors = [];

  if (raw.length < 200) errors.push(`Too short (${raw.length} chars, min 200)`);
  if (raw.length > 100_000) errors.push(`Too large (> 100 KB)`);

  let data;
  try { ({ data } = matter(raw)); } catch (e) { return { errors: [`Invalid frontmatter: ${e.message}`] }; }

  if (!data.name || !NAME_RE.test(String(data.name)))
    errors.push('Invalid or missing `name` — use lowercase-hyphens (e.g. `my-skill`)');
  if (!data.description || String(data.description).trim().length < 15)
    errors.push('Missing or too short `description` (min 15 chars)');

  // Content quality: must have at least 2 headers and some structure
  const lines = raw.split('\n');
  const headers = lines.filter(l => /^#{1,3}\s/.test(l));
  const hasBullets = lines.some(l => /^[-*]\s/.test(l));
  const hasCode = raw.includes('```');
  const hasNumbered = lines.some(l => /^\d+\.\s/.test(l));

  if (headers.length < 2)
    errors.push('Content must have at least 2 headings (##)');
  if (!hasBullets && !hasCode && !hasNumbered)
    errors.push('Content must have bullet points, numbered steps, or code blocks — plain prose is not a skill');

  // Check for copy-paste filler
  const wordCount = raw.split(/\s+/).length;
  const uniqueWords = new Set(raw.toLowerCase().split(/\s+/));
  const diversity = uniqueWords.size / wordCount;
  if (wordCount > 100 && diversity < 0.25)
    errors.push('Content appears to be low-quality (too many repeated words)');

  for (const { re, msg } of DANGEROUS)  if (re.test(raw)) errors.push(`Security: ${msg}`);
  for (const { re, msg } of SPAM_PATTERNS) if (re.test(raw)) errors.push(`Spam: ${msg}`);

  return { errors, name: String(data.name || ''), description: String(data.description || '') };
}

function validateBundleDef(def) {
  const errors = [];
  if (!def.id || !NAME_RE.test(def.id))
    errors.push('Invalid or missing `id` — use lowercase-hyphens');
  if (!def.name || def.name.trim().length < 3)
    errors.push('Missing or too short name (min 3 chars)');
  if (!def.description || def.description.trim().length < 15)
    errors.push('Missing or too short description (min 15 chars)');
  if (!def.repo_url) {
    if (!Array.isArray(def.skills) || def.skills.length < 2)
      errors.push('Need at least 2 skill IDs (or provide `repo_url`)');
  }
  for (const { re, msg } of SPAM_PATTERNS)
    if (re.test(def.description || '') || re.test(def.name || '')) errors.push(`Spam: ${msg}`);
  return errors;
}

// ── Duplicate & spam guards ───────────────────────────────────────────────────

function checkSkillDuplicates(registry, name, description, rawUrl) {
  const errors = [];

  // Exact ID match
  if (registry.skills.some(s => s.id === name))
    errors.push(`Skill \`${name}\` already exists in the registry`);

  // Same source URL
  if (registry.skills.some(s => s.raw_url === rawUrl))
    errors.push(`This URL is already registered under a different skill`);

  // Near-duplicate description (> 80% overlap)
  for (const s of registry.skills) {
    const sim = textSimilarity(description, s.description || '');
    if (sim > 0.8)
      errors.push(`Description is ${Math.round(sim * 100)}% similar to existing skill \`${s.id}\` — too close to be a new entry`);
  }

  return errors;
}

function checkBundleDuplicates(registry, def) {
  const errors = [];

  if ((registry.bundles || []).some(b => b.id === def.id))
    errors.push(`Bundle \`${def.id}\` already exists`);

  if (def.repo_url && (registry.bundles || []).some(b => b.repo_url === def.repo_url))
    errors.push(`This GitHub repo is already registered as a bundle`);

  // Near-duplicate description
  for (const b of (registry.bundles || [])) {
    const sim = textSimilarity(def.description || '', b.description || '');
    if (sim > 0.85)
      errors.push(`Description is ${Math.round(sim * 100)}% similar to existing bundle \`${b.id}\``);
  }

  return errors;
}

// ── Rate limiting: max 3 submissions per user per 24h ─────────────────────────

function checkRateLimit(user) {
  try {
    const log = execSync('git log --oneline --since="24 hours ago"', { encoding: 'utf8' });
    const count = (log.match(new RegExp(`@${user}\\s`, 'g')) || []).length;
    if (count >= 3)
      return `User @${user} has already submitted ${count} entries in the last 24 hours (max 3)`;
  } catch {}
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  if (!isSkill && !isBundle) {
    console.log('Not a skill/bundle submission issue — skipping');
    return;
  }

  const registry = JSON.parse(fs.readFileSync('registry.json', 'utf8'));

  // Global rate limit check
  const rateLimitError = checkRateLimit(ISSUE_USER);
  if (rateLimitError) {
    await postComment(`⏳ **Rate limit reached.**\n\n${rateLimitError}\n\nPlease wait 24 hours before submitting more.`);
    return;
  }

  if (isSkill) await processSkill(registry);
  else await processBundle(registry);
}

async function processSkill(registry) {
  const rawUrl = gistToRaw(parseField('Gist URL (or raw GitHub URL)', ISSUE_BODY));
  const tags = parseField('Tags (comma-separated)', ISSUE_BODY)
    .split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

  if (!rawUrl) {
    await postComment('❌ **No URL found.**\n\nPlease include a Gist URL or raw GitHub URL in the "Gist URL" field.');
    return;
  }

  let raw;
  try { raw = await httpFetch(rawUrl); }
  catch (e) {
    await postComment(`❌ **Could not fetch skill file.**\n\nURL: \`${rawUrl}\`\nError: ${e.message}\n\nMake sure the Gist is **public**.`);
    return;
  }

  const result = validateSkillContent(raw);
  const dupErrors = checkSkillDuplicates(registry, result.name || '', result.description || '', rawUrl);
  const allErrors = [...(result.errors || []), ...dupErrors];

  if (allErrors.length) {
    await postComment(`❌ **Submission rejected:**\n\n${allErrors.map(e => `- ${e}`).join('\n')}\n\nFix these issues and reopen the issue.`);
    return;
  }

  const { name, description } = result;

  const finalRawUrl = rawUrl.includes('github.com') && rawUrl.includes('/blob/')
    ? rawUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
    : rawUrl;

  fs.mkdirSync('skills', { recursive: true });
  fs.writeFileSync(`skills/${name}.md`, raw);

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

  execSync('git config user.name "promptgraph-bot"');
  execSync('git config user.email "bot@promptgraph.dev"');
  execSync(`git add skills/${name}.md registry.json`);
  execSync(`git commit -m "feat(registry): add skill '${name}' from @${ISSUE_USER} (#${ISSUE_NUMBER})"`);
  gitPushWithRetry();

  await postComment(`✅ **Skill \`${name}\` has been added to the marketplace!**\n\nInstall it:\n\`\`\`\ninstall ${codeFor(name)}\n\`\`\`\n\nThanks @${ISSUE_USER}! 🎉`);
  await closeIssue();
}

async function processBundle(registry) {
  let def;

  const gistMatch = ISSUE_BODY.match(/Gist:\s*(https?:\/\/\S+)/i);
  const jsonBlockMatch = ISSUE_BODY.match(/```(?:json)?\s*\n(\{[\s\S]*?\})\s*\n```/);
  if (gistMatch) {
    const rawUrl = gistToRaw(gistMatch[1].trim());
    let content;
    try { content = await httpFetch(rawUrl); }
    catch (e) {
      await postComment(`❌ **Could not fetch Gist.**\n\nURL: \`${rawUrl}\`\nError: ${e.message}\n\nMake sure the Gist is **public**.`);
      return;
    }
    try { def = JSON.parse(content); }
    catch (e) {
      await postComment(`❌ **Gist does not contain valid JSON.**\n\nError: ${e.message}`);
      return;
    }
  } else if (jsonBlockMatch) {
    try { def = JSON.parse(jsonBlockMatch[1]); }
    catch (e) {
      await postComment(`❌ **JSON block is invalid.**\n\nError: ${e.message}`);
      return;
    }
  } else {
    const bundleIdField = parseField('Bundle ID', ISSUE_BODY);
    const bundleName    = parseField('Display name', ISSUE_BODY);
    const description   = parseField('Description', ISSUE_BODY);
    const repoUrl       = parseField('GitHub repo URL (owner/repo)', ISSUE_BODY) || parseField('GitHub Repo', ISSUE_BODY);
    const skillsRaw     = parseField('Skill IDs (one per line)', ISSUE_BODY);
    const tags          = parseField('Tags (comma-separated)', ISSUE_BODY)
      .split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const skills        = skillsRaw.split('\n').map(s => s.trim()).filter(Boolean);
    def = { id: bundleIdField, name: bundleName, description, skills, tags };
    if (repoUrl) def.repo_url = repoUrl.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
  }

  if (!def.tags) def.tags = [];
  const validErrors = validateBundleDef(def);
  const dupErrors = checkBundleDuplicates(registry, def);

  // For skill-list bundles, verify all skill IDs exist
  const registrySkillIds = new Set(registry.skills.map(s => s.id));
  const bundleSkills = def.skills || [];
  const missing = bundleSkills.filter(s => !registrySkillIds.has(s));
  if (missing.length) validErrors.push(`These skill IDs don't exist: ${missing.join(', ')}`);

  // For repo_url bundles, verify the repo actually exists
  if (def.repo_url) {
    const exists = await repoExists(def.repo_url);
    if (!exists) validErrors.push(`GitHub repo \`${def.repo_url}\` returned 404 — make sure it's public and the path is correct`);
  }

  const allErrors = [...validErrors, ...dupErrors];
  if (allErrors.length) {
    await postComment(`❌ **Bundle rejected:**\n\n${allErrors.map(e => `- ${e}`).join('\n')}\n\nFix these issues and reopen the issue.`);
    return;
  }

  registry.bundles = registry.bundles || [];
  const entry = { id: def.id, name: def.name, description: def.description, author: ISSUE_USER, tags: def.tags, stars: 0 };

  if (def.repo_url) {
    entry.repo_url = def.repo_url;
    // Count .md skill files via GitHub API, mirroring detectSkillsDir logic:
    // prefer known skills subdirs, fall back to root with quality filter.
    try {
      const SKILL_DIRS = ['skills', 'commands', 'prompts', 'agents', 'skills-store', 'slash-commands', 'custom-commands', 'templates'];
      const SKIP_NAMES = /^(readme|changelog|license|contributing|code.of.conduct|security|authors|credits|install|installation|usage|faq|glossary|index|overview|summary|roadmap|todo|notes|template|example|sample|demo|getting.started|quickstart|guide|tutorial|walkthrough|architecture|design|spec|specification|requirements|privacy|terms|disclaimer|notice|copying|warranty|funding)/i;
      const SKIP_DIRS = /^\.(github)|^(docs?|documentation|examples?|tests?|__tests__|spec|fixtures|assets|images|img|screenshots|media|static|public|dist|build|node_modules|vendor)/i;

      const apiUrl = `https://api.github.com/repos/${def.repo_url}/git/trees/HEAD?recursive=1`;
      const treeJson = await httpFetch(apiUrl);
      const tree = JSON.parse(treeJson);
      const allFiles = (tree.tree || []).filter(f => f.type === 'blob' && f.path.endsWith('.md'));

      // Try to find a dedicated skills subdir (same priority order as detectSkillsDir)
      let skillCount = 0;
      let detected = null;
      for (const dir of SKILL_DIRS) {
        const inDir = allFiles.filter(f => f.path.startsWith(dir + '/'));
        if (inDir.length >= 2) {
          // Count only non-meta files within that subdir
          skillCount = inDir.filter(f => {
            const base = f.path.split('/').pop().replace(/\.md$/i, '').toLowerCase();
            return !SKIP_NAMES.test(base);
          }).length;
          detected = dir;
          break;
        }
      }

      // No subdir found — count from root, skip meta files and files in skip dirs
      if (!detected) {
        skillCount = allFiles.filter(f => {
          const parts = f.path.split('/');
          const base = parts[parts.length - 1].replace(/\.md$/i, '').toLowerCase();
          if (SKIP_NAMES.test(base)) return false;
          if (parts.slice(0, -1).some(p => SKIP_DIRS.test(p))) return false;
          return true;
        }).length;
      }

      console.log(`skillCount=${skillCount} (detected dir: ${detected || 'root'})`);
      if (skillCount > 0) entry.skillCount = skillCount;
    } catch (e) {
      console.log('Could not count .md files:', e.message);
    }
  } else {
    entry.skills = def.skills;
  }

  registry.bundles.push(entry);
  registry.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync('registry.json', JSON.stringify(registry, null, 2));

  execSync('git config user.name "promptgraph-bot"');
  execSync('git config user.email "bot@promptgraph.dev"');
  execSync('git add registry.json');
  execSync(`git commit -m "feat(registry): add bundle '${def.id}' from @${ISSUE_USER} (#${ISSUE_NUMBER})"`);
  gitPushWithRetry();

  const skillList = bundleSkills.length ? bundleSkills.map(s => `\`${s}\``).join(', ') : (def.repo_url ? `GitHub: ${def.repo_url}` : '');
  await postComment(`✅ **Bundle \`${def.id}\` has been added to the marketplace!**\n\n${skillList ? `Includes: ${skillList}\n\n` : ''}Install it:\n\`\`\`\npg bundle install ${def.id}\n\`\`\`\n\nThanks @${ISSUE_USER}! 🎉`);
  await closeIssue();
}

run().catch(async e => {
  console.error(e);
  await postComment(`❌ **Internal bot error:** ${e.message}\n\nPlease try again or open a PR manually.`).catch(() => {});
  process.exit(1);
});
