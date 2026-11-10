#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""正式试卷版 v2 · 一份到底是多少 —— 页面充实均衡版
分页：P1 卷头+节点一 / P2 节点二+三+四(Q7) / P3 四续(Q8,Q9)+五(Q10) /
      P4 五续(Q11-Q14)+自查 / P5 家长页（答案·判读·陪练）
分值： 一22 二14 三8 四30 五26（Q10 8 + Q11 4 + Q12 4 + Q13 4 + Q14 6）= 100
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

W, H = A4
_FD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
pdfmetrics.registerFont(TTFont("SER", os.path.join(_FD, "NotoSerifSC-Regular.ttf")))
pdfmetrics.registerFont(TTFont("SERB", os.path.join(_FD, "NotoSerifSC-Bold.ttf")))
pdfmetrics.registerFont(TTFont("SERK", os.path.join(_FD, "NotoSerifSC-Black.ttf")))
pdfmetrics.registerFont(TTFont("SC", os.path.join(_FD, "NotoSansSC-Regular.ttf")))
pdfmetrics.registerFont(TTFont("SCB", os.path.join(_FD, "NotoSansSC-Bold.ttf")))

INK = HexColor("#111111")
GREY = HexColor("#777777")
DGREY = HexColor("#444444")
LIGHT = HexColor("#F5F5F5")
SHADE = HexColor("#FFD65A")
ML, MR = 62, 46
CW = W - ML - MR
RX = ML + 38
RW = CW - 56
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "worksheet.pdf")  # 发布版：输出到脚本所在目录；运行前把 Noto Sans SC / Noto Serif SC 字体放进同目录 fonts/
TOTAL_PAGES = 5

def T(c, x, y, s, size=11.5, font="SER", color=INK, align="left"):
    c.setFont(font, size); c.setFillColor(color)
    if align == "left": c.drawString(x, y, s)
    elif align == "center": c.drawCentredString(x, y, s)
    else: c.drawRightString(x, y, s)
    c.setFillColor(INK)
    return pdfmetrics.stringWidth(s, font, size)

def blank(c, x, y, w=26):
    c.setStrokeColor(INK); c.setLineWidth(0.7)
    c.line(x, y - 3, x + w, y - 3); c.setStrokeColor(INK)

def frac_blank(c, x, y, w=30):
    c.setStrokeColor(INK); c.setLineWidth(0.8)
    c.line(x, y, x + w, y); c.setStrokeColor(INK)

def sealing_line(c):
    c.saveState()
    c.setStrokeColor(GREY); c.setLineWidth(0.7); c.setDash(5, 4)
    c.line(34, 58, 34, H - 44)
    c.setDash()
    c.translate(24, H / 2); c.rotate(90)
    T(c, 0, 0, "装 订 线", 9, "SC", GREY, align="center")
    c.restoreState()

def footer(c, pno):
    T(c, W / 2, 30, f"第 {pno} 页（共 {TOTAL_PAGES} 页）", 9, "SC", GREY, align="center")

def section(c, y, numeral, name, node, pts, instr, cont=False):
    label = f"{numeral}、{name}（{pts} 分）" + ("（续）" if cont else "")
    T(c, ML, y, label, 13.5, "SCB")
    T(c, W - MR, y + 1, f"知识图谱 · 节点{node}", 9.5, "SER", GREY, align="right")
    y -= 19
    if instr:
        T(c, ML, y, instr, 10.5, "SER", DGREY)
        y -= 3
    return y - 13

def qhead(c, y, label):
    T(c, ML, y, label, 11.5, "SERB")
    return y

