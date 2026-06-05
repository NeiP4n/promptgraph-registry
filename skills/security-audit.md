---
name: security-audit
description: Security-focused code audit covering OWASP Top 10, injection, auth flaws, secrets, and dependency vulnerabilities. Returns findings with CVSS-style severity.
---

# Security Audit

## Scope
Run on: specific file, PR diff, or full module (specify in request)

## Threat model first
Before scanning, answer:
- What data does this code handle? (PII / financial / auth tokens)
- Who are the callers? (internal service / public API / admin only)
- What's the worst-case exploit? (data breach / RCE / auth bypass)

## Checklist

### Injection (Critical)
- SQL: parameterized queries? no string concatenation in queries?
- Command: `exec`/`spawn` with user input? shell=True anywhere?
- SSTI: template engines with user-controlled templates?
- Path traversal: `../` in file paths from user input?

### Authentication & Authorization
- JWT: signature verified? alg=none accepted?
- Session: tokens rotated after login? fixed expiry?
- IDOR: resource IDs validated against current user?
- Privilege escalation paths?

### Secrets & Sensitive Data
- Hardcoded API keys, passwords, tokens?
- Secrets in logs, error messages, URLs?
- Sensitive data in git history?
- `.env` files committed?

### Cryptography
- MD5/SHA1 for passwords? (use bcrypt/argon2)
- Weak random (Math.random for tokens)?
- HTTP instead of HTTPS for sensitive endpoints?

### Dependencies
- Run `npm audit` / `pip audit` / `cargo audit`
- Flag packages with known CVEs in use

## Output format
```
## Risk Summary
Critical: N | High: N | Medium: N | Low: N

## Findings

### [CRITICAL] SQL Injection in search endpoint
**Location:** src/api/search.js:34
**CWE:** CWE-89
**Attack:** Attacker sends `' OR 1=1--` to extract all records
**Fix:** Use parameterized query: `db.query('SELECT * FROM users WHERE id = ?', [id])`
**Proof of concept:** `curl ... -d "q=' OR 1=1--"`
```

## False positive note
Always verify in context — flag if uncertain rather than omit.
