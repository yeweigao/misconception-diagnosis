// 案例三 · 三数排序与比较式（家长圈疑点 + 大人代笔订正）
// 读法：图谱（出卷目录）→ 参数与真值函数（答案都从它们算出）→ 顺着卷面往下。
// 运行：node build_worksheet.mjs   （paperkit / KaTeX / Chromium 说明见 ../../scripts/paperkit.mjs）
//
// 证据边界（家长 2026-11-12 确认，含当晚补充更正）：
//   · 三处红圈＝家长标出的三处做错的地方（「怕你不知道圈起来告诉你」），不是待定疑点；
//   · 「我说了她之后改了的」＝家长讲解后才出现的订正，属提示后写的，不算独立首答；
//   · 其余手写答案＝孩子独立写的，可作证据。
// 问卷里曾选过「家长圈的疑点 / 大人写的订正」，以家长随后补充的口述为准；两种读法都指向
// 同一条处理：订正笔迹不进推理链、不印进卷面，但「提示后能改对」本身是判读信息。
// 因此卷面探针与错题诊所里的「有人这样写」只带孩子独立写的错答，不带订正、不带想法。
// 不泄题：探针参数全部避开原题三个分数；原题参数只出现在第六大题错题诊所。

import { fileURLToPath } from "node:url";
import {
  Paper, tex, frac, fracBlank, blank, note, big, panel,
  strip, numberLine,
} from "../../scripts/paperkit.mjs";

// ───────── 真值：答案是参数的函数 ─────────

const val = ([a, b]) => a / b;
const asc = (arr) => [...arr].sort((x, y) => val(x) - val(y));
const chain = (arr) => arr.map(([a, b]) => frac(a, b)).join(" < ");
const rel = (x, y) => (val(x) < val(y) ? "<" : val(x) > val(y) ? ">" : "=");
const decides = ([a], [c]) => (a === c ? "分母" : "分子"); // 分子相同看分母；否则（本题）分母相同看分子
const larger = (x, y) => (val(x) > val(y) ? x : y);
const spoken = ([a, b]) => `${b} 份里取 ${a} 份`;

/** 不带分数标签的等分条：用于「看图写分数」，避免把答案印在图上。份数与涂色仍由参数决定。 */
function bareStrip(n, k = 0, w = 330, h = 21) {
  const cell = w / n;
  const rects = Array.from({ length: n }, (_, i) =>
    `<rect x="${(i * cell).toFixed(1)}" y="0" width="${cell.toFixed(1)}" height="${h}" ` +
    `fill="${i < k ? "#c9d8ea" : "#fff"}" stroke="#1a1a1a" stroke-width="1.1"/>`).join("");
  return `<svg class="fig" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${rects}</svg>`;
}

// ───────── 参数 ─────────

const probe = {
  strip: [8, 3],                  // 一(1) 纸带：8 份涂 3 份
  same: { den: 7, nums: [2, 5] }, // 一(2) 同分母
  unit: [3, 8],                   // 一(3) 同分子
};
const mixed = [                  // 二 混编判别（全部避开原题参数）
  [[2, 7], [5, 7]], [[1, 3], [1, 8]], [[3, 8], [7, 8]], [[1, 6], [1, 9]],
];
const dir = {
  control: [[2, 9], [5, 9]],     // 三(1) 有图
  swap: [[5, 9], [2, 9]],        // 三(2) 换了位置
  bare: [[[1, 6], [1, 3]], [[3, 8], [3, 7]]], // 三(3) 脱图
};
const ruler = { n: 8, marks: [[2, 8], [5, 8], [7, 8]] }; // 四 同一把尺
const links = {
  given: [[[1, 8], [1, 6]], [[1, 6], [3, 6]]], // 五(1) 有公共项；避开原题的 1/5、1/4、3/4
  loose: [[[1, 7], [1, 3]], [[2, 9], [5, 9]]], // 五(2) 无公共项
  bare: [[2, 9], [2, 5], [3, 5]],               // 五(3) 不给分步
};
const clinic = {
  pair: [[1, 3], [1, 5]],        // 题1(2) 左：图下 1/3、1/5
  pairWritten: [[1, 5], [1, 3]], // 孩子独立写的比较式：1/5 < 1/3（顺序调换）
  steps: [[[1, 4], [3, 4]], [[1, 5], [1, 4]]], // 题4 前两步（都对）
  finalWritten: [[1, 5], [3, 4], [1, 4]],      // 题4 最终链（孩子独立写的）
  original: [[3, 4], [1, 5], [1, 4]],          // 题面给出的三个数（照抄顺序的出处）
};
const finalQ = [[1, 6], [1, 3], [2, 3]];       // 七 毕业题：同分子 + 同分母 + 公共项

