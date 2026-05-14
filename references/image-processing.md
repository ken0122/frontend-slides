# Image Processing Usage

Use `scripts/process_image.py` when a deck includes logos, screenshots, or large images.
The script never overwrites output files unless `--force` is passed.

## Commands

Resize large images:

```bash
python3 scripts/process_image.py resize input.png --out assets/input_resized.png --max-dim 1200 --pretty
```

Create a circular logo crop:

```bash
python3 scripts/process_image.py circle logo.png --out assets/logo_round.png --pretty
```

Add transparent padding to a screenshot:

```bash
python3 scripts/process_image.py padding screenshot.png --out assets/screenshot_padded.png --padding 40 --pretty
```

## Dependency

Install only when image processing is needed:

```bash
python3 -m pip install Pillow
```

## Output Contract

The command prints JSON containing the operation, input path, output path, original size,
final size, output byte size, and operation options.
