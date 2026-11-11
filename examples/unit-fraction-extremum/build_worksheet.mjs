// 探针补强卷 v4：出卷目录来自知识图谱（cnm_p227 全貌 + 先修 p226/p079 + 同单元 p080 衔接），
// 题目顺序按 CPA 递进（情境→图示→抽象）。KaTeX(SSR)+SVG+HTML/CSS，本地无头 Chromium 出 PDF。
// 图形参数与答案同源：ANS 全部由参数计算。
// 发布版说明：下一行的 KaTeX 路径请改成本地 KaTeX 安装位置（见本目录 README.md）。
import katex from "/home/hatch/workspace/tools/katex/katex.min.js";
import { writeFileSync } from "fs";

const M = (tex) => katex.renderToString(tex, { displayMode: false, strict: false });
const F = (d) => M(`\\dfrac{1}{${d}}`);
const G = (a, b) => M(`\\dfrac{${a}}{${b}}`);
const FB = () => M(`\\dfrac{1}{\\boxed{\\phantom{0}}}`);

// ---------- 参数与答案（同源） ----------
const cands = [3, 5, 6, 7, 9, 12];
const pairsUnit = [[8, 6], [9, 12], [3, 5]];
const mixPairs = [ // [fracA, fracB, 看谁, 大者]
  [[1, 6], [1, 4], "分母", [1, 4]],
  [[3, 8], [5, 8], "分子", [5, 8]],
  [[2, 7], [4, 7], "分子", [4, 7]],
  [[1, 8], [1, 3], "分母", [1, 3]],
];
const ANS = {
  P1: "1/5", P2: cands.filter((v) => v > 6), P3: "不能",
  P4: "5/7",
  Q0: "5 人分的那份大", Q1: "1/2 > 1/3 > 1/4",
  Q2: pairsUnit.map(([a, b]) => `1/${Math.min(a, b)}`),
  S1: ["大", 6], S2: ["小", 2],
  R1: ["七分之三", "七分之五"], R3: "5/9 > 4/9 > 1/9",
  MIX: mixPairs.map((p) => `${p[3][0]}/${p[3][1]}`),
  CLINIC: 3, G1: 7, G2: 3, G3: "5/7",
};

function strip(n, k = 1) {
  const w = 330, h = 21, cw = w / n;
  let cells = "";
  for (let i = 0; i < n; i++)
    cells += `<rect x="${(i * cw).toFixed(1)}" y="0" width="${cw.toFixed(1)}" height="${h}" fill="${i < k ? "#c9d8ea" : "#fff"}" stroke="#1a1a1a" stroke-width="1.1"/>`;
  return `<span class="stripwrap"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${cells}</svg><span class="striplab">${k === 1 ? F(n) : G(k, n)}</span></span>`;
}
const blank = (w = "3em") => `<span class="blank" style="min-width:${w}"></span>`;

const CSS = `
@page { size: A4; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Noto Serif SC", serif; color: #1a1a1a; font-size: 11pt; }
.page { width: 210mm; height: 296mm; padding: 13mm 15mm 11mm 19mm; position: relative; page-break-after: always; overflow: hidden; }
.bind { position: absolute; left: 9mm; top: 8mm; bottom: 8mm; border-left: 1px dashed #9a9a9a; }
.bind span { position: absolute; top: 46%; left: -6.5mm; writing-mode: vertical-rl; color: #9a9a9a; font-family: "Noto Sans SC"; font-size: 8pt; letter-spacing: 2px; }
.eyebrow { text-align: center; font-family: "Noto Sans SC"; font-size: 9.5pt; color: #6b6b6b; }
h1.title { text-align: center; font-size: 19pt; font-weight: 900; margin: 3mm 0 1.5mm; }
.route { text-align: center; font-family: "Noto Sans SC"; font-size: 9pt; color: #6b6b6b; margin-bottom: 3.5mm; }
.inforow { display: flex; justify-content: space-between; font-family: "Noto Sans SC"; font-size: 10pt; }
.rule2 { border-top: 2.2px solid #1a1a1a; border-bottom: 0.6px solid #1a1a1a; height: 2.6px; margin: 1.8mm 0 5mm; }
.sec { display: flex; justify-content: space-between; align-items: baseline; font-family: "Noto Sans SC"; font-weight: 700; font-size: 12.5pt; margin: 5mm 0 2.5mm; }
.sec .pts { font-weight: 400; font-size: 9.5pt; color: #6b6b6b; }
.item { line-height: 2.05; margin-bottom: 2.2mm; }
.item .katex { font-size: 1.06em; }
.indent { margin-left: 7mm; }
.blank { display: inline-block; border-bottom: 1.4px solid #1a1a1a; height: 1em; }
.stripwrap { display: inline-flex; align-items: center; gap: 4mm; margin: 0.4mm 0; }
.cands { font-size: 12.5pt; letter-spacing: 6px; margin: 1mm 0 0 7mm; }
.footer { position: absolute; bottom: 8mm; left: 0; right: 0; text-align: center; font-family: "Noto Sans SC"; font-size: 8.5pt; color: #6b6b6b; }
.ph { font-family: "Noto Sans SC"; font-weight: 700; font-size: 12.5pt; margin: 3.8mm 0 2mm; }
.parent p { line-height: 1.8; margin-bottom: 1.1mm; }
table.cov { border-collapse: collapse; width: 100%; margin: 2mm 0 3mm; font-size: 9.8pt; }
table.cov td, table.cov th { border: 0.7px solid #888; padding: 1.1mm 2.2mm; line-height: 1.5; text-align: left; }
table.cov th { font-family: "Noto Sans SC"; background: #f2efe8; }
.bigq { font-size: 11.5pt; }
`;

