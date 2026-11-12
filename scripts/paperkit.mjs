// paperkit —— 出卷骨架。规矩由结构承重，不靠出卷人的记性：
//
//   图谱定内容   graph() 声明节点，section() 标出处。节点没有落点、大题没有出处，构建即失败。
//   分值配平     每题报分，大题小计与全卷总分由骨架求和。不等于满分，构建即失败。
//   答案分区     答案只进登记簿，只有家长页取得出来。学生卷上没有放答案的地方。
//   排版         KaTeX 本地 SSR + SVG + HTML/CSS，无头 Chromium 打印，全程离线。
//
// 答案同源（答案是题目参数的函数）由出卷脚本自己保证：ans 里写算式，不写数。
// 写法照 examples/ 下两份 build_worksheet.mjs。

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// ═════════════════════════ 一、字与式 ═════════════════════════

const KATEX_DIR = process.env.KATEX_DIR ?? join(homedir(), "workspace/tools/katex");
const katex = await loadKatex();

async function loadKatex() {
  const entry = join(KATEX_DIR, "katex.min.js");
  if (!existsSync(entry)) {
    throw new Error(
      `找不到 KaTeX：${entry}\n` +
      "把 KaTeX 发行包（katex.min.js、katex.min.css、fonts/）放到 ~/workspace/tools/katex/，或用环境变量 KATEX_DIR 指向它。");
  }
  return (await import(pathToFileURL(entry).href)).default;
}

/** 行内数学式。分数一律走这里，不手工拼叠式。 */
export const tex = (src) => katex.renderToString(src, { displayMode: false, strict: false });
export const frac = (a, b) => tex(`\\dfrac{${a}}{${b}}`);
/** 小号分数：用在答案、注释这类不占行高的地方。 */
export const tfrac = (a, b) => tex(`\\tfrac{${a}}{${b}}`);
/** 分母待填的分数：a/□。 */
export const fracBox = (a = 1) => tex(`\\dfrac{${a}}{\\boxed{\\phantom{0}}}`);
/** 整个待填的分数：分数线上下各一个空格——空的形状告诉孩子该写什么。 */
export const fracBlank = () => tex("\\dfrac{\\boxed{\\phantom{0}}}{\\boxed{\\phantom{0}}}");

export const blank = (width = "3em") => `<span class="blank" style="min-width:${width}"></span>`;
export const note = (text) => `<span class="note">${text}</span>`;
export const big = (html) => `<span class="big">${html}</span>`;
export const candidates = (values) => `<span class="cands">${values.join(" ")}</span>`;
export const panel = (html) => `<div class="panel">${html}</div>`;
/** 小表格：rows 是二维数组，每行第一格是行名。 */
export const grid = (rows) =>
  `<table class="grid">${rows.map(([head, ...cells]) =>
    `<tr><th>${head}</th>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</table>`;

// ═════════════════════════ 二、图形：图是参数的函数 ═════════════════════════

const SHADE = "#c9d8ea";
const svg = (width, height, body, viewBox = `0 0 ${width} ${height}`) =>
  `<svg class="fig" width="${width}" height="${height}" viewBox="${viewBox}">${body}</svg>`;
const line = (x1, y1, x2, y2, width = 1.2) =>
  `<line x1="${x1.toFixed(1)}" y1="${y1}" x2="${x2.toFixed(1)}" y2="${y2}" stroke="#1a1a1a" stroke-width="${width}"/>`;
const label = (x, y, text, cls = "") =>
  `<text x="${x.toFixed(1)}" y="${y}" text-anchor="middle" class="${cls}">${text}</text>`;

/** 纸带：平均分成 n 份、涂 k 份，右侧标出它表示的分数。 */
export function strip(n, k = 1) {
  const [w, h] = [330, 21];
  const cell = w / n;
  const cells = Array.from({ length: n }, (_, i) =>
    `<rect x="${(i * cell).toFixed(1)}" y="0" width="${cell.toFixed(1)}" height="${h}" ` +
    `fill="${i < k ? SHADE : "#fff"}" stroke="#1a1a1a" stroke-width="1.1"/>`).join("");
  return `<span class="strip">${svg(w, h, cells)}${frac(k, n)}</span>`;
}

