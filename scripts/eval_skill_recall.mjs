#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const DEFAULT_CASES = "eval/skill-recall-cases.jsonl";

const USAGE = `
Usage:
  node scripts/eval_skill_recall.mjs [options]

Options:
  --cases <path>       JSONL recall cases. Default: ${DEFAULT_CASES}
  --json               Print JSON only.
  --report-out <path>  Write a Markdown report.
  --help               Show this help.
`;

function parseArgs(argv) {
  const args = { cases: DEFAULT_CASES, json: false, reportOut: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      console.log(USAGE.trim());
      process.exit(0);
    }
    if (arg === "--json") {
      args.json = true;
      continue;
    }
    if (arg === "--cases") {
      args.cases = requireValue(argv, ++i, "--cases");
      continue;
    }
    if (arg === "--report-out") {
      args.reportOut = requireValue(argv, ++i, "--report-out");
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

async function readJsonl(filePath) {
  const text = await readFile(filePath, "utf8");
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${filePath}:${index + 1}: ${error.message}`);
      }
    });
}

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, " ");
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function classifyPrompt(prompt) {
  const text = normalize(prompt);
  const presentationIntent = includesAny(text, [
    /pptx?|pptm|potx|powerpoint|keynote|slide deck|slides?|presentation|pitch deck/,
    /ppt|演示文稿|演示|胶片|幻灯片|课件|汇报|提案|方案|售前|销售方案|客户提案/,
    /html.{0,12}(deck|slides?|presentation|演示|胶片|幻灯片)|网页ppt|ppt转网页/
  ]);
  const negativeIntent = includesAny(text, [
    /不要.{0,8}(网页|html|演示)|不需要.{0,8}(网页|html|演示)/,
    /(只要|仅要|only).{0,24}(powerpoint|pptx|keynote|原生)/,
    /翻译|translate|总结|summari[sz]e|告诉我里面讲了什么|读取.{0,10}(ppt|pptx)|解释一下/,
    /word|excel|spreadsheet|透视表|邮件|email|视频|分镜|markdown|仪表盘|dashboard|官网|落地页/,
    /不涉及slides|not.*presentation/
  ]);

  const shouldInvoke = presentationIntent && !negativeIntent;
  if (!shouldInvoke) {
    return { should_invoke: false, mode: "none", refs: [] };
  }

  let mode = "A";
  if (includesAny(text, [/移动.{0,8}(pptx|pdf)|移动终端|手机.{0,12}(pptx|pdf)|wechat|微信|导出成.{0,8}(pdf|pptx)/])) {
    mode = "mobile_fallback";
  } else if (includesAny(text, [/\.pptx?|\.pptm|\.potx|\bpptm\b|\bpotx\b|powerpoint|keynote|pptx.{0,16}(转|转换|convert|美化|重新设计|网页|html|提取)|旧pptx|uploaded.{0,16}ppt|附件.{0,16}ppt|ppt.{0,12}(转|convert|网页|html|提取)|convert.{0,16}(ppt|powerpoint)|提取.{0,12}(文字|图片|备注)/])) {
    mode = "B";
  } else if (includesAny(text, [/已有html|现有html|existing html|presentation\.html|演示网页|当前html|已有.{0,8}(胶片|演示)|现有.{0,8}(胶片|演示)|existing.{0,16}presentation|improve.{0,16}html/])) {
    mode = "C";
  }

  return { should_invoke: true, mode, refs: refsForMode(mode) };
}

function refsForMode(mode) {
  if (mode === "B") {
    return ["scripts/extract_pptx.py", "references/ppt-extraction.md", "references/html-architecture.md"];
  }
  if (mode === "C") {
    return ["references/html-architecture.md", "references/viewport-and-base.css", "scripts/verify_presentation.mjs", "STYLE_PRESETS.md", "references/edit-button-implementation.md"];
  }
  if (mode === "mobile_fallback") {
    return ["references/pptx-mobile-fallback.md"];
  }
  if (mode === "A") {
    return ["STYLE_PRESETS.md", "references/viewport-and-base.css", "references/html-architecture.md"];
  }
  return [];
}

function pct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function score(cases) {
  const rows = cases.map((testCase) => {
    const prediction = classifyPrompt(testCase.prompt);
    const invocationCorrect = prediction.should_invoke === testCase.should_invoke;
    const modeCorrect = !testCase.should_invoke || prediction.mode === testCase.expected_mode;
    const expectedRefs = testCase.expected_refs || [];
    const missingRefs = expectedRefs.filter((ref) => !prediction.refs.includes(ref));
    const refsCorrect = !testCase.should_invoke || missingRefs.length === 0;
    return {
      ...testCase,
      prediction,
      invocationCorrect,
      modeCorrect,
      refsCorrect,
      missingRefs,
      ok: invocationCorrect && modeCorrect && refsCorrect,
    };
  });

  const positives = rows.filter((row) => row.should_invoke);
  const negatives = rows.filter((row) => !row.should_invoke);
  const truePositives = positives.filter((row) => row.prediction.should_invoke).length;
  const falseNegatives = positives.length - truePositives;
  const trueNegatives = negatives.filter((row) => !row.prediction.should_invoke).length;
  const falsePositives = negatives.length - trueNegatives;
  const invokedRows = rows.filter((row) => row.should_invoke);
  const modeCorrect = invokedRows.filter((row) => row.modeCorrect).length;
  const refsCorrect = invokedRows.filter((row) => row.refsCorrect).length;

  return {
    ok: rows.every((row) => row.ok),
    totals: {
      cases: rows.length,
      positives: positives.length,
      negatives: negatives.length,
      truePositives,
      falseNegatives,
      trueNegatives,
      falsePositives,
    },
    metrics: {
      recall: positives.length ? truePositives / positives.length : 1,
      falsePositiveRate: negatives.length ? falsePositives / negatives.length : 0,
      invocationAccuracy: rows.filter((row) => row.invocationCorrect).length / rows.length,
      modeAccuracy: invokedRows.length ? modeCorrect / invokedRows.length : 1,
      referenceCoverage: invokedRows.length ? refsCorrect / invokedRows.length : 1,
      overallAccuracy: rows.filter((row) => row.ok).length / rows.length,
    },
    failures: rows.filter((row) => !row.ok),
    rows,
  };
}

function markdownReport(report) {
  const lines = [];
  lines.push("# Frontend Slides Recall Eval");
  lines.push("");
  lines.push(`- Cases: ${report.totals.cases} (${report.totals.positives} positive, ${report.totals.negatives} negative)`);
  lines.push(`- Recall: ${pct(report.metrics.recall)}`);
  lines.push(`- False positive rate: ${pct(report.metrics.falsePositiveRate)}`);
  lines.push(`- Invocation accuracy: ${pct(report.metrics.invocationAccuracy)}`);
  lines.push(`- Mode accuracy: ${pct(report.metrics.modeAccuracy)}`);
  lines.push(`- Reference coverage: ${pct(report.metrics.referenceCoverage)}`);
  lines.push(`- Overall accuracy: ${pct(report.metrics.overallAccuracy)}`);
  lines.push("");
  lines.push("## Failures");
  lines.push("");
  if (report.failures.length === 0) {
    lines.push("No failures.");
  } else {
    for (const failure of report.failures) {
      lines.push(`- ${failure.id}: expected invoke=${failure.should_invoke}, mode=${failure.expected_mode}; predicted invoke=${failure.prediction.should_invoke}, mode=${failure.prediction.mode}; missing refs=${failure.missingRefs.join(", ") || "none"}`);
    }
  }
  lines.push("");
  lines.push("## Case Rows");
  lines.push("");
  lines.push("| id | expected | predicted | ok |");
  lines.push("|---|---:|---:|---:|");
  for (const row of report.rows) {
    lines.push(`| ${row.id} | ${row.should_invoke ? row.expected_mode : "none"} | ${row.prediction.should_invoke ? row.prediction.mode : "none"} | ${row.ok ? "yes" : "no"} |`);
  }
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cases = await readJsonl(args.cases);
  const report = score(cases);
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
