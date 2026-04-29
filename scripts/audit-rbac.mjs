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
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
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

// Explicit allowlist for benign mock-only actions that look mutating to the
// heuristic but only render a transient toast preview (no real state change).
// Each entry: { file, line, reason }. New mocks must be reviewed before being
// added — keep this list short and well-justified.
const ALLOWLIST = [
  // Onboarding / dashboard demo CTAs that just preview a toast.
  { file: "src/routes/index.tsx", reason: "Mock dashboard CTA — toast preview only" },
  // Catalog & price-intel browsing actions (search, alerts) without real persistence.
  { file: "src/routes/catalog.tsx", reason: "Mock search & compare-tray (read-only personal scratchpad)" },
  { file: "src/routes/price-intelligence.tsx", lineMatch: /Alerts? \(/, reason: "Read-only alert preview" },
  { file: "src/routes/price-intelligence.tsx", lineMatch: /toast\.success\(a\.action/, reason: "Mock alert one-click" },
  // Integrations connect/sync stubs (no real OAuth flow).
  { file: "src/routes/integrations.tsx", reason: "Mock connector stubs" },
  // Planner export PDF stub.
  { file: "src/routes/planner.tsx", lineMatch: /Planner exported/, reason: "PDF export stub" },
  // Readiness one-click resolver stubs (no persistent action yet).
  { file: "src/routes/readiness.tsx", reason: "Mock readiness one-click" },
  // Team audit log open stub.
  { file: "src/routes/team.tsx", lineMatch: /Audit log/, reason: "Audit log preview" },
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
  const gatedOpens = (before.match(/<Gated\s+cap=/g) || []).length;
  const gatedCloses = (before.match(/<\/Gated>/g) || []).length;
  if (gatedOpens > gatedCloses && /<\/Gated>/.test(after)) return true;

  // 2. Whole-file early-return guard: NoAccess fallback ⇒ entire route gated.
  if (/<NoAccess\b/.test(src) && /useCan\(/.test(src)) return true;

  // 3. Walk backwards from the click site looking at every enclosing scope
  //    (parenthesised group or JSX expression `{`). At each level, check
  //    whether what immediately precedes the opener is a `canXxx &&` /
  //    `canXxx ?` short-circuit (or `useCan("cap") &&`/`?`).
  //    This handles nested ternaries like
  //      `{a ? <X/> : b ? <Y/> : canX ? (<button .../>) : <Z/>}`.
  let depth = 0;
  for (let i = before.length - 1; i >= Math.max(0, before.length - 8000); i--) {
    const ch = before[i];
    if (ch === ")" || ch === "}") depth++;
    else if (ch === "(" || ch === "{") {
      if (depth === 0) {
        // Examine what precedes this opener, stripping insignificant whitespace.
        const tail = before.slice(Math.max(0, i - 200), i).replace(/\s+$/g, "");
        if (/(?:^|[^.\w])(?:can[A-Z]\w*|useCan\([^)]+\))\s*(?:&&|\?)\s*\(?\s*$/.test(tail)) {
          return true;
        }
        // Don't return false yet — keep walking outward; an outer scope might
        // still gate this one (e.g. `{canX && (<div>{handler}</div>)}`).
      } else {
        depth--;
      }
    }
  }

  return false;
}

function isAllowlisted(relFile, line, body) {
  return ALLOWLIST.some((entry) => {
    if (!relFile.endsWith(entry.file) && relFile !== entry.file) return false;
    if (entry.lineMatch && !entry.lineMatch.test(body)) return false;
    return true;
  });
}

function scanFile(file) {
  const src = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);
  const findings = [];
  for (const click of findOnClickBodies(src)) {
    if (!isMutating(click.body)) continue;
    if (isGated(src, click.index)) continue;
    const line = src.slice(0, click.index).split("\n").length;
    if (isAllowlisted(rel, line, click.body)) continue;
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