/**
 * 数轴：0 到 1 平均分成 n 段。
 *   shade   涂色的段（下标从 0 起）       stars   站着 ★ 的刻度
 *   bellies 每段上方画一个待编号的小圆圈   labels  刻度下的字：{ 刻度: "文字" | "_"（待填） }
 *   ends    两端标 0 和 1（默认标；给了 labels 就不标）
 */
export function numberLine(n, { shade = [], stars = [], bellies = false, labels, ends = !labels, width = 540 } = {}) {
  const pad = 18;
  const seg = width / n;
  const top = stars.length || bellies ? 30 : 12;
  const below = ends || labels ? 28 : 10;
  const x = (i) => pad + i * seg;
  const parts = [
    ...shade.map((i) => `<rect x="${x(i).toFixed(1)}" y="${top - 9}" width="${seg.toFixed(1)}" height="18" fill="${SHADE}"/>`),
    line(x(0), top, x(n), top, 1.6),
    ...Array.from({ length: n + 1 }, (_, i) => line(x(i), top - 7, x(i), top + 7)),
    ...stars.map((k) => label(x(k), top - 12, "★", "fig-star")),
    ...(bellies ? Array.from({ length: n }, (_, i) =>
      `<circle cx="${x(i + 0.5).toFixed(1)}" cy="${top - 17}" r="7.5" fill="none" stroke="#6b6b6b" stroke-width="0.8"/>`) : []),
    ...(ends ? [label(x(0), top + 24, "0", "fig-b"), label(x(n), top + 24, "1", "fig-b")] : []),
    ...Object.entries(labels ?? {}).map(([i, text]) => text === "_"
      ? line(x(+i) - 13, top + 26, x(+i) + 13, top + 26, 1.1)
      : label(x(+i), top + 24, text, "fig-b")),
  ];
  return svg(width + 2 * pad, top + below, parts.join(""));
}

/**
 * 尺子：刻度 lo..hi，上面摆一件从 from 到 to 的东西。broken 表示左端断掉（0 那截不在了）。
 */
export function ruler({ lo, hi, from, to, name, broken = false, width = 540 }) {
  const pad = 30;
  const unit = width / (hi - lo);
  const x = (v) => pad + (v - lo) * unit;
  const ticks = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const parts = [
    `<rect x="${x(from).toFixed(1)}" y="2" width="${((to - from) * unit).toFixed(1)}" height="13" rx="3" fill="${SHADE}" stroke="#1a1a1a"/>`,
    label(x((from + to) / 2), 12.5, name, "fig-s"),
    `<rect x="${x(lo)}" y="17" width="${width}" height="27" fill="none" stroke="#1a1a1a" stroke-width="1.3"/>`,
    ...ticks.map((v) => line(x(v), 17, x(v), v % 5 === 0 || v === lo || v === hi ? 28 : 25, 1)),
    ...ticks.map((v) => label(x(v), 62, v)),
    ...(broken ? [
      `<polyline points="${x(lo)},44 ${x(lo) - 5},38 ${x(lo)},33 ${x(lo) - 5},28 ${x(lo)},22" fill="none" stroke="#1a1a1a" stroke-width="1.4"/>`,
      `<text x="${x(lo) - 9}" y="62" text-anchor="end" class="fig-s fig-grey">断口</text>`,
    ] : []),
  ];
  return svg(width + 2 * pad, 68, parts.join(""));
}

// ═════════════════════════ 三、试卷 ═════════════════════════