// ───────── 图谱：出卷目录（同一份数据供卷首、大题标注、家长页图） ─────────

const GRAPH = [
  { id: "cnm_p079", name: "认识几分之一", role: "课标节点 · 先修", kind: "课标",
    q: "一(1)", where: "看图写分数：分母＝平分的份数", pos: [5, 10], tested: false },
  { id: "cnm_p226", name: "认识几分之几", role: "课标节点 · 直接先修", kind: "课标",
    q: "一(1)", where: "看图写分数：分子＝取走的份数", pos: [5, 78], tested: false },
  { id: "cnm_p227", name: "简单的分数大小比较", role: "课标节点 · 本案", kind: "课标",
    q: "一、二、四", where: "两条规则与规则对判别", pos: [205, 10], tested: false },
  { id: "cnm_p029", name: "数的顺序、比较大小", role: "课标节点 · 一年级 · 接缝", kind: "课标",
    q: "三、五", where: "不等号方向与整数序，跨支零连边", pos: [5, 146], tested: true },
  { id: "cog_ineq", name: "不等号是有方向的关系", role: "认知节点 · 课标以下", kind: "认知",
    q: "三、六", where: "左边必须真的小；换位置要换符号", pos: [205, 78], tested: true },
  { id: "cog_ruler", name: "多个分数共用一把尺", role: "认知节点 · 课标以下", kind: "认知",
    q: "四、七", where: "同一整体上定位，位置决定顺序", pos: [205, 146], tested: true },
  { id: "bridge_chain", name: "两条式子经公共项接成链", role: "跨界桥 · 图谱零连边", kind: "桥",
    q: "五、六、七", where: "公共项接头：两条不等式合成一条链", pos: [405, 78], tested: true },
  { id: "case_star", name: "原题 ★（三处错题）", role: "原题落点", kind: "原题",
    q: "六", where: "错题诊所复现，不印正确答案", pos: [405, 146], tested: false },
];

// 依赖边；type "wrong" 是待确认接错的边（红虚线），由探针判定，不写成结论。
const EDGES = [
  ["cnm_p079", "cnm_p227", "dep"], ["cnm_p226", "cnm_p227", "dep"],
  ["cnm_p227", "cog_ineq", "wrong"], ["cnm_p029", "cog_ineq", "dep"],
  ["cnm_p226", "cog_ruler", "dep"], ["cog_ineq", "bridge_chain", "wrong"],
  ["cog_ruler", "bridge_chain", "dep"], ["bridge_chain", "case_star", "dep"],
  ["cnm_p227", "case_star", "dep"],
];