const head = `
  <div class="bind"><span>装订线</span></div>
  <div class="eyebrow">小学数学 · 错题探针与补强（分数大小比较）</div>
  <h1 class="title">比大小，先看谁说了算</h1>
  <div class="route">先探一探 → 分母说了算 → 反着填 → 分子说了算 → 防串线 → 错题诊所 → 毕业复测</div>
  <div class="inforow"><span>姓名 ____________</span><span>用时 ______ 分钟</span><span><b>满分 100</b></span></div>
  <div class="rule2"></div>`;

const page1 = `
<div class="page">${head}
  <div class="sec"><span>一、先探一探（这四题是帮你找卡点的）</span><span class="pts">共 20 分</span></div>
  <div class="item">（1）下面两条纸带一样长，涂色的是其中的一份。哪个分数大？把它圈出来。（6 分）</div>
  ${[5, 7].map((n) => `<div class="item indent"><span style="font-family:'Noto Sans SC';font-size:9pt;color:#6b6b6b">纸带</span>&nbsp;&nbsp;${strip(n)}</div>`).join("")}
  <div class="item indent">${F(5)} 和 ${F(7)}，大的是（把上面对应的分数圈出来即可）</div>
  <div class="item" style="margin-top:4mm">（2）${M(`\\dfrac{1}{6}>`)}${FB()}，□ 里能填的数，把对的都圈出来：（6 分）</div>
  <div class="cands">${cands.join(" ")}</div>
  <div class="item" style="margin-top:4mm">（3）还是上一题：□ 里能填 6 吗？（4 分）</div>
  <div class="item indent">能 / 不能（圈一个）。因为填 6 以后，两边就 ${blank("6em")} 了。</div>
  <div class="item" style="margin-top:2mm">（4）这两条纸带都平均分成了 7 份，涂色的份数不同。哪个分数大？把它圈出来。（4 分）</div>
  <div class="item indent">${strip(7, 3)}</div>
  <div class="item indent">${strip(7, 5)}</div>

  <div class="sec" style="margin-top:3mm"><span>二、分母说了算（分子都是 1 的时候）</span><span class="pts">共 22 分</span></div>
  <div class="item">（1）情境题：两块一样大的披萨，一块平均分给 5 个小朋友，一块平均分给 7 个小朋友。每个小朋友分到的披萨，哪一份大？把对的圈出来。（6 分）</div>
  <div class="item indent">5 个小朋友分的那份大　/　7 个小朋友分的那份大</div>
  <div class="item">（2）看图排队：三条一样长的纸带，分的份数不同，涂色的都是一份。给它们从大到小排队。（8 分）</div>
  ${[2, 3, 4].map((n) => `<div class="item indent">${strip(n)}</div>`).join("")}
  <div class="item indent">${blank()} ＞ ${blank()} ＞ ${blank()} <span style="font-family:'Noto Sans SC';font-size:9pt;color:#6b6b6b">（在横线上填 ${M(`\\tfrac{1}{2}`)}、${M(`\\tfrac{1}{3}`)}、${M(`\\tfrac{1}{4}`)}）</span></div>
  <div class="footer">探针与补强 · 第 1 页（共 4 页）</div>
</div>`;

