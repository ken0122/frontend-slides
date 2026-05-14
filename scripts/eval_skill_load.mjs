#!/usr/bin/env node
import { stat, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const DEFAULT_BUDGET = 12000;
const USAGE = `
Usage:
  node scripts/eval_skill_load.mjs [options]

Options:
  --budget <bytes>     Initial SKILL.md byte budget. Default: ${DEFAULT_BUDGET}
  --report-out <path>  Write Markdown report.
  --json               Print JSON only.
  --help               Show this help.
`;

function parseArgs(argv) {
  const args = { budget: DEFAULT_BUDGET, reportOut: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      console.log(USAGE.trim());
      process.exit(0);
    }
    if (arg === "--budget") {
      args.budget = Number(requireValue(argv, ++i, "--budget"));
      if (!Number.isInteger(args.budget) || args.budget < 1) {
        throw new Error("--budget must be a positive integer.");
      }
      continue;
    }
    if (arg === "--report-out") {
      args.reportOut = requireValue(argv, ++i, "--report-out");
      continue;
    }
    if (arg === "--json") {
      args.json = true;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return args;
}

function requireValue(argv, index, option) {
  const value = argv[index];
  if (!value || value.startsWith("-")) {
    throw new Error(`${option} requires a value.`);
  }
  return value;
}

async function fileSize(filePath) {
  return (await stat(filePath)).size;
}

function referencedPaths(text) {
  const matches = [...text.matchAll(/`([^`]+\.(?:md|css|mjs|py|yaml))`|\(([^)]+\.(?:md|css|mjs|py|yaml))\)/g)];
  return [...new Set(matches.map((match) => match[1] || match[2]).filter(Boolean))]
    .filter((ref) => !/^https?:\/\//.test(ref))
    .filter((ref) => path.normalize(ref) !== "SKILL.md");
}

function pct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function markdownReport(report) {
  const lines = [];
  lines.push("# Frontend Slides Load Eval");
  lines.push("");
  lines.push(`- Initial SKILL.md bytes: ${report.skillBytes}`);
  lines.push(`- Budget: ${report.budgetBytes}`);
  lines.push(`- Budget usage: ${pct(report.budgetUsage)}`);
  lines.push(`- Lazy-loadable referenced bytes: ${report.lazyReferencedBytes}`);
  lines.push(`- Referenced files checked: ${report.references.length}`);
  lines.push(`- Missing references: ${report.missingReferences.length}`);
  lines.push(`- Status: ${report.ok ? "PASS" : "FAIL"}`);
  lines.push("");
  lines.push("## References");
  lines.push("");
  for (const ref of report.references) {
    lines.push(`- ${ref.path}: ${ref.exists ? `${ref.bytes} bytes` : "missing"}`);
  }
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const skillText = await readFile("SKILL.md", "utf8");
  const refs = referencedPaths(skillText);
  const references = [];
  for (const ref of refs) {
    try {
      references.push({ path: ref, exists: true, bytes: await fileSize(ref) });
    } catch {
      references.push({ path: ref, exists: false, bytes: 0 });
    }
  }
  const skillBytes = Buffer.byteLength(skillText, "utf8");
  const report = {
    generatedAt: new Date().toISOString(),
    skillBytes,
    budgetBytes: args.budget,
    budgetUsage: skillBytes / args.budget,
    lazyReferencedBytes: references.reduce((sum, ref) => sum + ref.bytes, 0),
    references,
    missingReferences: references.filter((ref) => !ref.exists).map((ref) => ref.path),
  };
  report.ok = report.skillBytes <= report.budgetBytes && report.missingReferences.length === 0;
  if (args.reportOut) {
    const reportPath = path.resolve(args.reportOut);
    await mkdir(path.dirname(reportPath), { recursive: true });
    await writeFile(reportPath, markdownReport(report), "utf8");
  }
  console.log(args.json ? JSON.stringify(report, null, 2) : markdownReport(report));
  process.exit(report.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(2);
});
