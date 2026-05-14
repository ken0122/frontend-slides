# PPTX Extraction Usage

Use `scripts/extract_pptx.py` for Mode B PPT/PPTX conversion.

## Command

```bash
python3 scripts/extract_pptx.py input.pptx --out output_dir --pretty
```

The command prints JSON to stdout and writes extracted images to `output_dir/assets/`.
Use `--json-out output_dir/slides.json` when the metadata should also be saved.

## Dependency

Install only when extraction is needed:

```bash
python3 -m pip install python-pptx
```

## Output Contract

The JSON object contains `source`, `output_dir`, `assets_dir`, `slide_count`, and `slides`.
Each slide has `number`, `title`, `content`, `images`, and `notes`.

Unsupported legacy `.ppt` files must be converted to `.pptx` first.