const page2 = `
<div class="page">
  <div class="bind"><span>装订线</span></div>
  <div class="item">（3）脱图比：不看图，直接比，把大的那一个圈出来。（每组 2 分）再填一句话。（2 分）（共 8 分）</div>
  <div class="item indent bigq">${pairsUnit.map(([a, b]) => `${F(a)} 和 ${F(b)}`).join("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;")}</div>
  <div class="item indent">一句话：分子都是 1 的时候，分母越大，这一份越 ${blank("2.6em")}。</div>

  <div class="sec" style="margin-top:7mm"><span>三、反着填：先定范围，再贴边取</span><span class="pts">共 22 分</span></div>
  <div class="item">（1）${M(`\\dfrac{1}{5}>`)}${FB()}（11 分）</div>
  <div class="item indent">第一步：□ 里的数都比 5（ 大 / 小，圈一个）——因为右边的分数要更小，分母就要更大。</div>
  <div class="item indent">第二步：贴着 5 往大数，□ 里最小填 ${blank()}。</div>
  <div class="item" style="margin-top:9mm">（2）${M(`\\dfrac{1}{3}<`)}${FB()}（11 分）</div>
  <div class="item indent">第一步：□ 里的数都比 3（ 大 / 小，圈一个）——因为右边的分数要更大，分母就要更小。</div>
  <div class="item indent">第二步：贴着 3 往小数，□ 里最大填 ${blank()}。</div>
  <div class="sec" style="margin-top:16mm"><span>四、分子说了算（分母相同的时候）</span><span class="pts">共 14 分</span></div>
  <div class="item">（1）情境读数：一块披萨平均切成 7 块。弟弟拿了 3 块，是这块披萨的（${blank("2.2em")}）分之（${blank("2.2em")}）；哥哥拿了 5 块，是这块披萨的（${blank("2.2em")}）分之（${blank("2.2em")}）。（5 分）</div>
  <div class="item">（2）看图比：两条纸带都平均分成了 8 份，涂色的份数不同。哪个分数大？把它圈出来。（4 分）</div>
  <div class="item indent">${strip(8, 3)}</div>
  <div class="item indent">${strip(8, 5)}</div>
  <div class="item">（3）脱图排队：把 ${G(4, 9)}、${G(1, 9)}、${G(5, 9)} 从大到小排队。（5 分）</div>
  <div class="item indent">${blank()} ＞ ${blank()} ＞ ${blank()} <span style="font-family:'Noto Sans SC';font-size:9pt;color:#6b6b6b">（在横线上填上面三个分数）</span></div>

  <div class="footer">探针与补强 · 第 2 页（共 4 页）· 答案在家长页，不要翻</div>
</div>`;

const page3 = `
<div class="page">
  <div class="bind"><span>装订线</span></div>
  <div class="sec" style="margin-top:2mm"><span>五、防串线：先想好看谁，再比</span><span class="pts">共 8 分</span></div>
  <div class="item">每一组先圈「看分子 / 看分母」，再把大的分数圈出来。（每组 2 分）</div>
  ${mixPairs.map(([a, b]) => `<div class="item indent bigq" style="margin-bottom:7.5mm">看分子 / 看分母　　${G(a[0], a[1])} 和 ${G(b[0], b[1])}</div>`).join("")}

  <div class="sec" style="margin-top:14mm"><span>六、错题诊所（原题 + 一个现成的答案，你来当医生）</span><span class="pts">共 8 分</span></div>
  <div class="item">原题：要使 ${M(`\\dfrac{1}{4}<`)}${FB()}，□ 里最大填（ 2 ）。有人就这样填了 2。</div>
  <div class="item indent" style="margin-top:3mm">第一步，代回验一验：填 2 以后，${F(2)} 确实比 ${F(4)} 大，不等式成立。（3 分）</div>
  <div class="item indent">第二步，可是题目问的是「最大」：把 3 代回去试试——${F(3)} 比 ${F(4)}（ 大 / 小，圈一个），也成立。（3 分）</div>
  <div class="item indent">所以 2 不是最大，□ 里最大应该填 ${blank()}。（2 分）</div>

  <div class="sec" style="margin-top:14mm"><span>七、毕业复测</span><span class="pts">每题 2 分，共 6 分</span></div>
  <div class="item">（1）要使 ${M(`\\dfrac{1}{6}>`)}${FB()}，□ 里最小填（ ${blank()} ）。</div>
  <div class="item" style="margin-top:4mm">（2）要使 ${M(`\\dfrac{1}{4}<`)}${FB()}，□ 里最大填（ ${blank()} ）。</div>
  <div class="item" style="margin-top:4mm">（3）${G(3, 7)} 和 ${G(5, 7)}，哪个大？把大的圈出来。</div>
  <div class="footer">探针与补强 · 第 3 页（共 4 页）· 答案在家长页，不要翻</div>
</div>`;