const NUMERALS = "一二三四五六七八九十";
const numeral = (i) => NUMERALS[i] ?? String(i + 1);
const sum = (numbers) => numbers.reduce((a, b) => a + b, 0);
const BREAK = Symbol("换页");

export class Paper {
  #meta;
  #nodes = new Map();   // 图谱节点：id → { name, role, where | outside }
  #sections = [];       // 大题：{ title, nodes, note, questions }
  #student = [];        // 学生卷的块。惰性渲染：小计、编号、得分表要等全卷写完才知道
  #parent = [];         // 家长页的块
  #sink = this.#student;
  #issued = { answers: false, coverage: false };

  /**
   * @param meta
   *   eyebrow, title, subtitle?, route   卷头四行
   *   running                            学生卷页脚的卷名
   *   numbering   "section"（默认，每道大题内（1）（2）…）| "paper"（全卷 1. 2. 3. 连续编号）
   *   scoreTable  长卷：信息栏改为 班级/姓名/座号，并按大题生成得分表
   *   gap         每道题后面的留白（毫米），调全卷松紧用，默认 0
   *   full        满分，默认 100
   */
  constructor(meta) {
    this.#meta = { full: 100, numbering: "section", scoreTable: false, gap: 0, ...meta };
  }

  // ── 图谱：出卷目录从这里来 ──

  /** 声明本卷涉及的图谱节点。在卷内的写 where（落点说明），不在卷内的写 outside（理由）。 */
  graph(nodes) {
    for (const { id, ...node } of nodes) this.#nodes.set(id, node);
    return this;
  }

  // ── 学生卷 ──