def number_line(c, x, y, w, n, shade=(), star=None, seg_numbers=False,
                tick_labels=None, label01=True):
    seg = w / n
    for i in shade:
        c.setFillColor(SHADE); c.rect(x + i * seg, y - 9, seg, 18, stroke=0, fill=1)
    c.setFillColor(INK); c.setStrokeColor(INK); c.setLineWidth(1.6)
    c.line(x, y, x + w, y); c.setLineWidth(1.2)
    for i in range(n + 1):
        tx = x + i * seg
        c.line(tx, y - 7, tx, y + 7)
    if label01:
        T(c, x, y - 22, "0", 11.5, "SERB", align="center")
        T(c, x + w, y - 22, "1", 11.5, "SERB", align="center")
    if star is not None:
        stars = star if isinstance(star, (list, tuple)) else [star]
        for k in stars:
            T(c, x + k * seg, y + 13, "★", 13, "SC", align="center")
    if seg_numbers:
        c.setStrokeColor(GREY); c.setLineWidth(0.7)
        for i in range(n):
            c.circle(x + (i + 0.5) * seg, y + 17, 7.5, stroke=1, fill=0)
        c.setStrokeColor(INK)
    if tick_labels:
        for idx, txt in tick_labels.items():
            tx = x + idx * seg
            if txt == "_": blank(c, tx - 14, y - 20, 28)
            else: T(c, tx, y - 22, txt, 11, align="center")
    return seg

def ruler_item(c, top, idx, lo, hi, a, b, label, broken=False):
    unit = RW / (hi - lo)
    T(c, ML + 4, top - 24, f"（{idx}）", 11.5, "SERB")
    ox = RX + (a - lo) * unit; ow = (b - a) * unit
    c.setFillColor(SHADE); c.setStrokeColor(INK); c.setLineWidth(1.0)
    c.roundRect(ox, top - 26, ow, 12, 3, stroke=1, fill=1)
    c.setFillColor(INK)
    T(c, ox + ow / 2, top - 23, label, 9, "SC", align="center")
    c.setStrokeColor(INK); c.setLineWidth(1.3)
    c.rect(RX, top - 54, RW, 26, stroke=1, fill=0)
    c.setLineWidth(1.0)
    for v in range(lo, hi + 1):
        tx = RX + (v - lo) * unit
        c.line(tx, top - 28, tx, top - (38 if v % 5 == 0 or v in (lo, hi) else 35))
        T(c, tx, top - 72, str(v), 10.5, "SER", align="center")
    if broken:
        c.setLineWidth(1.4)
        bx = RX
        c.line(bx, top - 54, bx - 5, top - 48); c.line(bx - 5, top - 48, bx, top - 43)
        c.line(bx, top - 43, bx - 5, top - 38); c.line(bx - 5, top - 38, bx, top - 33)
        T(c, RX - 8, top - 72, "断口", 9, "SC", GREY, align="right")

R1 = (0, 10, 0, 6, "铅笔")
R2 = (0, 10, 2, 8, "铅笔")
R3 = (2, 10, 3, 9, "纸条")
FENCE_POSTS = 7
Q7 = [6, 10]
Q10 = [(5, 3), (10, 7)]
Q12 = [(6, 2), (9, 4)]
Q14_STARS = [4, 9]   # on n=10

c = canvas.Canvas(OUT, pagesize=A4)

# ================================================================ PAGE 1
sealing_line(c)
y = H - 48
T(c, W / 2, y, "小 学 数 学 · 分 数 专 项 训 练 卷", 10.5, "SER", DGREY, align="center")
y -= 36
T(c, W / 2, y, "一份到底是多少", 24, "SERK", align="center")
y -= 28
T(c, W / 2, y, "—— 从尺子到数轴 ——", 11.5, "SER", DGREY, align="center")
y -= 36
T(c, ML, y, "班级：", 11.5); blank(c, ML + 40, y, 62)
T(c, ML + 118, y, "姓名：", 11.5); blank(c, ML + 158, y, 62)
T(c, ML + 236, y, "座号：", 11.5); blank(c, ML + 276, y, 36)
stw = 6 * 27
sx = W - MR - stw
c.setStrokeColor(INK); c.setLineWidth(0.8)
for r in range(3):
    c.line(sx, y + 15 - r * 16, sx + stw, y + 15 - r * 16)
