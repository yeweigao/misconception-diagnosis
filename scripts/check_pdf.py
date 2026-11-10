#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""出卷 QA：逐页量内容充实度（内容落点占页高 %），并报告页数。

标准（见 SKILL.md 出卷硬规则）：每页 ≥ 约 75%；65–75% 警告；< 65% 不合格。
充实度靠重排内容解决，不许靠压缩间距。本脚本只量「最后一行内容在哪」，
重叠/出界仍须逐页看渲染图人工核对。

用法：check_pdf.py 卷子.pdf
依赖：pdftoppm（poppler）+ Pillow。
"""
import glob, os, subprocess, sys, tempfile

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    pdf = sys.argv[1]
    try:
        from PIL import Image
    except ImportError:
        sys.exit("需要 Pillow：pip install pillow")
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(["pdftoppm", "-png", "-r", "60", pdf, os.path.join(td, "p")],
                       check=True, capture_output=True)
        pages = sorted(glob.glob(os.path.join(td, "p-*.png")))
        if not pages:
            sys.exit("渲染失败，没有页面。")
        ok = True
        for i, f in enumerate(pages, 1):
            im = Image.open(f).convert("L")
            w, h = im.size
            px = im.load()
            last = 0
            # 忽略页脚区（底部 5%）与装订线（左侧 8% 起采样）
            for yy in range(int(h * 0.95), 0, -1):
                dark = sum(1 for xx in range(int(w * 0.08), w, 4) if px[xx, yy] < 120)
                if dark > 3:
                    last = yy
                    break
            pct = last / h * 100
            flag = "OK" if pct >= 75 else ("警告" if pct >= 65 else "不合格")
            if pct < 65: ok = False
            print(f"第 {i} 页：内容落点 {pct:.0f}%  {flag}")
        print(f"共 {len(pages)} 页。" + ("全部达标。" if ok else "有页面不合格，先重排内容再交付。"))

if __name__ == "__main__":
    main()
