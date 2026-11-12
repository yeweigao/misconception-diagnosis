// 范例三 · 分数比大小：概念在，做题时没被调出来（触发缺失）＋ 排队不回读。
// 证据：同一页三处涂改；家长补充：单独做概念题会，连着做、紧跟「数大的大」之后容易出错（见 CASE.md）。
// 读法：先看图谱（出卷目录），再看参数（答案都从它们算出），然后顺着卷面往下读。
// 运行：node build_worksheet.mjs    （KaTeX 位置见 scripts/paperkit.mjs 顶部）

import { fileURLToPath } from "node:url";
import { Paper, tex, frac, fracBlank, blank, circle, note, big } from "../../scripts/paperkit.mjs";

// ───────── 本案的数学：答案是参数的函数 ─────────
// 分数记作 [分子, 分母]。大小一律交叉相乘判定，不套用卷上要教的规则。

const order = ([a, b], [c, d]) => a * d - c * b;                    // 正：前者大
const larger = (p, q) => (order(p, q) > 0 ? p : q);
const ascending = (list) => [...list].sort(order);
const f = ([a, b]) => frac(a, b);
const chain = (list, sign) => tex(list.map(([a, b]) => `\\dfrac{${a}}{${b}}`).join(sign));
const rising = (list) => chain(ascending(list), "<");
const decides = ([a, b], [c, d]) => (a === c ? "看分母" : b === d ? "看分子" : "—");

// 题组里的一行：整数对 { int: [7, 4] } 或分数对 { fr: [[2, 9], [5, 9]] }
const shown = (row) => (row.int ? row.int.map(String) : row.fr.map(f));
const sign = (row) => {
  const d = row.int ? row.int[0] - row.int[1] : order(...row.fr);
  return d > 0 ? "＞" : d < 0 ? "＜" : "＝";
};
const kind = (row) => (row.int ? "整数" : decides(...row.fr));
const answerOf = (rows) => rows.map((row, i) => `（${i + 1}）${kind(row)}：${shown(row)[0]} ${sign(row)} ${shown(row)[1]}`).join("；");
const CUE = `<span class="note">先圈：整数 / 看分子 / 看分母</span>`;
const rowLine = (row, cue) => `${cue ? CUE + "　　" : ""}${big(`${shown(row)[0]} ${circle()} ${shown(row)[1]}`)}`;
const rowsOf = (rows, cue) => rows.map((row) => rowLine(row, cue));

const slot = () => `（${blank("2.2em")}）分之（${blank("2.2em")}）`;
const slotsOf = (n, s) => Array.from({ length: n }, () => fracBlank()).join(` ${s} `);

// ───────── 图：圆饼（两张分开摆的图，正是原题让他出错的版式）─────────

const PIE = "#c9d8ea";
function pie(n, k = 1, r = 33) {
  const c = r + 2;
  const at = (i) => [c + r * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / n), c + r * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / n)];
  const sectors = Array.from({ length: n }, (_, i) => {
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    return `<path d="M${c},${c} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" ` +
      `fill="${i < k ? PIE : "#fff"}" stroke="#1a1a1a" stroke-width="1.2"/>`;
  }).join("");
  return `<svg class="fig" width="${2 * c}" height="${2 * c}" viewBox="0 0 ${2 * c} ${2 * c}">${sectors}</svg>`;
}
const figure = (svg, caption) => `<div style="display:flex;align-items:center;gap:3mm">${svg}${caption}</div>`;
const side = (...figures) => `<div style="display:flex;align-items:center;gap:26mm">${figures.join("")}</div>`;

// ───────── 参数 ─────────

const concept = { sharers: [2, 5], pies: [[1, 5], [1, 8]], bare: [[1, 7], [1, 10]] };

