# Presentation Verification Usage

Use `scripts/verify_presentation.mjs` before delivering any generated or modified HTML presentation.

## Command

```bash
node scripts/verify_presentation.mjs presentation.html
```

The default viewport set is:

- `1920x1080`
- `1440x900`
- `375x667`
- `896x414`

## Dependency

Install only when browser verification is needed:

```bash
npm install --no-save playwright
npx playwright install chromium
```

## Checks

The script opens the presentation in Chromium and verifies:

- first screen has visible text or media
- every `.slide` matches the viewport height and has no internal overflow
- keyboard navigation moves between slides
- wheel navigation moves between slides
- any visible nav-dot or slide navigation control can be clicked
- full frontend-slides runtime requirements:
  - `.reveal` progressive content exists
  - initial `.slide.visible` state exists
  - progress bar exists
  - `IntersectionObserver` or runtime marker exists
  - touch/pointer swipe support exists
  - `prefers-reduced-motion` fallback exists
  - viewport meta includes `maximum-scale=1.0,user-scalable=no`

Use `--json` for machine-readable output, or `--json-out verification.json` to save the full report.

## Eval Loop

Recall proxy eval:

```bash
node scripts/eval_skill_recall.mjs --report-out eval/reports/recall-report.md
```

End-to-end A/B eval:

```bash
node scripts/eval_e2e.mjs \
  --report-out eval/reports/e2e-report.md \
  --json-out eval/reports/e2e-report.json
```

The A/B eval uses with-skill regression examples and synthetic without-skill controls by default. Replace the `without_skill` paths in `eval/e2e-cases.json` when real no-skill generations are available.

## Regression Examples

The Phase 4 regression set lives in `examples/regression/manifest.json` and covers:

- from-scratch pre-sales proposal
- PPTX converted to HTML
- enhanced existing HTML
