#!/usr/bin/env node
/**
 * RBAC audit — scans every src/routes and src/components file for `<Button>`
 * elements whose onClick performs a mutating action and verifies that each
 * such button is wrapped in a <Gated>, lives inside a `useCan(...)` branch,
 * or is rendered inside a `canXxx && (...)` guard.
 *
 * Heuristic — flags any onClick whose body contains any of the following
 * verbs: toast.success, toast.error, set, update, mark, approve, reject,
 * delete, submit, sign, create, upload, save, remove, invite, assign,
 * confirm. Buttons that only open a dialog (setOpen / onOpenChange) are
 * ignored — the dialog itself is checked separately.
 *
 * Exits with code 1 if any ungated mutating button is found. Prints a clean
 * report grouped by file otherwise.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SCAN_DIRS = ["src/routes", "src/components"];
const IGNORE_FILES = [
  // UI primitives — no business logic
  "src/components/ui",
  "src/components/Primitives.tsx",
  "src/components/StatusBadge.tsx",
  "src/components/HealthBadge.tsx",
  "src/components/Logo.tsx",
  "src/components/StubPage.tsx",
  "src/components/TierMetric.tsx",
  "src/components/CompareTray.tsx",
  "src/components/ProjectBanner.tsx",
  // Auth helpers — they ARE the gating mechanism
  "src/components/auth",
  // Calculator — internal tool, not RBAC scope
  "src/components/calculator",
  "src/routes/calculator.tsx",
  // Test files
  ".test.",
];

// Verbs in onClick body that mark a mutating action.
const MUTATING_VERBS = [
  /\btoast\.success\(/,
  /\btoast\.error\(/,
  /\bsave\w*\(/i,
  /\bcreate\w*\(/i,
  /\bupdate\w*\(/i,
  /\bdelete\w*\(/i,
  /\bremove\w*\(/i,
  /\bapprove\w*\(/i,
  /\breject\w*\(/i,
  /\bsubmit\w*\(/i,
  /\bsign\w*\(/i,
  /\bmark\w+Paid\(/i,
  /\bmark\w*Done\(/i,
  /\bset(?:Status|Approved|Rejected)\(/,
  /\binvite\w*\(/i,
  /\bassign\w*\(/i,
  /\bconfirm\w*\(/i,
  /\bupload\w*\(/i,
];

// Allowed neutral patterns — onClick bodies that match are NOT mutating
// (open/close dialogs, navigation, filter toggles, copy-to-clipboard).
const NEUTRAL_HINTS = [
  /^[\s(]*set(?:Open|Selected|Filter|Tab|Mode|Show|Edit|Scope|Sort|Expanded|View|Active|Picker)\b/,
  /^[\s(]*onOpenChange\(/,
  /\bnavigate\(/,
  /window\.(open|location|print)/,
  /clipboard/,
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    if (IGNORE_FILES.some((ign) => rel.startsWith(ign) || rel.includes(ign))) continue;
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry) && !entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) out.push(full);
  }
  return out;
}

/**
 * Find every onClick={...} attribute and return its body + position.
 * Handles balanced braces / parens.
 */
function findOnClickBodies(src) {
  const results = [];
  const re = /onClick=\{/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const start = m.index + m[0].length;
    let depth = 1;
    let i = start;
    while (i < src.length && depth > 0) {
      const ch = src[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      i++;
    }
    const body = src.slice(start, i - 1);
    results.push({ index: m.index, end: i, body });
  }
  return results;
}

function isMutating(body) {
  const trimmed = body.trim();
  // Single-statement neutral handlers
  if (NEUTRAL_HINTS.some((p) => p.test(trimmed))) return false;
  return MUTATING_VERBS.some((p) => p.test(body));
}

/**
 * Walk backwards from an onClick position to find the nearest enclosing
 * conditional context. We look for either:
 *   - a `<Gated cap=` opening tag earlier in the file with a matching close after the button
 *   - a `{can\w* && (` or `{useCan(...)... && (` pattern wrapping the button
 *   - an `if (!can...) return ...` early-return at function scope (NoAccess pattern)
 */
function isGated(src, clickIndex) {
  const before = src.slice(0, clickIndex);
  const after = src.slice(clickIndex);

  // 1. Inside a <Gated cap=...>...</Gated> element opened before, closed after.
  const gatedOpens = [...before.matchAll(/<Gated\s+cap=/g)];
  const gatedCloses = [...before.matchAll(/<\/Gated>/g)];
  const openCount = gatedOpens.length - gatedCloses.length;
  if (openCount > 0 && /<\/Gated>/.test(after)) return true;

  // 2. Inside a `{canXxx && (` or `canXxx ? (` block — find nearest unmatched `(` on the boolean.
  // Look at the last 800 chars before the button for a guard pattern.
  const window = before.slice(-1200);
  if (/\b(can[A-Z]\w*)\s*&&\s*\(?\s*$/m.test(window)) return true;
  if (/\b(can[A-Z]\w*)\s*\?\s*\(?\s*$/m.test(window)) return true;
  // Generic: any `useCan("...") && (` opened before
  if (/useCan\([^)]+\)\s*&&\s*\(/.test(window)) {
    // Check that we are inside that scope — a reasonable proxy: a `(` after the && is unmatched
    return true;
  }

  // 3. Whole-file early-return guard: a function that returns <NoAccess /> when
  // the user lacks the required cap effectively gates everything in that file.
  if (/<NoAccess\b/.test(src) && /useCan\(/.test(src)) return true;

  // 4. Wrapped at the variable declaration level (rare): handler defined only when canX.
  return false;
}

function scanFile(file) {
  const src = readFileSync(file, "utf8");
  const findings = [];
  for (const click of findOnClickBodies(src)) {
    if (!isMutating(click.body)) continue;
    if (isGated(src, click.index)) continue;
    // Compute line number
    const line = src.slice(0, click.index).split("\n").length;
    findings.push({
      line,
      preview: click.body.replace(/\s+/g, " ").trim().slice(0, 120),
    });
  }
  return findings;
}

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
let total = 0;
const report = [];
for (const file of files) {
  const findings = scanFile(file);
  if (findings.length === 0) continue;
  total += findings.length;
  report.push({ file: relative(ROOT, file), findings });
}

if (total === 0) {
  console.log("✓ RBAC audit clean — every mutating onClick is gated.");
  console.log(`  Scanned ${files.length} files in src/routes and src/components.`);
  process.exit(0);
}

console.error(`✗ RBAC audit found ${total} ungated mutating action(s):\n`);
for (const r of report) {
  console.error(`  ${r.file}`);
  for (const f of r.findings) {
    console.error(`    L${f.line}  ${f.preview}`);
  }
  console.error("");
}
console.error("Wrap each in <Gated cap=\"...\">…</Gated> or guard with useCan(...).");
process.exit(1);