// 两组交替题组：整数与分数混排，「同分子」紧跟在「同分母」之后——原题就是这样出的错。
// 甲组有「先圈」提示，乙组拿掉提示。原题的 1/3、1/5 留给错题诊所，不在这里用。
const withCue = [
  { int: [7, 4] },
  { fr: [[2, 9], [5, 9]] },
  { fr: [[1, 4], [1, 7]] },        // 同分子，紧跟同分母
  { int: [6, 9] },
  { fr: [[3, 8], [3, 5]] },        // 同分子
  { fr: [[4, 7], [2, 7]] },        // 同分母，防「分母大反而小」用过头
];
const noCue = [
  { fr: [[4, 9], [7, 9]] },
  { fr: [[2, 7], [5, 7]] },
  { fr: [[1, 6], [1, 9]] },        // 同分子，紧跟两道同分母
  { int: [12, 21] },
  { fr: [[3, 10], [3, 8]] },       // 同分子
  { fr: [[5, 6], [1, 6]] },        // 同分母
];
const queue = { scaffold: { items: [[3, 5], [1, 5], [1, 8]], first: [[3, 5], [1, 5]], then: [[1, 5], [1, 8]] }, bare: [[5, 6], [1, 9], [2, 6], [1, 6]] };
const clinic = {
  pies: { a: [1, 3], b: [1, 5], justBefore: [[2, 9], [4, 9]] },                      // 原题 1（2）；他刚做完的是 1（1）的 2/9 ＜ 4/9
  chain: { items: [[3, 4], [1, 5], [1, 4]], given: [[1, 5], [3, 4], [1, 4]] },     // 原题 4：原来排成 1/5 ＜ 3/4 ＜ 1/4
};
const transfer = { a: { split: 8, grow: 3 }, b: { split: 5, grow: 3 } };
const graduation = {
  rows: [{ fr: [[5, 9], [2, 9]] }, { fr: [[5, 6], [5, 8]] }, { int: [31, 13] }, { fr: [[4, 7], [4, 5]] }],
  queue: [[7, 8], [1, 8], [1, 10]],
};

// ───────── 图谱：出卷目录 ─────────

const P = new Paper({ full: 100,
  numbering: "paper",
  gap: 2,
  eyebrow: "小学数学 · 错题诊断与补强（分数比大小）",
  title: "比之前，先停一下",
  route: "先确认概念 → 连着做（有提示）→ 连着做（拿掉提示）→ 排队 → 错题诊所 → 迁移与毕业",
  running: "分数比大小",
}).graph([
  { id: "cnm_p264", name: "平均分（等分）", role: "先修的先修",
    outside: "本卷不重炒：原题里读图写分数全对，没有平均分断掉的证据" },
  { id: "cnm_p079", name: "认识几分之一", role: "先修", where: "分母＝平分的份数，份数多一份，每份就小（单独确认）" },
  { id: "cnm_p226", name: "认识几分之几", role: "直接先修", where: "读数、写分数（诊所与迁移里要写分数）" },
  { id: "cnm_p227", name: "简单的分数大小比较", role: "本案节点（课标）",
    where: "两条规则（分母相同看分子、分子相同看分母）在整数混排里使用" },
  { id: "m1", name: "份越多，每份越小", role: "误解层 · 认知命题", where: "概念在（家长：单独做会）；单独确认，实物上能当场验证" },
  { id: "m2", name: "见到分数先停：比的是每一份，不是数字", role: "误解层 · 缺的边（触发）",
    where: "整数「数大的大」的默认做法抢在前面；卷子让他连着做，先带提示、再拿掉" },
  { id: "m3", name: "按场合选规则（看分子 / 看分母）", role: "误解层 · 规则对判别", where: "混排里先圈再比；并防『分母大反而小』用过头" },
  { id: "m4", name: "排队＝把两两比较串成一条链，并回读", role: "误解层 · 课标以下", where: "排队前后都回读；诊所（二）" },
  { id: "cnm_p080", name: "同分母分数的加减法", role: "同单元后继（p226 的另一个后继）",
    outside: "不在本卷；同分母的『份数多＝多』练熟，就是它的地基" },
]);

