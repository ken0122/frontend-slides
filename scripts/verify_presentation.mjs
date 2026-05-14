#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const DEFAULT_VIEWPORTS = [
  { name: "desktop-1080p", width: 1920, height: 1080 },
  { name: "desktop-900p", width: 1440, height: 900 },
  { name: "mobile-portrait", width: 375, height: 667 },
  { name: "mobile-landscape", width: 896, height: 414 },
];

const USAGE = `
Usage:
  node scripts/verify_presentation.mjs presentation.html [options]

Options:
  --json                 Print JSON only.
  --json-out <path>      Write JSON report to a file.
  --timeout <ms>         Navigation timeout per viewport. Default: 10000.
  --viewport WxH         Add/override viewport. Repeatable.
  --help                 Show this help.

Checks:
  - 1920x1080, 1440x900, 375x667, and 896x414 by default
  - first screen has visible content
  - every .slide has no internal overflow
  - keyboard, wheel, and visible nav controls move between slides
  - full frontend-slides spec: reveal states, progress bar, touch support,
    IntersectionObserver, reduced-motion CSS, and mobile viewport lock
`;

function parseArgs(argv) {
  const args = {
    target: null,
    json: false,
    jsonOut: null,
    timeout: 10000,
    viewports: [],
  };

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
    if (arg === "--json-out") {
      args.jsonOut = requireValue(argv, ++i, "--json-out");
      continue;
    }
    if (arg === "--timeout") {
      const value = Number(requireValue(argv, ++i, "--timeout"));
      if (!Number.isInteger(value) || value < 1000) {
        throw new Error("--timeout must be an integer >= 1000.");
      }
      args.timeout = value;
      continue;
    }
    if (arg === "--viewport") {
      args.viewports.push(parseViewport(requireValue(argv, ++i, "--viewport")));
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (args.target) {
      throw new Error(`Unexpected extra argument: ${arg}`);
    }
    args.target = arg;
  }

  if (!args.target) {
    throw new Error("Missing presentation path or URL.");
  }
  if (args.viewports.length === 0) {
    args.viewports = DEFAULT_VIEWPORTS;
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

function parseViewport(value) {
  const match = /^(\d+)x(\d+)$/i.exec(value);
  if (!match) {
    throw new Error(`Invalid viewport "${value}". Use WIDTHxHEIGHT, e.g. 1440x900.`);
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width < 1 || height < 1) {
    throw new Error(`Invalid viewport "${value}". Width and height must be positive.`);
  }
  return { name: `${width}x${height}`, width, height };
}

async function resolveTarget(target) {
  if (/^https?:\/\//i.test(target) || /^file:\/\//i.test(target)) {
    return target;
  }
  const absolutePath = path.resolve(target);
  let fileStat;
  try {
    fileStat = await stat(absolutePath);
  } catch {
    throw new Error(`Presentation file does not exist: ${absolutePath}`);
  }
  if (!fileStat.isFile()) {
    throw new Error(`Presentation target is not a file: ${absolutePath}`);
  }
  return pathToFileURL(absolutePath).href;
}

async function loadPlaywright() {
  const requireFromScript = createRequire(import.meta.url);
  const requireFromCwd = createRequire(path.join(process.cwd(), "package.json"));
  try {
    return requireFromScript("playwright");
  } catch (scriptError) {
    try {
      return requireFromCwd("playwright");
    } catch (cwdError) {
      if (
        scriptError?.code === "MODULE_NOT_FOUND" ||
        cwdError?.code === "MODULE_NOT_FOUND" ||
        scriptError?.code === "ERR_MODULE_NOT_FOUND" ||
        cwdError?.code === "ERR_MODULE_NOT_FOUND"
      ) {
        throw new Error(
          "Missing dependency: Playwright. Install it with `npm install --no-save playwright` " +
            "and, if needed, `npx playwright install chromium`."
        );
      }
      throw cwdError;
    }
  }
}

async function verifyViewport(page, url, viewport, timeout) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(url, { waitUntil: "load", timeout });
  await page.waitForTimeout(150);

  const firstScreen = await page.evaluate(firstScreenCheck);
  const slides = await page.evaluate(slideOverflowCheck);
  const fullSpec = await page.evaluate(fullSpecCheck);
  const navigation = await navigationCheck(page);

  const failures = [];
  if (!firstScreen.ok) {
    failures.push({
      check: "first-screen-content",
      message: firstScreen.message,
    });
  }
  for (const slide of slides.slides) {
    for (const issue of slide.issues) {
      failures.push({
        check: "slide-overflow",
        slide: slide.index,
        message: issue,
      });
    }
  }
  if (slides.slides.length === 0) {
    failures.push({
      check: "slide-overflow",
      message: "No .slide elements found.",
    });
  }
  for (const issue of navigation.issues) {
    failures.push({
      check: "navigation",
      message: issue,
    });
  }
  for (const issue of fullSpec.issues) {
    failures.push({
      check: "full-spec",
      message: issue,
    });
  }

  return {
    viewport,
    ok: failures.length === 0,
    failures,
    firstScreen,
    slides,
    navigation,
    fullSpec,
  };
}

function firstScreenCheck() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const visibleElements = [...document.body.querySelectorAll("body *")]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
        return false;
      }
      if (rect.width < 2 || rect.height < 2) {
        return false;
      }
      return rect.bottom > 0 && rect.right > 0 && rect.top < viewportHeight && rect.left < viewportWidth;
    })
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      text: (element.innerText || element.textContent || "").trim(),
    }));

  const hasText = visibleElements.some((element) => element.text.length >= 2);
  const hasMedia = visibleElements.some((element) =>
    ["img", "svg", "canvas", "video", "picture"].includes(element.tag)
  );
  const bodyText = (document.body.innerText || document.body.textContent || "").trim();

  return {
    ok: hasText || hasMedia,
    visibleElementCount: visibleElements.length,
    bodyTextLength: bodyText.length,
    message: hasText || hasMedia
      ? "First screen contains visible content."
      : "First screen appears blank: no visible text or media in viewport.",
  };
}

