// 范例一 · 一份到底是多少：数轴十等份，一份答 1/11（点段不分，0 无起点义）。
// 读法：先看图谱（出卷目录），再看参数（答案都从它们算出），然后顺着卷面往下读。
// 运行：node build_worksheet.mjs    （KaTeX 位置见 scripts/paperkit.mjs 顶部）

import { fileURLToPath } from "node:url";
import { Paper, frac, tfrac, fracBlank, blank, panel, grid, numberLine, ruler } from "../../scripts/paperkit.mjs";

// ───────── 本案的数学：点、段、格 ─────────

const points = (segments) => segments + 1;          // 点数 ＝ 段数 ＋ 1
const segments = (pointCount) => pointCount - 1;
const cuts = (pieces) => pieces - 1;                // 剪成几段，剪几刀
const walked = ({ from, to }) => to - from;         // 长度 ＝ 走过的格数，不是末尾的读数
const b = (width = "2.4em") => blank(width);

/** 篱笆：posts 根柱子，柱子之间是栏杆。本案专用的图。 */
function fence(posts) {
  const [w, h, pad] = [540, 40, 18];
  const gap = w / (posts - 1);
  const rails = [14, 24].map((y) => `<line x1="${pad}" y1="${y}" x2="${pad + w}" y2="${y}" stroke="#1a1a1a" stroke-width="1.5"/>`);
  const stakes = Array.from({ length: posts }, (_, i) =>
    `<rect x="${(pad + i * gap - 3).toFixed(1)}" y="2" width="6" height="${h - 4}" fill="#1a1a1a"/>`);
  return `<svg class="fig" width="${w + 2 * pad}" height="${h}">${rails.join("")}${stakes.join("")}</svg>`;
}

// ───────── 参数 ─────────

const pencil = { lo: 0, hi: 10, from: 0, to: 6, name: "铅笔" };                  // 控制：对齐 0
const shifted = { lo: 0, hi: 10, from: 2, to: 8, name: "铅笔" };                 // 变式：移位
const snapped = { lo: 2, hi: 10, from: 3, to: 9, name: "纸条", broken: true };   // 断尺：0 不存在
const posts = 7;
const table = { segments: [3, 5, 10], pointCounts: [11, 6] };
const shadedLine = 4;
const bellied = [6, 10];             // 第二条就是原题的参数
const hidden = 8;
const clinic = { n: 10, said: 11 };  // 原题 + 孩子的原答案
const standing = [[5, 3], [10, 7]];  // [段数, ★ 站在第几个刻度]
const ticks = 4;
const marking = [[6, 2], [9, 4]];
const rope = { pieces: 10, unit: 7, pointCount: 9 };
const finale = { n: 10, stars: [4, 9] };

// ───────── 图谱：出卷目录 ─────────

const P = new Paper({
  eyebrow: "小学数学 · 分数专项训练卷",
  title: "一份到底是多少",
  subtitle: "—— 从尺子到数轴 ——",
  route: "本卷路线：0 是起点 → 长度＝走格 → 点 ≠ 段 → 分母数段 → 一份 × 份数 ＝ 1",
  running: "一份到底是多少",
  numbering: "paper",
  scoreTable: true,
  gap: 5,
}).graph([
  { id: "误1", name: "0＝起点", role: "误解层 · 实物层", where: "对齐量 → 移位量 → 断尺量" },
  { id: "误2", name: "长度＝走过的格数", role: "跨界桥：测量 → 数轴", where: "只许数格；尺子的一格搬进 0 到 1" },
  { id: "误3", name: "点数＝段数＋1", role: "误解层", where: "篱笆、点段表与反填" },
  { id: "误4", name: "分母数段", role: "接错的边", where: "给段编号再写分数；点数陷阱；诊所" },
  { id: "误5", name: "一份 × 份数 ＝ 1", role: "校验边", where: "每题验算；诊所里用它推翻 1/11" },
  { id: "cnm_p079", name: "认识几分之一", role: "本案节点", where: "原题所在的节点（三上第 6 单元）" },
  { id: "cnm_p226", name: "认识几分之几", role: "后继", where: "修好一份之后，从 0 走 k 份" },
  { id: "cnm_p278", name: "认识二分之一", role: "先修", outside: "不出题：骨架层无断边，他会平均分" },
]);

// ───────── 一、量一量：撤支架三件套 ─────────