const page4 = `
<div class="page parent" style="font-size:10.5pt">
  <h1 class="title" style="margin-top:2mm">给家长 · 答案与判读</h1>
  <div class="route">这一页请单独收好，不要给孩子看。本卷含诊断性质，判读以第一大题探针为准。</div>
  <div class="rule2"></div>
  <div class="ph">一、答案</div>
  <p>一、探针：（1）${F(5)} 大；（2）圈 ${ANS.P2.join("、")}；（3）不能——填 6 以后两边相等（一样大），不是大于；（4）${G(5, 7)} 大。</p>
  <p>二、（1）${ANS.Q0}；（2）${M(`\\dfrac{1}{2}>\\dfrac{1}{3}>\\dfrac{1}{4}`)}；（3）大的是 ${F(6)}、${F(9)}、${F(3)}；一句话填「小」。</p>
  <p>三、（1）先圈「大」，最小填 ${ANS.S1[1]}；（2）先圈「小」，最大填 ${ANS.S2[1]}。</p>
  <p>四、（1）七分之三、七分之五；（2）${G(5, 8)} 大；（3）${M(`\\dfrac{5}{9}>\\dfrac{4}{9}>\\dfrac{1}{9}`)}。</p>
  <p>五、看分母：${F(4)} 大、${F(3)} 大；看分子：${G(5, 8)} 大、${G(4, 7)} 大。</p>
  <p>六、诊所：填 2 不等式成立，但 2 不是最大；最大填 ${ANS.CLINIC}。七、复测：（1）${ANS.G1}；（2）${ANS.G2}；（3）${G(5, 7)} 大。</p>
  <div class="ph">二、判读树（他卡在哪一层，就从哪一层练起）</div>
  <p>探针（1）错 → 分母与每份大小的反序没建起来：第二大题是主战场（从分披萨情境题开始），这层没过不要进第三大题。</p>
  <p>探针（2）（3）错 → 反演或边界问题：第三大题一步一步练（先圈方向再贴边）；诊所那题重点讲「成立 ≠ 最大」「相等 ≠ 大于」。</p>
  <p>探针（4）错、先看第四大题（1）：读数填错（七分之三写反）→ 先修「认识几分之几」没过，回到读数练；读数对而（4）错 → 同分母规则没建，第四大题做透。</p>
  <p>第二、四大题单项都对，第五大题错 → 两条规则串线：练的不是比较，是比较之前的判断动作——先说「这次看分子还是分母」，再动手。</p>
  <p>毕业复测三题全对，且能说出两条规则各自的条件 → 本节点关闭。</p>
  <div class="ph">三、这份卷子的出处（知识图谱）与走法（CPA）</div>
  <table class="cov">
    <tr><th style="width:26%">图谱节点</th><th style="width:16%">在图谱里</th><th>在本卷哪里</th></tr>
    <tr><td>认识几分之一（cnm_p079）</td><td>先修</td><td>第二大题的情境与纸带：分母＝平分的份数</td></tr>
    <tr><td>认识几分之几（cnm_p226）</td><td>直接先修</td><td>第四大题（1）读数：分子＝取走的份数</td></tr>
    <tr><td>简单的分数大小比较（cnm_p227）</td><td>本案节点</td><td>全卷：两条规则（分子都是 1 看分母、分母相同看分子）＋判别（第五大题）＋原题的反填极值（第三、六、七大题）</td></tr>
    <tr><td>同分母分数的加减法（cnm_p080）</td><td>同单元下一站</td><td>不在本卷；第四大题练熟，就是它的地基</td></tr>
  </table>
  <p>题目顺序按 CPA 的理念排：每个知识点都先情境（分披萨，靠生活经验判断）、再图示（纸带）、最后抽象（脱图比符号）。试卷是纸面考试，不安排动手操作；若某层停下，在家拿真纸条折一折是辅导动作，不占卷面。填完把数代回原题验一验，养成自带检查的习惯。</p>
  <div class="footer">家长页 · 第 4 页（共 4 页）</div>
</div>`;

const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<link rel="stylesheet" href="/home/hatch/workspace/tools/katex/katex.min.css">
<style>${CSS}</style></head><body>${page1}${page2}${page3}${page4}</body></html>`;
writeFileSync(new URL("./probe4.html", import.meta.url), html);
console.log("ANS =", JSON.stringify(ANS));
console.log("html written");
