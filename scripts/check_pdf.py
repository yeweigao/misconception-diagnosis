#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""出卷 QA：逐页量内容充实度（最后一行内容落在页高的百分之几）。

标准（见 SKILL.md 交付自查）：≥ 75% 合格；65–75% 警告；< 65% 不合格。
充实度靠重排内容解决，不靠压缩间距。本脚本只回答「最后一行在哪」；
重叠、出界仍须逐页看渲染图。

用法：check_pdf.py 卷子.pdf
依赖：pdftoppm（poppler）+ Pillow。
"""
import subprocess
import sys
import tempfile
from pathlib import Path

GOOD, WARN = 75, 65        # 充实度分档（%）
DPI = 60                   # 量落点够用的分辨率
FOOTER = 0.95              # 此线以下是页脚，不算内容
BINDING = 0.08             # 此线以左是装订线，不算内容
INK = 120                  # 灰度低于它算墨迹
STRIDE, SPECKS = 4, 3      # 每 STRIDE 像素采一点；一行墨点超过 SPECKS 才算有内容


def rasterize(pdf: str, into: Path) -> list:
    subprocess.run(["pdftoppm", "-png", "-r", str(DPI), pdf, str(into / "p")], check=True, capture_output=True)
    return sorted(into.glob("p-*.png"))


def fullness(png: Path) -> float:
    """自下而上找到第一行有内容的像素行，返回它在页高中的百分比。"""
    from PIL import Image
    page = Image.open(png).convert("L")
    width, height = page.size
    pixel = page.load()
    for y in range(int(height * FOOTER), 0, -1):
        if sum(pixel[x, y] < INK for x in range(int(width * BINDING), width, STRIDE)) > SPECKS:
            return y / height * 100
    return 0.0


def verdict(percent: float) -> str:
    return "OK" if percent >= GOOD else "警告" if percent >= WARN else "不合格"


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    try:
        import PIL  # noqa: F401
    except ImportError:
        sys.exit("需要 Pillow：pip install pillow")
    with tempfile.TemporaryDirectory() as scratch:
        pages = rasterize(sys.argv[1], Path(scratch))
        if not pages:
            sys.exit("渲染失败，没有页面。")
        scores = [fullness(page) for page in pages]
    for number, percent in enumerate(scores, 1):
        print(f"第 {number} 页：内容落点 {percent:.0f}%  {verdict(percent)}")
    passed = all(percent >= WARN for percent in scores)
    print(f"共 {len(scores)} 页。" + ("全部达标。" if passed else "有页面不合格，先重排内容再交付。"))


if __name__ == "__main__":
    main()
