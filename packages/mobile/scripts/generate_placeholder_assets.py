"""プレースホルダー用の単色 PNG を標準ライブラリのみで生成するスクリプト。

expo の app.json が参照する icon / adaptive-icon / splash-icon / favicon は
実ファイルが存在しないと起動時にエラーになるため、最小限のダミー画像を用意する。
本番アセットに差し替えるまでの仮置き。
"""

import struct
import zlib
from pathlib import Path

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets" / "images"

# (ファイル名, サイズ, RGB)
TARGETS = [
    ("icon.png", 1024, (74, 108, 247)),
    ("adaptive-icon.png", 1024, (74, 108, 247)),
    ("splash-icon.png", 1024, (255, 255, 255)),
    ("favicon.png", 48, (74, 108, 247)),
]


def _chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def make_png(size: int, rgb: tuple[int, int, int]) -> bytes:
    width = height = size
    pixel = bytes(rgb)
    raw = b"".join(b"\x00" + pixel * width for _ in range(height))  # 各行の先頭にフィルタタイプ 0

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    signature = b"\x89PNG\r\n\x1a\n"
    return (
        signature
        + _chunk(b"IHDR", ihdr)
        + _chunk(b"IDAT", zlib.compress(raw, 9))
        + _chunk(b"IEND", b"")
    )


def main() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    for filename, size, rgb in TARGETS:
        path = ASSETS_DIR / filename
        path.write_bytes(make_png(size, rgb))
        print(f"generated: {path} ({size}x{size})")


if __name__ == "__main__":
    main()
