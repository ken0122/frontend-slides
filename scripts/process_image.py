#!/usr/bin/env python3
"""
Process images for frontend-slides and print JSON metadata to stdout.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


class CliError(Exception):
    """Expected CLI failure with a user-facing message."""


def _load_pillow():
    try:
        from PIL import Image, ImageDraw
    except ImportError as exc:
        raise CliError(
            "Missing dependency: Pillow. Install it with "
            "`python3 -m pip install Pillow`."
        ) from exc
    return Image, ImageDraw


def _validate_input(path: Path) -> Path:
    path = path.expanduser().resolve()
    if not path.exists():
        raise CliError(f"Input image does not exist: {path}")
    if not path.is_file():
        raise CliError(f"Input path is not a file: {path}")
    return path


def _validate_output(path: Path, force: bool) -> Path:
    path = path.expanduser().resolve()
    if path.exists() and not force:
        raise CliError(f"Output already exists: {path}. Pass --force to overwrite.")
    return path


def _parse_color(value: str) -> tuple[int, int, int, int]:
    if value == "transparent":
        return (0, 0, 0, 0)

    match = re.fullmatch(r"#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})", value)
    if not match:
        raise CliError(
            "Invalid color. Use `transparent`, `#RRGGBB`, or `#RRGGBBAA`."
        )

    hex_value = match.group(1)
    red = int(hex_value[0:2], 16)
    green = int(hex_value[2:4], 16)
    blue = int(hex_value[4:6], 16)
    alpha = int(hex_value[6:8], 16) if len(hex_value) == 8 else 255
    return (red, green, blue, alpha)


def crop_circle(input_path: str | Path, output_path: str | Path, force: bool = False) -> dict[str, Any]:
    """Crop a square image to a circle with transparent background."""
    src = _validate_input(Path(input_path))
    dst = _validate_output(Path(output_path), force)
    Image, ImageDraw = _load_pillow()

    try:
        with Image.open(src) as opened:
            img = opened.convert("RGBA")

        original_size = img.size
        size = min(img.size)
        left = (img.width - size) // 2
        top = (img.height - size) // 2
        cropped = img.crop((left, top, left + size, top + size))
        mask = Image.new("L", (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse([0, 0, size, size], fill=255)
        cropped.putalpha(mask)
        dst.parent.mkdir(parents=True, exist_ok=True)
        cropped.save(dst, "PNG")
    except Exception as exc:
        raise CliError(f"Could not process image `{src}`: {exc}") from exc

    return _metadata("circle", src, dst, original_size, (size, size))


def resize_max(
    input_path: str | Path,
    output_path: str | Path,
    max_dim: int = 1200,
    force: bool = False,
) -> dict[str, Any]:
    """Resize image so its largest dimension is <= max_dim."""
    if max_dim < 1:
        raise CliError("--max-dim must be greater than 0.")

    src = _validate_input(Path(input_path))
    dst = _validate_output(Path(output_path), force)
    Image, _ = _load_pillow()

    try:
        with Image.open(src) as img:
            original_size = img.size
            resized = img.copy()
            resized.thumbnail((max_dim, max_dim), Image.LANCZOS)
            save_kwargs: dict[str, Any] = {}
            if dst.suffix.lower() in {".jpg", ".jpeg"} and resized.mode in {"RGBA", "LA"}:
                resized = resized.convert("RGB")
            if resized.mode not in {"RGBA", "LA"}:
                save_kwargs["quality"] = 85
                save_kwargs["optimize"] = True
            dst.parent.mkdir(parents=True, exist_ok=True)
            resized.save(dst, **save_kwargs)
            final_size = resized.size
    except Exception as exc:
        raise CliError(f"Could not process image `{src}`: {exc}") from exc

    return _metadata("resize", src, dst, original_size, final_size, {"max_dim": max_dim})


def add_padding(
    input_path: str | Path,
    output_path: str | Path,
    padding: int = 40,
    bg_color: str = "transparent",
    force: bool = False,
) -> dict[str, Any]:
    """Add padding around an image."""
    if padding < 0:
        raise CliError("--padding must be 0 or greater.")

    src = _validate_input(Path(input_path))
    dst = _validate_output(Path(output_path), force)
    color = _parse_color(bg_color)
    Image, _ = _load_pillow()

    try:
        with Image.open(src) as opened:
            img = opened.convert("RGBA")

        original_size = img.size
        new_size = (img.width + 2 * padding, img.height + 2 * padding)
        canvas = Image.new("RGBA", new_size, color)
        canvas.paste(img, (padding, padding), img)
        dst.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(dst, "PNG")
    except Exception as exc:
        raise CliError(f"Could not process image `{src}`: {exc}") from exc

    return _metadata(
        "padding",
        src,
        dst,
        original_size,
        new_size,
        {"padding": padding, "bg_color": bg_color},
    )


def _metadata(
    operation: str,
    src: Path,
    dst: Path,
    original_size: tuple[int, int],
    final_size: tuple[int, int],
    options: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "operation": operation,
        "input": str(src),
        "output": str(dst),
        "original_size": {"width": original_size[0], "height": original_size[1]},
        "final_size": {"width": final_size[0], "height": final_size[1]},
        "bytes": dst.stat().st_size,
        "options": options or {},
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Process a slide image and emit JSON metadata."
    )
    parser.add_argument(
        "operation",
        choices=("resize", "circle", "padding"),
        help="Image operation to run.",
    )
    parser.add_argument("input", help="Input image path.")
    parser.add_argument("--out", required=True, help="Output image path.")
    parser.add_argument("--force", action="store_true", help="Overwrite output file.")
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print JSON with indentation.",
    )
    parser.add_argument(
        "--max-dim",
        type=int,
        default=1200,
        help="Largest allowed dimension for resize. Default: 1200.",
    )
    parser.add_argument(
        "--padding",
        type=int,
        default=40,
        help="Padding in pixels for padding operation. Default: 40.",
    )
    parser.add_argument(
        "--bg-color",
        default="transparent",
        help="Padding background: transparent, #RRGGBB, or #RRGGBBAA.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        if args.operation == "resize":
            result = resize_max(args.input, args.out, args.max_dim, args.force)
        elif args.operation == "circle":
            result = crop_circle(args.input, args.out, args.force)
        else:
            result = add_padding(args.input, args.out, args.padding, args.bg_color, args.force)

        print(json.dumps(result, ensure_ascii=False, indent=2 if args.pretty else None))
        return 0
    except CliError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("error: interrupted", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