for col in range(7):
    c.line(sx + col * 27, y + 15, sx + col * 27, y - 17)
for i, htxt in enumerate(["一", "二", "三", "四", "五", "总分"]):
    T(c, sx + i * 27 + 13.5, y + 4, htxt, 9.5, "SCB", align="center")
T(c, sx, y - 30, "题号 / 得分", 8.5, "SC", GREY)
y -= 36
c.setLineWidth(1.7); c.line(ML, y, W - MR, y)
c.setLineWidth(0.6); c.line(ML, y - 3.5, W - MR, y - 3.5)
y -= 18
c.setStrokeColor(INK); c.setLineWidth(0.8)
c.rect(ML, y - 24, CW, 24, stroke=1, fill=0)
T(c, W / 2, y - 16.5, "本卷路线（知识图谱）：0 是起点 → 长度＝走格 → 点 ≠ 段 → 分母数段 → 一份 × 份数 ＝ 1",
  9, "SER", align="center")
y -= 60

y = section(c, y, "一", "量一量", "一 · 0 是起点", 22, "长度不是读出来的，是走出来的。只许数格，不许直接读最后一个数。")
top = qhead(c, y, "1. 对齐 0 量一量。（6 分）")
ruler_item(c, top, 1, *R1)
T(c, RX, top - 90, "铅笔长", 11.5); blank(c, RX + 48, top - 90, 26)
T(c, RX + 80, top - 90, "厘米。", 11.5)
top -= 124
top = qhead(c, top, "2. 没对齐 0！从几开始，就从几数格。（8 分）")
ruler_item(c, top, 1, *R2)
yy = top - 90
T(c, RX, yy, "从刻度", 11.5); blank(c, RX + 48, yy, 24)
T(c, RX + 78, yy, "走到刻度", 11.5); blank(c, RX + 136, yy, 24)
T(c, RX + 166, yy, "，走了", 11.5); blank(c, RX + 210, yy, 24)
T(c, RX + 240, yy, "格，长", 11.5); blank(c, RX + 284, yy, 24)
T(c, RX + 314, yy, "厘米。", 11.5)
top -= 124
top = qhead(c, top, "3. 尺子断了，0 不见了。数格照样量。（8 分）")
ruler_item(c, top, 1, *R3, broken=True)
yy = top - 90
T(c, RX, yy, "纸条从刻度 3 走到刻度 9，走了", 11.5); blank(c, RX + 188, yy, 24)
T(c, RX + 218, yy, "格，长", 11.5); blank(c, RX + 262, yy, 24)
T(c, RX + 292, yy, "厘米。", 11.5)
footer(c, 1)
c.showPage()

# ================================================================ PAGE 2
sealing_line(c)
y = H - 58
y = section(c, y, "二", "分一分", "二 · 点 ≠ 段", 14, "数清楚：哪些是点，哪些是段。决定份数的，从来不是点。")
top = qhead(c, y, "4. 篱笆：数一数柱子和栏杆。（6 分）")
fx, fw = RX, RW
segw = fw / (FENCE_POSTS - 1)
c.setStrokeColor(INK)
for r in (0, 10):
    c.setLineWidth(1.5); c.line(fx, top - 36 + r, fx + fw, top - 36 + r)
for i in range(FENCE_POSTS):
    px = fx + i * segw
    c.setFillColor(INK); c.rect(px - 3, top - 48, 6, 36, stroke=0, fill=1)
c.setFillColor(INK)
yy = top - 76
T(c, RX, yy, "柱子", 11.5); blank(c, RX + 36, yy, 24)
T(c, RX + 66, yy, "根；栏杆", 11.5); blank(c, RX + 122, yy, 24)
T(c, RX + 152, yy, "段。决定「份数」的是（ 柱子 / 栏杆 ）。", 11.5)
top = yy - 46
top = qhead(c, top, "5. 填表，再反过来填。（8 分）")
tx = ML + 40
T(c, tx, top - 24, "段数", 11.5, "SERB")
xx = tx + 60
for n in (3, 5, 10):
    T(c, xx, top - 24, str(n), 12, "SER", align="center"); xx += 76
