#!/usr/bin/env python3
"""Generate packaging icon sizes from the official System logo.

Source of truth: assets/branding/original-logo/system-logo.png
Resizes only — does not redesign the mark.
Opaque icon canvases use a light token color so the black mark remains visible.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets/branding/original-logo/system-logo.png"
CANVAS = (240, 243, 240, 255)  # --text-primary


def resize_transparent(orig: Image.Image, size: int, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    orig.resize((size, size), Image.Resampling.LANCZOS).save(dest, "PNG")


def resize_opaque(orig: Image.Image, size: int, dest: Path, pad_ratio: float = 0.12) -> None:
    canvas = Image.new("RGBA", (size, size), CANVAS)
    inner = max(1, int(size * (1 - 2 * pad_ratio)))
    mark = orig.resize((inner, inner), Image.Resampling.LANCZOS)
    offset = (size - inner) // 2
    canvas.alpha_composite(mark, (offset, offset))
    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dest, "PNG")


def main() -> None:
    orig = Image.open(SRC).convert("RGBA")
    desktop = ROOT / "apps/desktop/public"
    (desktop / "branding/system-logo.png").write_bytes(SRC.read_bytes())
    resize_transparent(orig, 256, desktop / "branding/system-logo-256.png")
    resize_transparent(orig, 128, desktop / "branding/system-logo-128.png")
    for s in (16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512):
        resize_opaque(orig, s, desktop / f"icons/icon-{s}.png")
    resize_opaque(orig, 32, desktop / "favicon-32.png")
    resize_opaque(orig, 180, desktop / "apple-touch-icon.png")

    ios = ROOT / "apps/ios/System/Assets.xcassets/AppIcon.appiconset"
    for name, size in {
        "Icon-20.png": 20,
        "Icon-20@2x.png": 40,
        "Icon-20@3x.png": 60,
        "Icon-29.png": 29,
        "Icon-29@2x.png": 58,
        "Icon-29@3x.png": 87,
        "Icon-40.png": 40,
        "Icon-40@2x.png": 80,
        "Icon-40@3x.png": 120,
        "Icon-60@2x.png": 120,
        "Icon-60@3x.png": 180,
        "Icon-76.png": 76,
        "Icon-76@2x.png": 152,
        "Icon-83.5@2x.png": 167,
        "Icon-1024.png": 1024,
    }.items():
        resize_opaque(orig, size, ios / name, pad_ratio=0.14)

    launch = ROOT / "apps/ios/System/Assets.xcassets/LaunchLogo.imageset"
    resize_transparent(orig, 200, launch / "LaunchLogo.png")
    resize_transparent(orig, 400, launch / "LaunchLogo@2x.png")
    resize_transparent(orig, 600, launch / "LaunchLogo@3x.png")
    print(f"Generated icons from {SRC}")


if __name__ == "__main__":
    main()