function slideOverflowCheck() {
  const tolerance = 2;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const slides = [...document.querySelectorAll(".slide")].map((slide, index) => {
    const rect = slide.getBoundingClientRect();
    const style = getComputedStyle(slide);
    const issues = [];

    if (Math.abs(rect.height - viewportHeight) > tolerance) {
      issues.push(`height ${Math.round(rect.height)}px does not match viewport ${viewportHeight}px`);
    }
    if (rect.width - viewportWidth > tolerance) {
      issues.push(`width ${Math.round(rect.width)}px exceeds viewport ${viewportWidth}px`);
    }
    if (style.overflow !== "hidden") {
      issues.push(`overflow is "${style.overflow}", expected "hidden"`);
    }
    if (slide.scrollHeight - slide.clientHeight > tolerance) {
      issues.push(
        `vertical internal overflow: scrollHeight ${slide.scrollHeight}px > clientHeight ${slide.clientHeight}px`
      );
    }
    if (slide.scrollWidth - slide.clientWidth > tolerance) {
      issues.push(
        `horizontal internal overflow: scrollWidth ${slide.scrollWidth}px > clientWidth ${slide.clientWidth}px`
      );
    }

    const outOfBoundsChildren = [...slide.querySelectorAll("*")]
      .map((element) => ({ element, rect: element.getBoundingClientRect(), style: getComputedStyle(element) }))
      .filter(({ rect, style }) => {
        if (style.display === "none" || style.visibility === "hidden") {
          return false;
        }
        if (rect.width < 1 || rect.height < 1) {
          return false;
        }
        return rect.height > viewportHeight + tolerance || rect.width > viewportWidth + tolerance;
      });

    if (outOfBoundsChildren.length > 0) {
      issues.push(`${outOfBoundsChildren.length} child element(s) are larger than the viewport`);
    }

    return {
      index: index + 1,
      height: Math.round(rect.height),
      width: Math.round(rect.width),
      clientHeight: slide.clientHeight,
      scrollHeight: slide.scrollHeight,
      clientWidth: slide.clientWidth,
      scrollWidth: slide.scrollWidth,
      issues,
    };
  });

  return { slideCount: slides.length, slides };
}