T(c, tx, top - 56, "点数", 11.5, "SERB")
xx = tx + 60
for _ in (3, 5, 10):
    blank(c, xx - 14, top - 56, 28); xx += 76
yy = top - 94
T(c, tx, yy, "反过来：点数 11 → 段数", 11.5); blank(c, tx + 152, yy, 26)
T(c, tx + 190, yy, "；点数 6 → 段数", 11.5); blank(c, tx + 302, yy, 26)
top = yy - 52

y = section(c, top, "三", "搬一搬", "三 · 整体 ＝ 0→1", 8, "数轴就是一把尺子：把 0 到 1 这一整条平均分成的每一格，就叫「一份」。")
top = qhead(c, y, "6. 涂色的一份是多少？（8 分）")
number_line(c, RX, top - 36, RW, 4, shade=(0,))
yy = top - 82
T(c, RX, yy, "一共平均分成", 11.5); blank(c, RX + 82, yy, 24)
T(c, RX + 112, yy, "份，涂色的一份是", 11.5); frac_blank(c, RX + 204, yy + 3, 30)
top = yy - 50

y = section(c, top, "四", "认一认", "四 · 分母数段", 30, "先给段编号，再写分数，最后验算：一份 × 份数，要正好等于 1。")
top = qhead(c, y, "7. 先在小圆圈里给段编号，再写一份是多少。（每小题 6 分）")
for j, n in enumerate(Q7):
    number_line(c, RX, top - 40, RW, n, seg_numbers=True)
    yy = top - 84
    T(c, ML + 4, yy + 44, f"（{j+1}）", 11.5, "SERB")
    T(c, RX, yy, "一共", 11.5); blank(c, RX + 36, yy, 24)
    T(c, RX + 66, yy, "段，一份是", 11.5); frac_blank(c, RX + 132, yy + 3, 30)
    T(c, RX + 180, yy, "验算：", 11.5); blank(c, RX + 224, yy, 24)
    T(c, RX + 254, yy, "份 × 一份 ＝ 1 吗？（ 是 / 不是 ）", 11.5)
    top = yy - 40
footer(c, 2)
c.showPage()

# ================================================================ PAGE 3
sealing_line(c)
y = H - 58
y = section(c, y, "四", "认一认", "四 · 分母数段", 30, "", cont=True)
top = qhead(c, y, "8. 这次图里藏着点。先数点，再换成段。（8 分）")
number_line(c, RX, top - 38, RW, 8)
yy = top - 84
T(c, RX, yy, "点有", 11.5); blank(c, RX + 36, yy, 24)
T(c, RX + 66, yy, "个；段有", 11.5); blank(c, RX + 122, yy, 24)
T(c, RX + 152, yy, "段；一份是", 11.5); frac_blank(c, RX + 218, yy + 3, 30)
top = yy - 50
top = qhead(c, top, "9. 错题诊所：这就是写出 1/11 的那道题。（10 分）")
c.setFillColor(LIGHT); c.roundRect(ML, top - 60, CW, 52, 5, stroke=0, fill=1)
c.setFillColor(INK)
T(c, ML + 14, top - 23, "小明把 0 到 1 平均分成 10 份。他把 0 改成 1，顺着写 2、3……一直写到 11，", 11)
T(c, ML + 14, top - 42, "然后说：「一份是 1/11。」", 11)
top -= 78
number_line(c, RX, top - 20, RW, 10)
top -= 70
T(c, ML + 4, top, "（1）小明数的是（ 点 / 段 ）。　（2）这条线一共有", 11.5)
blank(c, ML + 292, top, 24); T(c, ML + 322, top, "段，一份应该是", 11.5)
frac_blank(c, ML + 414, top + 3, 30)
top -= 32
T(c, ML + 4, top, "（3）验算：10 × 1/11 比 1（ 大 / 小 ）；10 ×", 11.5)
frac_blank(c, ML + 252, top + 3, 30)
T(c, ML + 290, top, "＝ 1。所以 1/11 不对。", 11.5)
top -= 56