P.box(`<b>卷首规矩（每道比大小的题都用）：</b>① 先停一下，问自己：这是整数，还是分数？分数比的是「每一份有多大」，不是数字大小。 ` +
  `② 排队以后，从左到右把相邻的两个读一遍，每一对都要对。`);

// ───────── 一、概念：单独做，应该会（先确认，不教）─────────

const [who2, who5] = concept.sharers;

P.section("先确认一下概念（单独做，不急）", { nodes: ["cnm_p079", "m1"] })
  .q({ pts: 3, ans: `${who2} 个小朋友分的那张` },
    `一样大的两张饼，一张平均分给 ${who2} 个小朋友，一张平均分给 ${who5} 个小朋友。每个小朋友分到的更多的是（ ${who2} 个小朋友分的那张 / ${who5} 个小朋友分的那张 ），圈一个。{分}`)
  .q({ pts: 3, ans: `${f(larger(...concept.pies))} 大` },
    `两块一样大的圆饼，分别平均分成 ${concept.pies[0][1]} 份和 ${concept.pies[1][1]} 份，各取一份。哪个分数大？把它圈出来。{分}`,
    side(...concept.pies.map(([k, n]) => figure(pie(n, k), f([k, n])))))
  .q({ pts: 4, ans: `${f(larger(...concept.bare))} 大；理由：分得份数越少，每一份越大（意思对即可）` },
    `不看图：${concept.bare.map(f).join(" 和 ")}，哪个大？先写一句理由，再把大的圈出来。{分}`,
    `理由：因为${blank("14em")}。`);

// ───────── 二、连着做（有提示）：整数与分数混着来 ─────────

P.section("连着做（一）：先圈，再比", { nodes: ["cnm_p227", "m2", "m3"], intro: "整数、同分母、同分子混在一起，一行一行来。每行先圈「看什么」，再在圆圈里填 ＞ 或 ＜。" })
  .q({ pts: 18, air: 3, ans: answerOf(withCue) },
    "每行 3 分。",
    ...rowsOf(withCue, true))
  .newPage();

// ───────── 三、连着做（拿掉提示）─────────

P.section("连着做（二）：没有提示了", { nodes: ["m2", "m3"], intro: "和上一组一样，只是不再提示。每行动笔之前，先在心里问一句：这次比的是什么？" })
  .q({ pts: 24, air: 5, ans: answerOf(noCue) },
    "每行 4 分。",
    ...rowsOf(noCue, false));

// ───────── 四、排队：把两两比较串成一条链 ─────────

const { scaffold, bare } = queue;

P.section("排队：把两次比较串成一条链", { nodes: ["m4", "cnm_p227"] })
  .q({ pts: 5, ans: `${chain(ascending(scaffold.first), "<")}；${chain(ascending(scaffold.then), "<")}；${rising(scaffold.items)}` },
    `照着框：把 ${scaffold.items.map(f).join("、")} 从小到大排队。{分}`,
    `先比较 ${f(scaffold.first[0])} 和 ${f(scaffold.first[1])} 的大小，得 ${slotsOf(2, "＜")}；`,
    `再比较 ${f(scaffold.then[0])} 和 ${f(scaffold.then[1])} 的大小，得 ${slotsOf(2, "＜")}。`,
    `因此 ${slotsOf(3, "＜")}。`)
  .q({ pts: 8, ans: rising(bare) },
    `自己串：把 ${bare.map(f).join("、")} 从小到大排队，排好后从左到右把每相邻的两个读一遍。{分}`,
    `${slotsOf(4, "＜")}`,
    `读一遍：每相邻的两个都对（ 对 / 不对 ）；全对了才算排好。`);

// ───────── 五、错题诊所：原题 ＋ 小明的答案 ─────────