function fullSpecCheck() {
  const issues = [];
  const slides = [...document.querySelectorAll(".slide")];
  const revealElements = [...document.querySelectorAll(".reveal")];
  const visibleSlides = slides.filter((slide) => slide.classList.contains("visible"));
  const progressElement = document.querySelector(
    ".progress-bar, .progress [role='progressbar'], [data-progress], .progress-fill"
  );
  const specRuntime = window.__frontendSlidesSpec || {};
  const scriptText = [...document.scripts].map((script) => script.textContent || "").join("\n");
  const styleParts = [...document.querySelectorAll("style")].map((style) => style.textContent || "");
  for (const sheet of [...document.styleSheets]) {
    try {
      for (const rule of [...sheet.cssRules]) {
        styleParts.push(rule.cssText || "");
      }
    } catch {
      // Cross-origin stylesheets can deny cssRules access. Inline style tags are still checked.
    }
  }
  const styleText = styleParts.join("\n");
  const viewportMeta = document.querySelector("meta[name='viewport']")?.getAttribute("content") || "";

  if (slides.length > 0 && revealElements.length === 0) {
    issues.push("No .reveal elements found for progressive slide content.");
  }
  if (slides.length > 0 && visibleSlides.length === 0) {
    issues.push("No .slide.visible state found; first render can appear blank when reveal elements are hidden.");
  }
  if (slides[0] && !slides[0].classList.contains("visible")) {
    issues.push("First .slide is not marked visible on initial load.");
  }

  const visibleReveal = document.querySelector(".slide.visible .reveal");
  if (visibleReveal) {
    const style = getComputedStyle(visibleReveal);
    if (Number(style.opacity) === 0 || style.visibility === "hidden" || style.display === "none") {
      issues.push("Active slide reveal content is not visible.");
    }
  }

  if (slides.length > 1 && !progressElement && specRuntime.progress !== true) {
    issues.push("No progress bar element or runtime progress marker found.");
  }

  const hasIntersectionObserver =
    specRuntime.intersectionObserver === true || /\bIntersectionObserver\b/.test(scriptText);
  if (slides.length > 1 && !hasIntersectionObserver) {
    issues.push("No IntersectionObserver runtime found for .visible slide state updates.");
  }

  const hasTouchSupport = specRuntime.touch === true || /touch(start|move|end)|pointer(up|down|move)/i.test(scriptText);
  if (slides.length > 1 && !hasTouchSupport) {
    issues.push("No touch or pointer swipe support found.");
  }

  const hasReducedMotion = specRuntime.reducedMotion === true || /prefers-reduced-motion/i.test(styleText);
  if (!hasReducedMotion) {
    issues.push("No prefers-reduced-motion CSS fallback found.");
  }

  if (!/maximum-scale\s*=\s*1(?:\.0)?/i.test(viewportMeta) || !/user-scalable\s*=\s*no/i.test(viewportMeta)) {
    issues.push("Viewport meta should include maximum-scale=1.0,user-scalable=no for mobile deck stability.");
  }

  return {
    ok: issues.length === 0,
    issues,
    revealCount: revealElements.length,
    visibleSlideCount: visibleSlides.length,
    hasProgress: Boolean(progressElement || specRuntime.progress === true),
    hasIntersectionObserver,
    hasTouchSupport,
    hasReducedMotion,
    viewportMeta,
  };
}

async function navigationCheck(page) {
  const issues = [];
  const initial = await page.evaluate(positionSnapshot);
  const slideCount = await page.locator(".slide").count();

  if (slideCount < 2) {
    return {
      skipped: true,
      reason: "Need at least two slides to verify navigation.",
      issues,
      initial,
    };
  }

  await resetNavigationState(page);
  const keyboard = await attemptNavigation(page, async () => {
    await page.keyboard.press("ArrowDown");
  });
  if (!keyboard.moved) {
    issues.push("Keyboard navigation did not move after ArrowDown.");
  }

  await resetNavigationState(page);
  const viewportSize = page.viewportSize();
  let wheel = await attemptNavigation(page, async () => {
    await page.mouse.move((viewportSize?.width || 800) / 2, (viewportSize?.height || 600) / 2);
    await page.mouse.wheel(0, viewportSize?.height || 600);
  });
  if (!wheel.moved) {
    const synthetic = await attemptNavigation(page, async () => {
      await page.evaluate(() => {
        const event = new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          deltaY: window.innerHeight || 600,
        });
        document.dispatchEvent(event);
        window.dispatchEvent(event);
      });
    });
    wheel = { ...wheel, syntheticFallback: synthetic, moved: synthetic.moved };
  }
  if (!wheel.moved) {
    issues.push("Wheel navigation did not move.");
  }

  await resetNavigationState(page);
  const click = await clickNavigation(page);
  if (!click.moved && !click.skipped) {
    issues.push(click.reason || "Clickable navigation did not move.");
  }

  return {
    skipped: false,
    issues,
    initial,
    keyboard,
    wheel,
    click,
  };
}

