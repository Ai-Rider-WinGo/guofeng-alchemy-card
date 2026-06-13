#!/usr/bin/env python3
"""Create a quick preview sheet from generated sample PNG files."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SAMPLES_DIR = ROOT / "assets" / "cards" / "samples"
OUTPUT = SAMPLES_DIR / "preview-contact-sheet.png"


def main() -> int:
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        raise SystemExit("Pillow is required: python -m pip install pillow")

    image_paths = [
        SAMPLES_DIR / "liubang_002.png",
        SAMPLES_DIR / "jixin_002.png",
        SAMPLES_DIR / "xiangyu_002.png",
        SAMPLES_DIR / "zhanghan_002.png",
        SAMPLES_DIR / "xingyang_escape_004.png",
        SAMPLES_DIR / "julu_battle_004.png",
        SAMPLES_DIR / "card_back.png",
    ]
    missing = [path for path in image_paths if not path.exists()]
    if missing:
        raise SystemExit("Missing generated samples: " + ", ".join(str(path) for path in missing))

    thumb_w, thumb_h = 192, 256
    label_h = 32
    cols = 4
    rows = 2
    sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h)), "#15130f")
    draw = ImageDraw.Draw(sheet)

    for index, path in enumerate(image_paths):
        image = Image.open(path).convert("RGB")
        image.thumbnail((thumb_w, thumb_h))
        x = (index % cols) * thumb_w
        y = (index // cols) * (thumb_h + label_h)
        paste_x = x + (thumb_w - image.width) // 2
        sheet.paste(image, (paste_x, y))
        draw.text((x + 8, y + thumb_h + 8), path.stem, fill="#d7c08a")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUTPUT)
    print(OUTPUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