P.section("量一量", { nodes: ["误1", "误2"], intro: "长度不是读出来的，是走出来的。只许数格，不许直接读最后一个数。" })
  .q({ pts: 6, ans: `${pencil.name} ${walked(pencil)} 厘米` },
    "对齐 0 量一量。{分}",
    ruler(pencil),
    `${pencil.name}长 ${b()} 厘米。`)
  .q({ pts: 8, ans: `从 ${shifted.from} 走到 ${shifted.to}，走了 ${walked(shifted)} 格，长 ${walked(shifted)} 厘米` },
    "没对齐 0！从几开始，就从几数格。{分}",
    ruler(shifted),
    `从刻度 ${b()} 走到刻度 ${b()}，走了 ${b()} 格，长 ${b()} 厘米。`)
  .q({ pts: 8, ans: `走了 ${walked(snapped)} 格，长 ${walked(snapped)} 厘米` },
    "尺子断了，0 不见了。数格照样量。{分}",
    ruler(snapped),
    `${snapped.name}从刻度 ${snapped.from} 走到刻度 ${snapped.to}，走了 ${b()} 格，长 ${b()} 厘米。`);

// ───────── 二、分一分：点和段 ─────────

P.section("分一分", { nodes: ["误3"], intro: "数清楚：哪些是点，哪些是段。决定份数的，从来不是点。" })
  .q({ pts: 6, ans: `柱子 ${posts} 根，栏杆 ${segments(posts)} 段；决定份数的是栏杆` },
    "篱笆：数一数柱子和栏杆。{分}",
    fence(posts),
    `柱子 ${b()} 根；栏杆 ${b()} 段。决定「份数」的是（ 柱子 / 栏杆 ）。`)
  .newPage()
  .q({ pts: 8, ans: `点数 ${table.segments.map(points).join("、")}；反过来，段数 ${table.pointCounts.map(segments).join("、")}` },
    "填表，再反过来填。{分}",
    grid([["段数", ...table.segments], ["点数", ...table.segments.map(() => "")]]),
    `反过来：${table.pointCounts.map((n) => `点数 ${n} → 段数 ${b()}`).join("；")}`);

// ───────── 三、搬一搬：把尺子的一格搬进 0 到 1 ─────────

P.space(4).section("搬一搬", { nodes: ["误2", "cnm_p079"], intro: "数轴就是一把尺子：把 0 到 1 这一整条平均分成的每一格，就叫「一份」。" })
  .q({ pts: 8, ans: `${shadedLine} 份，一份是 ${tfrac(1, shadedLine)}` },
    "涂色的一份是多少？{分}",
    numberLine(shadedLine, { shade: [0] }),
    `一共平均分成 ${b()} 份，涂色的一份是 ${fracBlank()}`);

// ───────── 四、认一认：分母数段 ─────────

P.space(4).section("认一认", { nodes: ["误4", "误5", "cnm_p079"], intro: "先给段编号，再写分数，最后验算：一份 × 份数，要正好等于 1。" })
  .q({ pts: 12, ans: bellied.map((n, i) => `（${i + 1}）${n} 段，${tfrac(1, n)}，验算填 ${n}`).join("；") },
    "先在小圆圈里给段编号，再写一份是多少。（每小题 6 分）",
    ...bellied.flatMap((n, i) => [
      `（${i + 1}）${numberLine(n, { bellies: true })}`,
      `一共 ${b()} 段，一份是 ${fracBlank()}　　验算：${b()} 份 × 一份 ＝ 1 吗？（ 是 / 不是 ）`,
    ]))
  .newPage()
  .q({ pts: 8, ans: `点 ${points(hidden)} 个，段 ${hidden} 段，一份是 ${tfrac(1, hidden)}` },
    "这次图里藏着点。先数点，再换成段。{分}",
    numberLine(hidden),
    `点有 ${b()} 个；段有 ${b()} 段；一份是 ${fracBlank()}`)
  .q({ pts: 10, ans: `（1）点；（2）${clinic.n} 段，${tfrac(1, clinic.n)}；（3）${clinic.n} × ${tfrac(1, clinic.said)} 比 1 小，${clinic.n} × ${tfrac(1, clinic.n)} ＝ 1` },
    `错题诊所：这就是写出 ${frac(1, clinic.said)} 的那道题。{分}`,
    panel(`小明把 0 到 1 平均分成 ${clinic.n} 份。他把 0 改成 1，顺着写 2、3……一直写到 ${clinic.said}，然后说：「一份是 ${frac(1, clinic.said)}。」`),
    numberLine(clinic.n),
    `（1）小明数的是（ 点 / 段 ）。　（2）这条线一共有 ${b()} 段，一份应该是 ${fracBlank()}`,
    `（3）验算：${clinic.n} × ${frac(1, clinic.said)} 比 1（ 大 / 小 ）；${clinic.n} × ${fracBlank()} ＝ 1。所以 ${frac(1, clinic.said)} 不对。`);

// ───────── 五、走一走：从 0 走 k 份 ─────────

