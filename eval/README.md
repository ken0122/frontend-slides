# Frontend Slides Eval

This directory contains the measurable eval loop for the `frontend-slides` skill.

## Recall Eval

```bash
node scripts/eval_skill_recall.mjs --report-out eval/reports/recall-report.md
```

Input: `eval/skill-recall-cases.jsonl`

The recall script uses a deterministic trigger proxy. It is not a replacement for platform retrieval logs, but it gives a repeatable local signal for:

- positive recall
- false positive rate
- mode routing
- reference coverage

## E2E A/B Eval

```bash
node scripts/eval_e2e.mjs \
  --report-out eval/reports/e2e-report.md \
  --json-out eval/reports/e2e-report.json
```

Input: `eval/e2e-cases.json`

The with-skill artifacts point to `examples/regression/`. The without-skill artifacts point to `examples/baseline/` and are synthetic controls until real no-skill generations are collected. Replace those paths when real controls exist.

## Progressive Loading Eval

```bash
node scripts/eval_skill_load.mjs --report-out eval/reports/load-report.md
```

The load eval checks the initial `SKILL.md` byte budget and verifies that referenced lazy-load files exist.

## Verification Gate

Both E2E sides use:

```bash
node scripts/verify_presentation.mjs <artifact>
```

The verifier checks viewport fit, first-screen content, keyboard/wheel/click navigation, and full frontend-slides runtime requirements.