/** 家长页开头的知识图谱。节点、身份、题号、边全部取自 GRAPH / EDGES，不另画一张。 */
function graphSvg() {
  const W = 600, H = 230, NW = 180, NH = 48;
  const byId = Object.fromEntries(GRAPH.map((n) => [n.id, n]));
  const cx = ([x, y]) => [x + NW / 2, y + NH / 2];
  const parts = [
    `<defs><marker id="arw" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">` +
    `<path d="M0,0 L6,3 L0,6 z" fill="#4a4a4a"/></marker>` +
    `<marker id="arwR" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">` +
    `<path d="M0,0 L6,3 L0,6 z" fill="#b0322e"/></marker></defs>`,
  ];
  for (const [from, to, type] of EDGES) {
    const a = byId[from], b = byId[to];
    const [x1, y1] = cx(a.pos), [x2, y2] = cx(b.pos);
    const wrong = type === "wrong";
    const color = wrong ? "#b0322e" : "#4a4a4a";
    const dash = wrong ? ' stroke-dasharray="5,4"' : "";
    const marker = wrong ? "arwR" : "arw";
    // 从框边缘出发，避免线穿过框体；同列的边走上下边
    const dx = x2 - x1, dy = y2 - y1;
    const stroke = `fill="none" stroke="${color}" stroke-width="${wrong ? 1.8 : 1.2}"${dash} marker-end="url(#${marker})"`;
    if (Math.abs(dx) < 1) {
      const sy = y1 + Math.sign(dy) * (NH / 2 + 2);
      const ey = y2 - Math.sign(dy) * (NH / 2 + 5);
      parts.push(`<line x1="${x1}" y1="${sy}" x2="${x2}" y2="${ey}" ${stroke}/>`);
    } else {
      const sx = x1 + Math.sign(dx) * (NW / 2 + 2), ex = x2 - Math.sign(dx) * (NW / 2 + 5);
      const midX = (sx + ex) / 2;
      parts.push(`<path d="M${sx},${y1} C${midX},${y1} ${midX},${y2} ${ex},${y2}" ${stroke}/>`);
    }
  }
  for (const n of GRAPH) {
    const [x, y] = n.pos;
    const dash = n.tested ? ' stroke-dasharray="4,3"' : "";
    const fill = n.kind === "桥" ? "#fdf3e7" : n.kind === "原题" ? "#eef3e8" : "#f7f7f5";
    parts.push(`<rect x="${x}" y="${y}" width="${NW}" height="${NH}" rx="5" fill="${fill}" ` +
      `stroke="#333" stroke-width="1.1"${dash}/>`);
    parts.push(`<text x="${x + 8}" y="${y + 17}" font-size="13.5" font-weight="700" fill="#1a1a1a">${n.name}</text>`);
    parts.push(`<text x="${x + 8}" y="${y + 31}" font-size="10.5" fill="#555">${n.role}</text>`);
    parts.push(`<text x="${x + 8}" y="${y + 43}" font-size="10.5" fill="#555">${n.id}　第 ${n.q} 大题</text>`);
  }
  parts.push(`<text x="8" y="218" font-size="10" fill="#555">实线＝课标/依赖边　` +
    `红虚线＝待探针确认的接错边　虚框＝待测节点　绿底＝原题落点</text>`);
  return `<svg style="display:block;width:100%;height:auto" viewBox="0 0 ${W} ${H}" ` +
    `xmlns="http://www.w3.org/2000/svg" font-family="'Noto Sans SC',sans-serif">${parts.join("")}</svg>`;
}

const P = new Paper({
  eyebrow: "小学数学 · 错题探针与补强（分数大小比较）",
  title: "把两条式子接成一条链",
  subtitle: "—— 比得对，还要排得对 ——",
  route: "放行探针 → 谁说了算 → 不等号有方向 → 共用一把尺 → 接成一条链 → 错题诊所 → 毕业复测",
  running: "排序与接链",
  scoreTable: true,
  full: 100,          // 新版 paperkit 默认不计分；显式给满分才显示每题分值并配平
  numbering: "section",
  gap: 0,
}).graph(GRAPH.map(({ id, name, role, where }) => ({ id, name, role, where })));

// ───────── 一、先探一探：三支放行 ─────────

P.section("先探一探（这三题是放行用的，不过就回来看图）", {
  nodes: ["cnm_p079", "cnm_p226", "cnm_p227"],
  intro: "先确认「看图写分数」和两条比较规则都在，再往下走。",
})
  .q({ pts: 4, ans: `${frac(...[probe.strip[1], probe.strip[0]])}；分母 ${probe.strip[0]} 是平分的份数，分子 ${probe.strip[1]} 是取走的份数` },
    `一条纸带平均分成 ${probe.strip[0]} 份，涂色 ${probe.strip[1]} 份。涂色部分是这条纸带的几分之几？{分}`,
    bareStrip(probe.strip[0], probe.strip[1]),
    `写成分数 ${fracBlank()}；分母是 ${blank("2em")}，它表示 ${blank("6em")}；分子是 ${blank("2em")}，它表示 ${blank("6em")}。`)
  .q({ pts: 4, ans: `${frac(probe.same.nums[1], probe.same.den)}（${spoken([probe.same.nums[1], probe.same.den])}）多；这次看分子` },
    `一块饼平均切成 ${probe.same.den} 块，弟弟拿 ${probe.same.nums[0]} 块，哥哥拿 ${probe.same.nums[1]} 块。谁拿得多？这次你是看分子还是看分母？{分}`,
    `多的是 ${fracBlank()}；这次看 ${blank("2.4em")}，因为 ${blank("12em")}。`)
  .q({ pts: 4, ans: `${frac(1, Math.min(...probe.unit))} 大；看分母，分的人越少每份越大；两个整体要一样大` },
    `两块一样大的饼，一块平均分给 ${probe.unit[0]} 人，一块平均分给 ${probe.unit[1]} 人。每人哪一份大？{分}`,
    `大的是 ${fracBlank()}；这次看 ${blank("2.4em")}，因为 ${blank("12em")}。`);

