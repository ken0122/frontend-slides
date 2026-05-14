#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_CASES = "eval/e2e-cases.json";

const USAGE = `
Usage:
  node scripts/eval_e2e.mjs [options]

Options:
  --cases <path>       E2E cases JSON. Default: ${DEFAULT_CASES}
  --report-out <path>  Write Markdown report.
  --json-out <path>    Write JSON report.
  --json               Print JSON only.
  --help               Show this help.
`;

function parseArgs(argv) {
  const args = { cases: DEFAULT_CASES, reportOut: null, jsonOut: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      console.log(USAGE.trim());
      process.exit(0);
    }
    if (arg === "--cases") {
      args.cases = requireValue(argv, ++i, "--cases");
      continue;
    }
    if (arg === "--report-out") {
      args.reportOut = requireValue(argv, ++i, "--report-out");
      continue;
    }
    if (arg === "--json-out") {
      args.jsonOut = requireValue(argv, ++i, "--json-out");
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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function runVerify(artifactPath) {
  const result = spawnSync(process.execPath, ["scripts/verify_presentation.mjs", artifactPath, "--json"], {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
  });
  let report = null;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    report = null;
  }
  return {
    artifact: artifactPath,
    exitCode: result.status,
    ok: result.status === 0 && report?.ok === true,
    report,
    stderr: result.stderr.trim(),
    stdout: report ? "" : result.stdout.trim(),
  };
}

function summarizeVerification(verification) {
  const report = verification.report;
  if (!report) {
    return {
      ok: false,
      viewportPassRate: 0,
      failureCount: 1,
      fullSpecIssueCount: 1,
      qualityScore: 0,
    };
  }
  const viewportCount = report.results.length;
  const viewportPasses = report.results.filter((result) => result.ok).length;
  const failures = report.results.flatMap((result) => result.failures);
  const fullSpecIssues = report.results.flatMap((result) => result.fullSpec?.issues || []);
  const firstScreenPasses = report.results.filter((result) => result.firstScreen?.ok).length;
  const navPasses = report.results.filter((result) => (result.navigation?.issues || []).length === 0 && !result.navigation?.skipped).length;
  const fullSpecPasses = report.results.filter((result) => result.fullSpec?.ok).length;
  const viewportPoints = viewportCount ? (viewportPasses / viewportCount) * 4 : 0;
  const firstScreenPoints = viewportCount ? (firstScreenPasses / viewportCount) * 1 : 0;
  const navPoints = viewportCount ? (navPasses / viewportCount) * 2 : 0;
  const specPoints = viewportCount ? (fullSpecPasses / viewportCount) * 3 : 0;
  return {
    ok: report.ok,
    viewportPassRate: viewportCount ? viewportPasses / viewportCount : 0,
    failureCount: failures.length,
    fullSpecIssueCount: fullSpecIssues.length,
    qualityScore: Number((viewportPoints + firstScreenPoints + navPoints + specPoints).toFixed(2)),
  };
}

function failureDetails(verification) {
  if (!verification.report) {
    return [
      {
        viewport: "runner",
        failures: [
          {
            check: "runner",
            message: verification.stderr || verification.stdout || "No JSON verification report.",
          },
        ],
      },
    ];
  }
  return verification.report.results
    .map((viewport) => ({
      viewport: viewport.viewport.name,
      failures: viewport.failures.map((failure) => ({
        check: failure.check,
        slide: failure.slide || null,
        message: failure.message,
      })),
    }))
    .filter((viewport) => viewport.failures.length > 0);
}

function pct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function markdownReport(report) {
  const lines = [];
  lines.push("# Frontend Slides E2E A/B Eval");
  lines.push("");
  lines.push(`- Cases: ${report.totals.cases}`);
  lines.push(`- With-skill pass rate: ${pct(report.metrics.withSkillPassRate)}`);
  lines.push(`- Without-skill pass rate: ${pct(report.metrics.withoutSkillPassRate)}`);
  lines.push(`- With-skill average quality score: ${report.metrics.withSkillAverageQualityScore}/10`);
  lines.push(`- Without-skill average quality score: ${report.metrics.withoutSkillAverageQualityScore}/10`);
  lines.push("");
  lines.push("> Without-skill artifacts are synthetic controls until real no-skill generations are collected. Replace the paths in eval/e2e-cases.json when real controls exist.");
  lines.push("");
  lines.push("| case | mode | with skill | score | without skill | score | delta |");
  lines.push("|---|---|---:|---:|---:|---:|---:|");
  for (const row of report.rows) {
    lines.push(`| ${row.id} | ${row.expected_mode} | ${row.withSkill.summary.ok ? "PASS" : "FAIL"} | ${row.withSkill.summary.qualityScore} | ${row.withoutSkill.summary.ok ? "PASS" : "FAIL"} | ${row.withoutSkill.summary.qualityScore} | ${row.deltaQualityScore.toFixed(2)} |`);
  }
  lines.push("");
  lines.push("## Failure Detail");
  lines.push("");
  for (const row of report.rows) {
    for (const side of ["withSkill", "withoutSkill"]) {
      const result = row[side];
      if (result.summary.ok) {
        continue;
      }
      lines.push(`### ${row.id} / ${side}`);
      for (const viewport of result.failures) {
        lines.push(`- ${viewport.viewport}:`);
        for (const failure of viewport.failures) {
          const slide = failure.slide ? ` slide ${failure.slide}` : "";
          lines.push(`  - ${failure.check}${slide}: ${failure.message}`);
        }
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const suite = await readJson(args.cases);
  const rows = suite.cases.map((testCase) => {
    const withSkillVerification = runVerify(testCase.with_skill);
    const withoutSkillVerification = runVerify(testCase.without_skill);
    const withSkillSummary = summarizeVerification(withSkillVerification);
    const withoutSkillSummary = summarizeVerification(withoutSkillVerification);
    return {
      id: testCase.id,
      prompt: testCase.prompt,
      expected_mode: testCase.expected_mode,
      withSkill: {
        path: testCase.with_skill,
        summary: withSkillSummary,
        failures: failureDetails(withSkillVerification),
      },
      withoutSkill: {
        path: testCase.without_skill,
        summary: withoutSkillSummary,
        failures: failureDetails(withoutSkillVerification),
      },
      deltaQualityScore: withSkillSummary.qualityScore - withoutSkillSummary.qualityScore,
    };
  });

  const withPasses = rows.filter((row) => row.withSkill.summary.ok).length;
  const withoutPasses = rows.filter((row) => row.withoutSkill.summary.ok).length;
  const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const report = {
    generatedAt: new Date().toISOString(),
    totals: { cases: rows.length },
    metrics: {
      withSkillPassRate: rows.length ? withPasses / rows.length : 1,
      withoutSkillPassRate: rows.length ? withoutPasses / rows.length : 1,
      withSkillAverageQualityScore: Number(average(rows.map((row) => row.withSkill.summary.qualityScore)).toFixed(2)),
      withoutSkillAverageQualityScore: Number(average(rows.map((row) => row.withoutSkill.summary.qualityScore)).toFixed(2)),
    },
    rows,
  };

  if (args.jsonOut) {
    const jsonOutPath = path.resolve(args.jsonOut);
    await mkdir(path.dirname(jsonOutPath), { recursive: true });
    await writeFile(jsonOutPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  if (args.reportOut) {
    const reportOutPath = path.resolve(args.reportOut);
    await mkdir(path.dirname(reportOutPath), { recursive: true });
    await writeFile(reportOutPath, markdownReport(report), "utf8");
  }
  console.log(args.json ? JSON.stringify(report, null, 2) : markdownReport(report));
  process.exit(0);
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(2);
});