const c = clinic.pies;
const given = clinic.chain.given;
const [g1, g2, g3] = given;

P.newPage();
P.section("错题诊所（原题 + 小明的答案，你来当医生）", { nodes: ["cnm_p226", "m2", "m4"] })
  .q({ pts: 7, ans: `每一份有多大；${chain([c.b, c.a], "<")}；${c.b[1]} 份的那张每份小，所以 ${f(c.b)} 比 ${f(c.a)} 小；填「每一份有多大」` },
    `（一）原题：看图写分数并比较。小明刚比完 ${f(c.justBefore[0])} ＜ ${f(c.justBefore[1])}（数大的大），接着写了 ${f(c.a)} ＜ ${f(c.b)}。{分}`,
    side(figure(pie(c.a[1], 1), f(c.a)), figure(pie(c.b[1], 1), f(c.b))),
    `（1）这次要比的是（ 分母的数 / 每一份有多大 ），圈一个。（2 分）`,
    `（2）重做：把两张图里涂色的两块比一比，应该写 ${fracBlank()} ${circle()} ${fracBlank()}。（2 分）`,
    `（3）验算：一张饼分成 ${c.b[1]} 份，一张分成 ${c.a[1]} 份，${c.b[1]} 份的那张每一份比 ${c.a[1]} 份的（ 大 / 小 ），所以 ${f(c.b)} 比 ${f(c.a)}（ 大 / 小 ）。（2 分）`,
    `（4）看到分数，动笔前先对自己说：「这次比的是 ${blank("5em")}」。（1 分）`)
  .q({ pts: 5, ans: `第一对对，第二对不对；${rising(clinic.chain.items)}` },
    `（二）原题：把 ${clinic.chain.items.map(f).join("、")} 从小到大排队。小明排成：${chain(given, "<")}。{分}`,
    `（1）从左到右读相邻的两对：${f(g1)} ＜ ${f(g2)} 对吗？（ 对 / 不对 ）　${f(g2)} ＜ ${f(g3)} 对吗？（ 对 / 不对 ）（3 分）`,
    `（2）正确的排法是：${slotsOf(3, "＜")}。（2 分）`);

// ───────── 六、迁移与毕业 ─────────

const ta = transfer.a;
const tb = transfer.b;
const gradRows = graduation.rows;

P.section("迁移与毕业", { nodes: ["m1", "m2", "m3", "m4"] })
  .q({ pts: 5, ans: `甲 ${f([ta.grow, ta.split])}，乙 ${f([tb.grow, tb.split])}；${order([ta.grow, ta.split], [tb.grow, tb.split]) > 0 ? "甲" : "乙"}种得多` },
    `迁移　两块一样大的菜地。甲平均分成 ${ta.split} 块，种了其中 ${ta.grow} 块；乙平均分成 ${tb.split} 块，种了其中 ${tb.grow} 块。哪块地种得多？写出两个分数再比较。{分}`,
    `甲种了 ${fracBlank()}　乙种了 ${fracBlank()}　种得多的是（ 甲 / 乙 ）`)
  .q({ pts: 12, air: 3, ans: answerOf(gradRows) },
    "毕业　整数和分数又混在一起了，没有提示。每行 3 分。",
    ...rowsOf(gradRows, false))
  .q({ pts: 6, ans: rising(graduation.queue) },
    `毕业　把 ${graduation.queue.map(f).join("、")} 从小到大排队：${slotsOf(3, "＜")}。读一遍，每相邻的两个都要对。{分}`);

// ───────── 家长页 ─────────