// ───────── 二、谁说了算：规则对判别 ─────────

P.section("谁说了算（先想好看谁，再比）", {
  nodes: ["cnm_p227"],
  intro: "每组三件事：写「看分子 / 看分母」、写出大的那个分数、写一句为什么。",
});
for (const [i, [x, y]] of mixed.entries()) {
  if (i === 2) P.newPage().box(note("二、谁说了算（续）：接着写「看谁」和理由"));
  const by = decides(x, y), win = larger(x, y);
  P.q({ pts: 3, ans: `看${by}；${frac(...win)} 大（${by === "分母" ? "分子都是 1，分母小的每份大" : "分母相同，分子大的份数多"}）` },
    `${frac(...x)} 和 ${frac(...y)}，哪个大？{分}`,
    `看 ${blank("2.4em")}；大的是 ${fracBlank()}；因为 ${blank("11em")}。`).space(1.2);
}

// ───────── 三、不等号是有方向的（待测节点，自带撤支架三件套） ─────────

P.section("不等号是有方向的（左边必须真的比右边小）", {
  nodes: ["cnm_p029", "cog_ineq"],
  intro: "图在 → 换位置 → 图拿走。三级都过，这一条边才算通。",
})
  .q({ pts: 6, ans: `${rel(...dir.control)}；左边 2 份、右边 5 份，同样分成 9 份，2 份确实少` },
    `有图：两条纸带都平均分成 9 份，涂色的分别是 2 份和 5 份。按图的顺序写不等号，并写一句理由。{分}`,
    strip(9, 2), strip(9, 5),
    `${frac(...dir.control[0])} ${blank("1.8em")} ${frac(...dir.control[1])}；理由：${blank("12em")}。`)
  .q({ pts: 6, ans: `${rel(...dir.swap)}；两数换了位置，符号必须跟着换，不能照抄上一题` },
    `换位置：把上面两个数调过来写，中间该填什么？为什么不能照抄上一题的符号？{分}`,
    `${frac(...dir.swap[0])} ${blank("1.8em")} ${frac(...dir.swap[1])}；理由：${blank("12em")}。`)
  .q({ pts: 6, ans: dir.bare.map(([x, y]) => `${rel(x, y)}（看${decides(x, y)}）`).join("；") },
    `图拿走：不看图，只写符号，并写出你每次是看谁定的。（每组 3 分）{分}`,
    ...dir.bare.map(([x, y]) => big(`${frac(...x)} ${blank("1.8em")} ${frac(...y)}　　这次看 ${blank("2.4em")}`)))
  .q({ pts: 4, ans: "把每个 < 代回验：左边的数都比右边小；换位置后 5/9 > 2/9，符号换了才成立" },
    `校验：把（1）（2）两个式子里的每一个 ${tex("<")} 代回验一遍，写出你验了什么。{分}`,
    `我验的是：${blank("20em")}。`)
  .box(note("这一大题的规矩：写完不等号，先问一句「左边真的比右边小吗」。下一大题起，要把三个分数摆到同一根尺上。"));

// ───────── 四、共用一把尺 ─────────

P.newPage().section("共用一把尺（三个分数摆在同一根尺上）", {
  nodes: ["cnm_p227", "cog_ruler"],
  intro: "先在同一根 0 到 1 的尺上找到它们，位置会替你排好队。",
})
  .q({ pts: 6, ans: ruler.marks.map(([, b], i) => `${[2, 5, 7][i]} 格`).join("、") },
    `把 0 到 1 平均分成 ${ruler.n} 段。下面三个分数各在第几格？{分}`,
    numberLine(ruler.n, { ends: true }),
    `${ruler.marks.map(([a, b]) => `${frac(a, b)} 在第 ${blank("1.6em")} 格`).join("　")}`)
  .q({ pts: 6, ans: chain(asc(ruler.marks)) },
    `按尺上从左到右的位置，把三个分数从小到大排好。{分}`,
    `${fracBlank()} < ${fracBlank()} < ${fracBlank()}`)
  .q({ pts: 4, ans: "不一样大：两根纸条整体不一样长，各自的 1/2 不是同一份；比较前先确认整体相同" },
    `小陷阱：两根不一样长的纸条，都涂了各自的一半。这两份一样大吗？为什么？{分}`,
    `答：${blank("3em")}；因为 ${blank("16em")}。`);