y = section(c, top, "五", "走一走", "五 · k/n ＝ 走了 k 份", 26, "从 0 出发，一份一份地走。走几份，就是几分之几。")
top = qhead(c, y, "10. ★ 站在哪个分数上？（每小题 4 分）")
for j, (n, k) in enumerate(Q10):
    number_line(c, RX, top - 38, 250, n, star=k)
    yy = top - 84
    T(c, ML + 4, yy + 44, f"（{j+1}）", 11.5, "SERB")
    T(c, RX + 272, yy + 44, "从 0 走了", 11.5); blank(c, RX + 334, yy + 44, 24)
    T(c, RX + 364, yy + 44, "份；", 11.5)
    T(c, RX + 272, yy, "每份是", 11.5); frac_blank(c, RX + 316, yy + 3, 28)
    T(c, RX + 352, yy, "，★ 表示", 11.5); frac_blank(c, RX + 404, yy + 3, 28)
    top = yy - 42
footer(c, 3)
c.showPage()

# ================================================================ PAGE 4
sealing_line(c)
y = H - 58
y = section(c, y, "五", "走一走", "五 · k/n ＝ 走了 k 份", 26, "", cont=True)
top = qhead(c, y, "11. 补全刻度下面的分数。（4 分）")
number_line(c, RX, top - 38, RW, 4,
            tick_labels={0: "0", 1: "_", 2: "_", 3: "_", 4: "1"}, label01=False)
top -= 100
top = qhead(c, top, "12. 自己标：在刻度上画 ★。（每小题 2 分）")
for j, (n, k) in enumerate(Q12):
    T(c, ML + 4, top - 36, f"（{j+1}）标出", 11.5)
    T(c, ML + 66, top - 36, f"{k}/{n}", 12.5, "SERB")
    number_line(c, ML + 124, top - 38, CW - 156, n)
    top -= 72
top = qhead(c, top, "13. 挑战：换个样子，还认得点和段吗？（4 分）")
T(c, ML + 4, top - 28, "（1）一根绳子平均剪成 10 段，要剪", 11.5)
blank(c, ML + 208, top - 28, 24); T(c, ML + 238, top - 28, "刀。", 11.5)
T(c, ML + 4, top - 58, "（2）一份是 1/7 的线，刻度点一共有", 11.5)
blank(c, ML + 208, top - 58, 24); T(c, ML + 238, top - 58, "个。", 11.5)
T(c, ML + 4, top - 88, "（3）一条 0 到 1 的线，刻度点一共有 9 个。它被平均分成了", 11.5)
blank(c, ML + 344, top - 88, 24); T(c, ML + 374, top - 88, "份，一份是", 11.5)
frac_blank(c, ML + 440, top - 85, 30)
top -= 124
top = qhead(c, top, "14. 毕业题：两颗 ★。（6 分）")
number_line(c, RX, top - 38, RW, 10, star=Q14_STARS)
yy = top - 84
T(c, RX, yy, "（1）两颗 ★ 之间隔着", 11.5); blank(c, RX + 118, yy, 24)
T(c, RX + 148, yy, "份。　（2）右边的 ★ 表示", 11.5); frac_blank(c, RX + 268, yy + 3, 30)
yy -= 30
T(c, RX, yy, "（3）从左边的 ★ 走到 1，还要走", 11.5); blank(c, RX + 172, yy, 24)
T(c, RX + 202, yy, "份。", 11.5)
top = yy - 52
c.setFillColor(LIGHT); c.roundRect(ML, top - 56, CW, 62, 5, stroke=0, fill=1)
c.setFillColor(INK)
T(c, ML + 14, top - 23, "做完自查（做到就在 □ 里打 √）：", 11.5, "SERB")
T(c, ML + 14, top - 44, "□ 0 是起点，不是一份　　□ 我数的是段，不是点　　□ 我验算过：一份 × 份数 ＝ 1", 11)
footer(c, 4)
c.showPage()