P.parent("给家长 · 答案与判读", "这一页请单独收好，不要给孩子看。本卷含诊断性质，判读以第二、三大题的对照为准。")
  .heading("一、答案")
  .answers()
  .heading("二、先读这一段：证据与本卷的定位")
  .p("原题页上有三处涂改：① 圆饼题 1/3 ＜ 1/5 改成 1/5 ＜ 1/3；② 数轴题 3/4 ＜ 3/6 改成 3/6 ＜ 3/4；③ 排队题 1/5 ＜ 3/4 ＜ 1/4 改成 1/5 ＜ 1/4 ＜ 3/4。前两处原答案都按分母的数大小排（5 比 3 大、6 比 4 大），第二处和图上左右顺序相反，不是照图抄。")
  .p("家长补充：单独问概念题他会；连着做的时候，容易在前一题刚用过「数大的大」之后出错，隔一道别的题就好些。结合圆饼题恰好紧跟在同分母那一组之后，本卷把毛病定位在「触发」：概念在，做题时没被调出来，整数的默认做法抢在前面。这是推断，不是他当时的想法；第一、二、三大题的对照用来验证。涂改是自己发现的还是被提示的，仍未知。")
  .heading("三、判读树（对照第一、二、三大题）")
  .p("第一大题错 → 概念本身不稳，和家长的说法不符：游戏①，回认识几分之一（cnm_p079）。")
  .p("第一大题对、第二大题（有提示）对、第三大题（拿掉提示）错，尤其错在同分子紧跟同分母那行（第 5 题（3）（5）行）→ 触发缺失：他会，但没提示就不会自己想起来。练的不是概念，是「先停一下」这个动作：游戏②，并把卷首规矩变成他自己的口头禅。")
  .p("第二大题（有提示）也错，且错在同分子 → 连提示都被带跑，先回第一大题的实物（游戏①），再做第二大题。第 4 题（6）行同分母反而答反 → 把「分母大反而小」用过头了，先练按场合选规则。")
  .p("第三大题对 → 触发已经能自己用，看第 11、12 题的毕业；毕业混排再错，回第三大题那一组。")
  .p("第六题（照着框）对、第七题（自己串）错 → 排队依赖那个「先比、再比」的框，串链和回读这一环没建（m4）：游戏③。第 9 题把第一对 1/5 ＜ 3/4 判成「不对」→ 可能把「4 比 5 小」当依据，回第一大题。")
  .newPage()
  .heading("四、陪练：每条边一个实物游戏（各两三分钟）")
  .p("游戏①　一张纸条对折 2、4、8 次，每次涂一份，摞在一起比长短；再问：一个饼请 2 个人、4 个人、8 个人分，谁分到的最多？先说答案，再用纸条验。")
  .p("游戏②　交替翻牌：一副牌里放整数卡（7、4、12）和分数卡（1/4、1/7、2/9、5/9），每次翻两张同类，先说「这是整数，数大的大」或「这是分数，我比的是每一份」，再比。分数卡里放一对同分子，紧跟在一对同分母之后。")
  .p("游戏③　三张卡片 3/5、1/5、1/8，每次只能拿两张比，把比的结果说给你听；然后排成一排，从左到右读一遍，每一对都要对。")
  .heading("五、这份卷子的出处（知识图谱）与走法（CPA）")
  .coverage()
  .p("顺序按依赖与干扰排：概念单独确认 → 混排有提示 → 混排拿掉提示 → 排队串链 → 诊所 → 毕业。概念部分仍按情境 → 图示 → 脱图排。试卷是纸面考试，不安排动手操作；真折真剪、翻牌都在上面的游戏里。")
  .heading("六、收官：原题复测")
  .p("毕业题全对后，隔一两天合上卷子，再问原题三问：（1）1/3 和 1/5（两个圆饼）哪个大？（2）3/6 和 3/4（两条数轴）哪个大？（3）把 3/4、1/5、1/4 从小到大排队。最好把它们夹在两三道整数比大小之间问。三题自己做对，并能讲出「分数比的是每一份有多大」和「排好以后从左到右读一遍」，本案才算关闭，缺一不可。");

P.build(fileURLToPath(new URL("./worksheet", import.meta.url)));
