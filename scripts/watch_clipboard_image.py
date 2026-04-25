#!/usr/bin/env python3
"""
Watch clipboard for images and save them to a target folder.

Behavior:
- If clipboard contains image file paths, copies image files with exact original names.
- If clipboard contains a raw bitmap image, saves it with an auto-generated name.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import shutil
import time
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageGrab

IMAGE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".bmp",
    ".gif",
    ".webp",
    ".tif",
    ".tiff",
    ".ico",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Watch clipboard images and save them locally."
    )
    parser.add_argument(
        "output_dir",
        type=Path,
        help="Folder where clipboard images should be stored.",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=1.0,
        help="Clipboard polling interval in seconds (default: 1.0).",
    )
    return parser.parse_args()


def is_image_file(path: Path) -> bool:
    return path.suffix.lower() in IMAGE_EXTENSIONS


def copy_image_files(files: Iterable[Path], output_dir: Path) -> tuple[list[Path], str]:
    copied: list[Path] = []
    key_parts: list[str] = []
    for src in files:
        if not src.exists() or not src.is_file() or not is_image_file(src):
            continue
        dst = output_dir / src.name
        if dst.exists():
            continue
        shutil.copy2(src, dst)
        copied.append(dst)
        stat = src.stat()
        key_parts.append(f"{src.resolve()}|{stat.st_mtime_ns}|{stat.st_size}")
    return copied, "files:" + ";".join(sorted(key_parts))


def save_bitmap(image: Image.Image, output_dir: Path) -> tuple[Path, str]:
    img = image.convert("RGB") if image.mode not in {"RGB", "RGBA"} else image
    buffer = io.BytesIO()
    # Use PNG bytes as a stable hash source for dedupe.
    img.save(buffer, format="PNG")
    content_hash = hashlib.sha256(buffer.getvalue()).hexdigest()[:16]
    destination = output_dir / f"clipboard-{content_hash}.png"
    if destination.exists():
        return destination, f"bitmap:{content_hash}"
    img.save(destination)
    return destination, f"bitmap:{content_hash}"


def main() -> None:
    args = parse_args()
    output_dir: Path = args.output_dir.expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Watching clipboard. Saving images to: {output_dir}")
    print("Press Ctrl+C to stop.")

    last_key: str | None = None

    while True:
        try:
            clipboard_data = ImageGrab.grabclipboard()
            if clipboard_data is None:
                time.sleep(args.interval)
                continue

            if isinstance(clipboard_data, list):
                paths = [Path(item) for item in clipboard_data]
                saved, key = copy_image_files(paths, output_dir)
                if saved and key != last_key:
                    for file_path in saved:
                        print(f"Saved: {file_path}")
                    last_key = key
            elif isinstance(clipboard_data, Image.Image):
                saved_file, key = save_bitmap(clipboard_data, output_dir)
                if key != last_key:
                    print(f"Saved: {saved_file}")
                    last_key = key

            time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nStopped.")
            break
        except Exception as exc:  # noqa: BLE001
            print(f"Error: {exc}")
            time.sleep(args.interval)


if __name__ == "__main__":
    main()