  /** 开一道大题。nodes 是它在图谱里的出处；intro 是题头下的一句引导；note 写在小计前（如「每题 2 分」）。 */
  section(title, { nodes = [], intro, note } = {}) {
    const section = { title, nodes, note, questions: [] };
    const index = this.#sections.push(section) - 1;
    this.#student.push(() => {
      const points = [note, `共 ${sum(section.questions.map((q) => q.pts))} 分`].filter(Boolean).join("，");
      return `<div class="sec"><span>${numeral(index)}、${title}</span><span class="pts">${points}</span></div>` +
        (intro ? `<div class="intro">${intro}</div>` : "");
    });
    return this;
  }

  /**
   * 一道题。pts 是分值，ans 是家长页上的答案（必须有）。
   * 题干里的 {分} 换成「（n 分）」；后续各行缩进排在题干下；air 是各行之间额外的留白（毫米）。
   */
  q({ pts, ans, air = 0 }, stem, ...lines) {
    const section = this.#sections.at(-1);
    if (!section) throw new Error("先开大题（section），再出题。");
    if (ans == null) throw new Error(`「${stem.slice(0, 16)}…」没有答案。每道题都要在出题时交出答案。`);
    const question = { pts, ans, section };
    section.questions.push(question);
    this.#student.push(() => {
      const gap = air ? ` style="margin-bottom:${air}mm"` : "";
      return `<div class="item">${this.#label(question)}${stem.replace("{分}", `（${pts} 分）`)}</div>` +
        lines.map((html) => `<div class="item indent"${gap}>${html}</div>`).join("");
    });
    if (this.#meta.gap) this.space(this.#meta.gap);
    return this;
  }

  /** 卷面上一个带底色的框（做完自查之类）。 */
  box(html) { return this.#push(panel(html)); }

  // ── 家长页：调用 parent() 之后，后面的内容都进家长页 ──

  parent(title, lead) {
    this.#sink = this.#parent;
    return this.#push(`<h1 class="title">${title}</h1><div class="route">${lead}</div><div class="rule2"></div>`);
  }

  heading(text) { return this.#push(`<div class="ph">${text}</div>`); }
  p(html) { return this.#push(`<p>${html}</p>`); }

  /** 全卷答案。只在家长页有效——这是答案离开登记簿的唯一出口。 */
  answers() {
    if (this.#sink !== this.#parent) throw new Error("答案只能出现在家长页：先调用 parent()。");
    this.#issued.answers = true;
    this.#parent.push(() => this.#sections.map((section, i) => {
      const [joint, end] = this.#meta.numbering === "paper" ? ["　", ""] : ["；", "。"];
      return `<p>${numeral(i)}、${section.questions.map((q) => this.#label(q) + q.ans).join(joint)}${end}</p>`;
    }).join(""));
    return this;
  }

  /** 图谱覆盖表：每个节点在图谱里的位置、在本卷的落点（或不在本卷的理由）。 */
  coverage() {
    this.#issued.coverage = true;
    this.#parent.push(() => {
      const rows = [...this.#nodes].map(([id, node]) =>
        `<tr><td>${node.name}（${id}）</td><td>${node.role}</td><td>${this.#landing(id, node)}</td></tr>`);
      return `<table class="cov"><tr><th style="width:31%">图谱节点</th><th style="width:22%">在图谱里</th>` +
        `<th>在本卷哪里</th></tr>${rows.join("")}</table>`;
    });
    return this;
  }

  // ── 版面 ──

  space(mm) { return this.#push(`<div style="height:${mm}mm"></div>`); }
  newPage() { this.#sink.push(BREAK); return this; }

  // ── 构建：先过检，再成文 ──

  /** 写出 <base>.html 并打印 <base>.pdf。 */
  build(base) {
    this.#inspect();
    const pages = [...paginate(this.#student, "student"), ...paginate(this.#parent, "parent")];
    writeFileSync(`${base}.html`, this.#document(pages));
    const pdf = printPdf(`${base}.html`, `${base}.pdf`);
    if (pdf && pageCount(pdf) > pages.length) {
      throw new Error(`有页面写满溢出了：排了 ${pages.length} 页，打印出 ${pageCount(pdf)} 页。打开 ${base}.pdf 看是哪一页，重排内容或换页。`);
    }
    const count = (kind) => pages.filter((page) => page.kind === kind).length;
    console.table({
      总分: sum(this.#questions().map((q) => q.pts)),
      大题: this.#sections.map((s, i) => `${numeral(i)} ${sum(s.questions.map((q) => q.pts))}`).join(" / "),
      页数: `学生卷 ${count("student")} + 家长页 ${count("parent")}`,
      输出: pdf ?? `${base}.html（没找到 Chromium，PDF 未打印：用环境变量 CHROME 指定浏览器后重跑）`,
    });
  }

  #questions() { return this.#sections.flatMap((section) => section.questions); }

  #label(question) {
    if (this.#meta.numbering === "paper") return `<b>${this.#questions().indexOf(question) + 1}.</b> `;
    const { questions } = question.section;
    return questions.length > 1 ? `（${questions.indexOf(question) + 1}）` : "";
  }

  #inspect() {
    const { full } = this.#meta;
    const total = sum(this.#questions().map((q) => q.pts));
    if (total !== full) throw new Error(`分值不平：各题合计 ${total} 分，应为 ${full} 分。`);
    for (const [i, section] of this.#sections.entries()) {
      if (!section.nodes.length) throw new Error(`第${numeral(i)}大题没有标图谱出处（nodes）。`);
      for (const id of section.nodes) {
        if (!this.#nodes.has(id)) throw new Error(`第${numeral(i)}大题引用了未声明的节点 ${id}。`);
      }
    }
    for (const [id, node] of this.#nodes) {
      const lands = this.#sections.some((section) => section.nodes.includes(id));
      if (!lands && !node.outside) throw new Error(`节点 ${id} 在卷内没有落点；确实不出题，就写明 outside 理由。`);
      if (lands && node.outside) throw new Error(`节点 ${id} 写了 outside，卷内却有大题引用它。`);
    }
    if (!this.#issued.answers) throw new Error("家长页没有答案：在 parent() 之后调用 answers()。");
    if (!this.#issued.coverage) throw new Error("家长页没有图谱覆盖表：在 parent() 之后调用 coverage()。");
  }

  #landing(id, node) {
    if (node.outside) return node.outside;
    const hits = this.#sections.flatMap((section, i) => (section.nodes.includes(id) ? [numeral(i)] : []));
    const where = hits.length === this.#sections.length ? "全卷" : `第${hits.join("、")}大题`;
    return node.where ? `${where}：${node.where}` : where;
  }

  #head() {
    const { eyebrow, title, subtitle, route, scoreTable, full } = this.#meta;
    const columns = [...this.#sections.map((_, i) => numeral(i)), "总分"];
    const info = scoreTable
      ? `<span>班级 __________　姓名 __________　座号 ______</span>` +
        `<table class="score"><tr>${columns.map((c) => `<th>${c}</th>`).join("")}</tr>` +
        `<tr>${columns.map(() => "<td></td>").join("")}</tr></table>`
      : `<span>姓名 ____________</span><span>用时 ______ 分钟</span><span><b>满分 ${full}</b></span>`;
    return `<div class="eyebrow">${eyebrow}</div><h1 class="title">${title}</h1>` +
      (subtitle ? `<div class="subtitle">${subtitle}</div>` : "") +
      `<div class="route">${route}</div><div class="inforow">${info}</div><div class="rule2"></div>`;
  }

  #document(pages) {
    const body = pages.map(({ kind, blocks }, i) => {
      const count = `第 ${i + 1} 页（共 ${pages.length} 页）`;
      const student = kind === "student";
      return `<div class="page ${kind}">` +
        (student ? `<div class="bind"><span>装订线</span></div>` : "") +
        (i === 0 ? this.#head() : "") +
        blocks.map((render) => render()).join("") +
        `<div class="footer">${student ? `${this.#meta.running} · ${count} · 答案在家长页，不要翻` : `家长页 · ${count}`}</div></div>`;
    }).join("");
    const css = pathToFileURL(join(KATEX_DIR, "katex.min.css")).href;
    return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">` +
      `<link rel="stylesheet" href="${css}"><style>${CSS}</style></head><body>${body}</body></html>`;
  }

  #push(html) { this.#sink.push(() => html); return this; }
}

function paginate(blocks, kind) {
  const pages = [[]];
  for (const block of blocks) {
    if (block === BREAK) pages.push([]); else pages.at(-1).push(block);
  }
  return pages.filter((page) => page.length).map((blocks) => ({ kind, blocks }));
}

// ═════════════════════════ 四、打印 ═════════════════════════

const CHROME_CANDIDATES = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome",
];

/** PDF 的页数。一页排不下的内容会被浏览器挤到下一页，页数对不上就是有页面溢出。 */
const pageCount = (pdfPath) => (readFileSync(pdfPath, "latin1").match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length;

function printPdf(htmlPath, pdfPath) {
  const chrome = CHROME_CANDIDATES.find((path) => path && existsSync(path));
  if (!chrome) return null;
  execFileSync(chrome, [
    "--headless", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer",
    `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href,
  ], { stdio: "ignore" });
  return pdfPath;
}

// ═════════════════════════ 五、版式 ═════════════════════════
// 正式试卷：眉题、居中标题、信息栏、双线、装订线、页脚页码。宋体正文、黑体题头，不用细字重。

const SERIF = `"Noto Serif SC", "Noto Serif CJK SC", "Songti SC", "SimSun", serif`;
const SANS = `"Noto Sans SC", "Noto Sans CJK SC", "PingFang SC", "Heiti SC", "SimHei", sans-serif`;
const INK = "#1a1a1a";
const GREY = "#6b6b6b";

const CSS = `
@page { size: A4; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: ${SERIF}; color: ${INK}; font-size: 11pt; }
.page { width: 210mm; min-height: 296mm; padding: 13mm 15mm 13mm 19mm; position: relative; page-break-after: always; }
.page.parent { font-size: 10.5pt; }
.bind { position: absolute; left: 9mm; top: 8mm; bottom: 8mm; border-left: 1px dashed #9a9a9a; }
.bind span { position: absolute; top: 46%; left: -6.5mm; writing-mode: vertical-rl; color: #9a9a9a; font-family: ${SANS}; font-size: 8pt; letter-spacing: 2px; }
.eyebrow { text-align: center; font-family: ${SANS}; font-size: 9.5pt; color: ${GREY}; }
h1.title { text-align: center; font-size: 19pt; font-weight: 900; margin: 3mm 0 1.5mm; }
.subtitle { text-align: center; font-size: 10.5pt; color: ${GREY}; margin-bottom: 1.5mm; }
.route { text-align: center; font-family: ${SANS}; font-size: 9pt; color: ${GREY}; margin-bottom: 3.5mm; }
.inforow { display: flex; justify-content: space-between; align-items: flex-end; font-family: ${SANS}; font-size: 10pt; }
table.score { border-collapse: collapse; font-size: 9pt; }
table.score th, table.score td { border: 0.8px solid ${INK}; width: 9.5mm; height: 5.6mm; text-align: center; font-weight: 700; }
.rule2 { border-top: 2.2px solid ${INK}; border-bottom: 0.6px solid ${INK}; height: 2.6px; margin: 1.8mm 0 5mm; }
.sec { display: flex; justify-content: space-between; align-items: baseline; font-family: ${SANS}; font-weight: 700; font-size: 12.5pt; margin: 5mm 0 2.5mm; }
.sec .pts { font-weight: 400; font-size: 9.5pt; color: ${GREY}; }
.intro { font-size: 10pt; color: ${GREY}; margin: -1mm 0 2mm; }
.item { line-height: 2.05; margin-bottom: 2.2mm; }
.item .katex { font-size: 1.06em; }
.indent { margin-left: 7mm; }
.blank { display: inline-block; border-bottom: 1.4px solid ${INK}; height: 1em; }
.note { font-family: ${SANS}; font-size: 9pt; color: ${GREY}; }
.big { font-size: 11.5pt; }
.cands { font-size: 12.5pt; letter-spacing: 6px; }
.strip { display: inline-flex; align-items: center; gap: 4mm; margin: 0.4mm 0; }
.fig { display: block; }
.fig text { font-family: ${SERIF}; font-size: 10.5pt; fill: ${INK}; }
.fig .fig-b { font-weight: 700; }
.fig .fig-s { font-family: ${SANS}; font-size: 8pt; }
.fig .fig-grey { fill: ${GREY}; }
.fig .fig-star { font-family: ${SANS}; font-size: 12pt; }
.panel { background: #f3f3f3; border-radius: 1.4mm; padding: 2mm 3.5mm; line-height: 1.9; margin: 1mm 0; }
table.grid { border-collapse: collapse; }
table.grid th, table.grid td { border: 0.8px solid ${INK}; min-width: 15mm; height: 8mm; text-align: center; padding: 0 3mm; line-height: 1.4; }
table.grid th { font-weight: 700; }
.footer { position: absolute; bottom: 8mm; left: 0; right: 0; text-align: center; font-family: ${SANS}; font-size: 8.5pt; color: ${GREY}; }
.ph { font-family: ${SANS}; font-weight: 700; font-size: 12.5pt; margin: 3.8mm 0 2mm; }
.parent p { line-height: 1.72; margin-bottom: 1mm; }
table.cov { border-collapse: collapse; width: 100%; margin: 2mm 0 3mm; font-size: 9.8pt; }
table.cov td, table.cov th { border: 0.7px solid #888; padding: 1.1mm 2.2mm; line-height: 1.5; text-align: left; }
table.cov th { font-family: ${SANS}; background: #f2efe8; }
`;