# ================================================================ PAGE 5 (parent)
ML = 54
CW = W - ML - MR
y = H - 54
T(c, ML, y, "家长页：答案 · 判读 · 陪练", 17, "SERB")
y -= 22
T(c, ML, y, "附在卷末，判卷时再看。先让孩子讲「我数的是段」，再对答案。", 10.5, "SER", DGREY)
y -= 32
def ans(y, s, size=11):
    T(c, ML, y, s, size); return y - 21
y = ans(y, "答案", 13)
y = ans(y, "一、1. 铅笔 6 厘米。　2. 从 2 走到 8，走了 6 格，长 6 厘米。　3. 走了 6 格，长 6 厘米。")
y = ans(y, "二、4. 柱子 7 根，栏杆 6 段；决定份数的是栏杆。　5. 段 3、5、10 → 点 4、6、11；")
y = ans(y, "　　反过来：点 11 → 段 10，点 6 → 段 5。")
y = ans(y, "三、6. 4 份，一份是 1/4。")
y = ans(y, "四、7.（1）6 段，1/6，验算填 6；（2）10 段，1/10，验算填 10。　8. 点 9 个，段 8 段，一份是 1/8。")
y = ans(y, "　　9.（1）点；（2）10 段，1/10；（3）10 × 1/11 比 1 小，10 × 1/10 ＝ 1。")
y = ans(y, "五、10.（1）走了 3 份，每份 1/5，★ 表示 3/5；（2）走了 7 份，每份 1/10，★ 表示 7/10。")
y = ans(y, "　　11. 依次 1/4、2/4、3/4。　12. 2/6 标在第 2 个刻度；4/9 标在第 4 个刻度。")
y = ans(y, "　　13.（1）9 刀（剪刀数 ＝ 段数 － 1）；（2）8 个点；（3）8 份，1/8。")
y = ans(y, "　　14.（1）隔着 5 份；（2）9/10；（3）还要走 6 份。")
y -= 12
y = ans(y, "判读：卡在哪个节点，就回哪个节点练", 13)
for s in [
    "· 第 2、3 题读末数（答 8、9）→ 节点一没过：0 还是「没有」，长度还是「读数」。先停分数，",
    "　拿真尺玩两天：东西故意不对齐、遮住 0 到 2，只许数格回答。",
    "· 第 4、5 题点段不分 → 节点二没过：用手指走栏杆、走段，一段一段点着数，别用眼睛扫。",
    "· 第 7、8 题把点数写成分母 → 节点四没过：先给段的肚子编号再答（第 6 题的动作）。",
    "· 第 10 题错 → 节点五：不是分母问题，是「走了几份」没数清，逐段点着走。",
    "· 全对且能说出「点数 ＝ 段数 ＋ 1」→ 图谱接通，这份卷子收官。",
]:
    y = ans(y, s)
y -= 12
y = ans(y, "陪练：每个节点一个实物游戏（各两三分钟）", 13)
for s in [
    "· 节点一：量东西故意不对齐 0，答长度只许数格；再用纸遮住尺子的 0 到 2，照样量。",
    "· 节点二：散步时数栏杆和路沿：一根柱子是一个点，迈出的一步才是一段。",
    "· 节点三：把一张纸条对折成 4 份，指着它说——这就是 0 到 1，每一格是一份。",
    "· 节点四：见到任何等分图先问一句「分母数什么？」让他自己答：数段，不数点。",
    "· 节点五：你报一个分数（如 7/10），让他在数轴上走给你看，走错了当场数格纠正。",
]:
    y = ans(y, s)
y -= 12
y = ans(y, "一句总纲（整份卷子就这一句）", 13)
y = ans(y, "数是走出来的，不是点出来的。刻度只负责站位，长度和份数都住在格里。")
footer(c, 5)
c.showPage()
c.save()
print("OK", OUT)
