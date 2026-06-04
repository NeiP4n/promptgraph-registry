// Registry validator — runs in CI on every PR.
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const DANGEROUS_PATTERNS = [
  { re: /curl\s+[^\n|]*\|\s*(ba)?sh/i, msg: 'pipes remote content to shell (curl | sh)' },
  { re: /wget\s+[^\n|]*\|\s*(ba)?sh/i, msg: 'pipes remote content to shell (wget | sh)' },
  { re: /rm\s+-rf\s+[~/]/i, msg: 'destructive rm -rf on home/root' },
  { re: /\b(eval|exec)\s*\(\s*(atob|base64|fromCharCode)/i, msg: 'obfuscated code execution' },
  { re: /(AWS|SECRET|PRIVATE|API)_?KEY\s*=\s*["'][A-Za-z0-9/+]{16,}/i, msg: 'hardcoded credential' },
  { re: /process\.env\.[A-Z_]+\s*[^\n]{0,40}(fetch|http|post|curl)/i, msg: 'reads env and exfiltrates' },
  { re: /\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts?|rules)/i, msg: 'prompt injection' },
  { re: /\b(reveal|print|output|show)\s+(your\s+)?(system\s+prompt|instructions|api\s*key)/i, msg: 'prompt extraction' },
  { re: /\.ssh\/id_rsa|\.aws\/credentials/i, msg: 'accesses credential files' },
];

const NAME_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;
const MIN_LEN = 200, MAX_LEN = 100000, MIN_DESC = 15;

function validate(filePath) {
  const errors = [];
  const raw = fs.readFileSync(filePath, 'utf8');
  if (raw.length < MIN_LEN) errors.push(`Too short (${raw.length} < ${MIN_LEN})`);
  if (raw.length > MAX_LEN) errors.push(`Too large (${raw.length} > ${MAX_LEN})`);

  let data;
  try { ({ data } = matter(raw)); }
  catch (e) { return [`Invalid frontmatter: ${e.message}`]; }

  if (!data.name) errors.push('Missing name');
  else if (!NAME_RE.test(String(data.name))) errors.push(`Invalid name "${data.name}"`);
  if (!data.description) errors.push('Missing description');
  else if (String(data.description).trim().length < MIN_DESC) errors.push('Description too short');

  for (const { re, msg } of DANGEROUS_PATTERNS) {
    if (re.test(raw)) errors.push(`SECURITY: ${msg}`);
  }
  return errors;
}

const skillsDir = path.join(process.cwd(), 'skills');
let failed = false;

if (fs.existsSync(skillsDir)) {
  const files = fs.readdirSync(skillsDir).filter(f => f.endsWith('.md'));
  const names = new Set();
  for (const f of files) {
    const fp = path.join(skillsDir, f);
    const errors = validate(fp);
    const { data } = matter(fs.readFileSync(fp, 'utf8'));
    if (data.name) {
      if (names.has(data.name)) errors.push(`Duplicate name "${data.name}"`);
      names.add(data.name);
    }
    if (errors.length) {
      failed = true;
      console.log(`FAIL ${f}`);
      errors.forEach(e => console.log(`    ${e}`));
    } else {
      console.log(`OK   ${f}`);
    }
  }
}

try {
  const reg = JSON.parse(fs.readFileSync('registry.json', 'utf8'));
  if (!Array.isArray(reg.skills)) { console.log('FAIL registry.json: skills must be array'); failed = true; }

  // bundles must reference existing skill ids
  const skillIds = new Set((reg.skills || []).map(s => s.id));
  for (const b of reg.bundles || []) {
    if (!b.id || !b.name) { console.log(`FAIL bundle missing id/name`); failed = true; continue; }
    if (!Array.isArray(b.skills) || b.skills.length === 0) {
      console.log(`FAIL bundle "${b.id}": must list at least one skill`); failed = true; continue;
    }
    for (const sid of b.skills) {
      if (!skillIds.has(sid)) { console.log(`FAIL bundle "${b.id}": references unknown skill "${sid}"`); failed = true; }
    }
    console.log(`OK   bundle: ${b.id} (${b.skills.length} skills)`);
  }
} catch (e) {
  console.log(`FAIL registry.json invalid: ${e.message}`);
  failed = true;
}

if (failed) { console.log('\nValidation failed.'); process.exit(1); }
console.log('\nAll skills valid.');