async function resetNavigationState(page) {
  await page.reload({ waitUntil: "load" });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.scrollingElement?.scrollTo(0, 0);
    document.querySelector(".slide")?.scrollIntoView({ block: "start", behavior: "auto" });
  });
  await page.waitForTimeout(150);
}

async function attemptNavigation(page, action) {
  const before = await page.evaluate(positionSnapshot);
  await action();
  await page.waitForTimeout(450);
  const after = await page.evaluate(positionSnapshot);
  return {
    moved: movedBetween(before, after),
    before,
    after,
  };
}

async function clickNavigation(page) {
  const selectors = [
    ".nav-dots button:nth-child(2)",
    ".nav-dots [role='button']:nth-child(2)",
    ".nav-dots a:nth-child(2)",
    ".nav-dots > *:nth-child(2)",
    "[data-slide='1']",
    "[data-index='1']",
    "button[aria-label*='2']",
    "a[href='#slide-2']",
  ];

  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) === 0) {
      continue;
    }
    if (!(await locator.isVisible().catch(() => false))) {
      continue;
    }
    const before = await page.evaluate(positionSnapshot);
    try {
      await locator.click({ timeout: 1000, trial: false });
    } catch {
      continue;
    }
    await page.waitForTimeout(450);
    const after = await page.evaluate(positionSnapshot);
    return {
      moved: movedBetween(before, after),
      selector,
      before,
      after,
    };
  }

  return {
    moved: false,
    skipped: true,
    reason: "No visible nav-dot or slide navigation control found.",
  };
}

function positionSnapshot() {
  const slides = [...document.querySelectorAll(".slide")];
  const viewportCenter = window.innerHeight / 2;
  let activeSlide = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  slides.forEach((slide, index) => {
    const rect = slide.getBoundingClientRect();
    const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
    if (distance < bestDistance) {
      bestDistance = distance;
      activeSlide = index + 1;
    }
  });
  return {
    scrollY: Math.round(window.scrollY),
    activeSlide,
  };
}

function movedBetween(before, after) {
  return before.activeSlide !== after.activeSlide || Math.abs(after.scrollY - before.scrollY) > 10;
}

function summarize(report) {
  const lines = [];
  lines.push(report.ok ? "Presentation verification passed." : "Presentation verification failed.");
  lines.push(`Target: ${report.target}`);
  for (const result of report.results) {
    const label = `${result.viewport.name} (${result.viewport.width}x${result.viewport.height})`;
    if (result.ok) {
      lines.push(`PASS ${label}`);
      continue;
    }
    lines.push(`FAIL ${label}`);
    for (const failure of result.failures) {
      const slide = failure.slide ? ` slide ${failure.slide}:` : "";
      lines.push(`  - ${failure.check}${slide} ${failure.message}`);
    }
  }
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = await resolveTarget(args.target);
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });

  const results = [];
  try {
    const page = await browser.newPage();
    for (const viewport of args.viewports) {
      results.push(await verifyViewport(page, url, viewport, args.timeout));
    }
  } finally {
    await browser.close();
  }

  const report = {
    ok: results.every((result) => result.ok),
    target: url,
    generatedAt: new Date().toISOString(),
    results,
  };

  const jsonText = JSON.stringify(report, null, 2);
  if (args.jsonOut) {
    const jsonOutPath = path.resolve(args.jsonOut);
    await mkdir(path.dirname(jsonOutPath), { recursive: true });
    await writeFile(jsonOutPath, `${jsonText}\n`, "utf8");
  }

  console.log(args.json ? jsonText : summarize(report));
  process.exit(report.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(2);
});