P.section("走一走", { nodes: ["cnm_p226"], intro: "从 0 出发，一份一份地走。走几份，就是几分之几。" })
  .q({ pts: 8, ans: standing.map(([n, k], i) => `（${i + 1}）走了 ${k} 份，每份 ${tfrac(1, n)}，★ 表示 ${tfrac(k, n)}`).join("；") },
    "★ 站在哪个分数上？（每小题 4 分）",
    ...standing.flatMap(([n, k], i) => [
      `（${i + 1}）${numberLine(n, { stars: [k], width: 320 })}`,
      `从 0 走了 ${b()} 份；每份是 ${fracBlank()}，★ 表示 ${fracBlank()}`,
    ]))
  .newPage()
  .q({ pts: 4, ans: `依次 ${Array.from({ length: ticks - 1 }, (_, i) => tfrac(i + 1, ticks)).join("、")}` },
    "补全刻度下面的分数。{分}",
    numberLine(ticks, { labels: { 0: "0", ...Object.fromEntries(Array.from({ length: ticks - 1 }, (_, i) => [i + 1, "_"])), [ticks]: "1" } }))
  .q({ pts: 4, ans: marking.map(([n, k]) => `${tfrac(k, n)} 标在第 ${k} 个刻度`).join("；") },
    "自己标：在刻度上画 ★。（每小题 2 分）",
    ...marking.flatMap(([n, k], i) => [`（${i + 1}）标出 ${frac(k, n)}`, numberLine(n)]))
  .q({ pts: 4, ans: `（1）${cuts(rope.pieces)} 刀（剪刀数 ＝ 段数 − 1）；（2）${points(rope.unit)} 个点；（3）${segments(rope.pointCount)} 份，${tfrac(1, segments(rope.pointCount))}` },
    "挑战：换个样子，还认得点和段吗？{分}",
    `（1）一根绳子平均剪成 ${rope.pieces} 段，要剪 ${b()} 刀。`,
    `（2）一份是 ${frac(1, rope.unit)} 的线，刻度点一共有 ${b()} 个。`,
    `（3）一条 0 到 1 的线，刻度点一共有 ${rope.pointCount} 个。它被平均分成了 ${b()} 份，一份是 ${fracBlank()}`)
  .q({ pts: 6, ans: `（1）隔着 ${finale.stars[1] - finale.stars[0]} 份；（2）${tfrac(finale.stars[1], finale.n)}；（3）还要走 ${finale.n - finale.stars[0]} 份` },
    "毕业题：两颗 ★。{分}",
    numberLine(finale.n, { stars: finale.stars }),
    `（1）两颗 ★ 之间隔着 ${b()} 份。　（2）右边的 ★ 表示 ${fracBlank()}`,
    `（3）从左边的 ★ 走到 1，还要走 ${b()} 份。`)
  .box("<b>做完自查</b>（做到就在 □ 里打 √）<br>□ 0 是起点，不是一份　　□ 我数的是段，不是点　　□ 我验算过：一份 × 份数 ＝ 1");

// ───────── 家长页 ─────────

P.parent("给家长 · 答案、判读与陪练", "这一页请单独收好，不要给孩子看。先让孩子讲「我数的是段」，再对答案。")
  .heading("一、答案")
  .answers()
  .heading("二、判读树（卡在哪个节点，就回哪个节点；每个节点配一个两三分钟的实物游戏）")
  .p("第 2、3 题读末数（答 8、9）→「0＝起点」没过：0 还是「没有」，长度还是「读数」。先停分数，拿真尺玩两天——东西故意不对齐 0，再用纸遮住尺子的 0 到 2，只许数格回答。")
  .p("第 4、5 题点段不分 →「点数＝段数＋1」没过：用手指走栏杆、走段，一段一段点着数，别用眼睛扫。散步时数栏杆和路沿——一根柱子是一个点，迈出的一步才是一段。")
  .p("第 6 题卡住 → 尺子还没搬进数轴：把一张纸条对折成 4 份，指着它说，这就是 0 到 1，每一格是一份。")
  .p("第 7、8 题把点数写成分母 →「分母数段」没过：先给段的肚子编号再答（第 7 题的动作）。见到任何等分图先问一句「分母数什么？」，让他自己答：数段，不数点。")
  .p("第 10 题错 → 不是分母问题，是「走了几份」没数清：你报一个分数（如 7/10），让他在数轴上逐段点着走给你看，走错了当场数格纠正。")
  .p("全对，且能说出「点数 ＝ 段数 ＋ 1」→ 图谱接通，这份卷子收官。")
  .heading("三、这份卷子的出处（知识图谱）")
  .coverage()
  .p("<b>一句总纲：</b>数是走出来的，不是点出来的。刻度只负责站位，长度和份数都住在格里。");

P.build(fileURLToPath(new URL("./worksheet", import.meta.url)));