// ───────── 五、接成一条链（待补的边，分值最重，自带撤支架三件套） ─────────

P.section("接成一条链（两步都对，还要把两步接起来）", {
  nodes: ["cnm_p029", "bridge_chain"],
  intro: "中间那个在两条式子里都出现的数，就是接头。",
})
  .q({ pts: 6, ans: chain([links.given[0][0], links.given[0][1], links.given[1][1]]) },
    `有接头：有人已经比出 ${frac(...links.given[0][0])} < ${frac(...links.given[0][1])} 和 ${frac(...links.given[1][0])} < ${frac(...links.given[1][1])}。把它们接成一条链。{分}`,
    `${fracBlank()} < ${fracBlank()} < ${fracBlank()}`,
    `接头是哪个数？${blank("3em")}　它在两条式子里都在吗？${blank("3em")}`)
  .q({ pts: 6, ans: "不能直接接：两条式子没有公共的数，也不知道 1/3 和 2/9 谁大，得再比一次" },
    `没接头：${frac(...links.loose[0][0])} < ${frac(...links.loose[0][1])} 和 ${frac(...links.loose[1][0])} < ${frac(...links.loose[1][1])}，能直接接成一条链吗？{分}`,
    `答：${blank("3em")}；因为 ${blank("17em")}。`)
  .q({ pts: 6, ans: chain(asc(links.bare)) },
    `不给分步：把 ${links.bare.map((f) => frac(...f)).join("、")} 从小到大排好，并写出你先比了哪两个。{分}`,
    `${fracBlank()} < ${fracBlank()} < ${fracBlank()}`,
    `我先比 ${blank("4em")} 和 ${blank("4em")}，再比 ${blank("4em")} 和 ${blank("4em")}。`)
  .q({ pts: 4, ans: "逐个验：< 左边都比右边小；若把链里任意两项对调，符号就必须改写，否则式子不成立" },
    `校验：把你写的链里每一个 ${tex("<")} 代回验一遍，写出其中一处。{分}`,
    `我验的是：${blank("20em")}。`);

// ───────── 六、错题诊所：原题参数只在这里出现 ─────────

P.newPage().section("错题诊所（原题 + 照片上自己写的答案，你来当医生）", {
  nodes: ["cog_ineq", "bridge_chain", "case_star"],
  intro: "下面三处都是做错的。家长讲解后卷面上才出现的订正，是提示后写出来的，不算独立首答，本卷不看、也不印。",
})
  .q({ pts: 3, ans: `${rel(...clinic.pairWritten)} 成立，数学上没错；但图下的顺序是 ${frac(...clinic.pair[0])}、${frac(...clinic.pair[1])}，写比较式时两数和符号要一起换` },
    `圆形图下写的是 ${frac(...clinic.pair[0])} 和 ${frac(...clinic.pair[1])}，比较式写成了 ${frac(...clinic.pairWritten[0])} < ${frac(...clinic.pairWritten[1])}。式子成立吗？和图的顺序对得上吗？{分}`,
    `成立吗？${blank("2.4em")}；顺序：${blank("12em")}。`)
  .q({ pts: 3, ans: "要先确认两个分数各是多少（分母＝平分的份数、分子＝取走的份数），再确认谁在 < 左边；这一处原来看不清，不猜" },
    `另一组数轴的比较式，后来被人划改过，原来写的分母已经看不清了。要把两个分数写进比较式，先要确认哪两件事？{分}`,
    `第一件：${blank("12em")}；第二件：${blank("12em")}。`)
  .q({ pts: 2, ans: `${frac(3, 4)} < ${frac(1, 4)} 不成立；两条分步都对，合起来却把 3/4 放到了 1/4 左边` },
    `排序题：前两步 ${frac(...clinic.steps[0][0])} < ${frac(...clinic.steps[0][1])} 和 ${frac(...clinic.steps[1][0])} < ${frac(...clinic.steps[1][1])} 都写对了，最终却写成 ${chain(clinic.finalWritten)}。{分}`,
    `把每个 ${tex("<")} 代回验一遍，不成立的是哪一处？${blank("8em")}`)
  .q({ pts: 2, ans: `${chain(asc(clinic.original))}；题目给的顺序是 ${clinic.original.map((f) => frac(...f)).join("、")}，不能照抄，要按比出来的链重排` },
    `正确的链是什么？能不能照题目给的三个数的顺序抄下来？{分}`,
    `${fracBlank()} < ${fracBlank()} < ${fracBlank()}　答：${blank("3em")}，因为 ${blank("10em")}。`);

// ───────── 七、毕业题 ─────────

P.section("毕业复测（换一组数，结构没变）", {
  nodes: ["cnm_p227", "cog_ruler", "bridge_chain"],
  intro: "过了这一题，这份卷子才算收官。",
})
  .q({ pts: 4, ans: chain(asc(finalQ)) },
    `把 ${finalQ.map((f) => frac(...f)).join("、")} 按从小到大排列。{分}`,
    `${fracBlank()} < ${fracBlank()} < ${fracBlank()}`)
  .q({ pts: 2, ans: "1/6 与 1/3 同分子看分母；1/3 与 2/3 同分母看分子；1/3 是接头" },
    `写一句话：这一题里两条规则各用在了哪一步，哪个数是接头？{分}`,
    `${blank("22em")}。`);

P.space(4).box(
  `<b>做完自查（做到就打 √）</b><br>` +
  `□ 每一个 ${tex("<")} 我都代回验过，左边确实比右边小　　□ 换了位置，我把符号也跟着换了<br>` +
  `□ 接链时，我先找到在两条式子里都出现的那个数<br>` +
  `□ 我没有照题目给的顺序抄，是按比出来的链重排的`)
  .space(3)
  .box(note("收官：原题三处错题都能讲出理由，且毕业题全对，这份卷子才算做完。答案在家长页，不要提前翻。"));

// ───────── 家长页 ─────────

P.parent("给家长 · 本卷图谱、答案与判读",
  "三处红圈＝标出的错题；讲解后才出现的订正按提示后写的处理，不算独立首答、不进推理链、不印进卷面。断在哪条边，以本卷探针为准。")
  .p(graphSvg())
  .heading("一、答案")
  .answers()
  .newPage()
  .heading("二、判读树（卡在哪题，就回哪个节点）")
  .p("· 一(1) 把 3/8 写成 8/3 → p079/p226 没过：真纸条折 8 份，先说「8 是什么、3 是什么」，再回一(1)。")
  .p("· 二 混编把 1/3 与 1/8 判成 1/8 大 → p227 规则对判别没过：只练「先说看谁」，不练比较。")
  .p("· 三(1) 对而 (2) 照抄同一个符号 → cog_ineq 没过：两张卡片对调一次，就问一次「符号要不要翻」，回三(2)。")
  .p("· 四 数轴定位错，或说两根不一样长的纸条各一半一样大 → cog_ruler 没过：先问「整体 1 是谁」，回四(1)。")
  .p("· 五(1) 接不上、(2) 说不清为什么 → bridge_chain 没过：三张卡片把公共那张放中间，回五(1)。")
  .heading("三、陪练（每节点一个实物游戏，两三分钟）")
  .p("· 陪练：纸条折 8 份说「8 和 3 各是什么」；卡片混着只问「这次看谁」；两张卡片对调抓「符号没翻」；同一根尺贴三张卡片读顺序；a、b、c 卡片把 b 对起来接链，抽掉 b 就接不上。")
  .heading("四、收官与说明")
  .p("· 收官：三处错题复测讲得出理由（尤其「为什么 3/4 不能排在 1/4 左边」）、第七大题全对、六能验出不成立的不等号 → 关闭；否则按判读树回对应节点。不泄题：探针避开原题参数，订正答案不印进卷面。")
  .p("· 提示后才改对，说明不是完全不会，本卷从放行探针起步、不从最基础重教；改对的笔迹不算独立首答，复测请遮住订正。被划改处原分母看不清，记为不知道。")
  .p("· 范围只到三处错题，不替代课堂。许可：cn-math-taxonomy CC BY-NC 4.0（商用另授权）；Marble os-taxonomy 图 ODbL 1.0、文本 CC BY-SA 4.0（署名同许可）。未转载原文，涉商用先确认。")
  .heading("五、图谱覆盖（与卷首同一份数据）")
  .coverage();

P.build(fileURLToPath(new URL("./worksheet", import.meta.url)));
