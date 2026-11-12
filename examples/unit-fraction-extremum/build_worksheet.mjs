// 范例二 · 探针补强卷：单位分数反填极值（零作答 + 家长代笔）。
// 读法：先看图谱（出卷目录），再看参数（答案都从它们算出），然后顺着卷面往下读。
// 运行：node build_worksheet.mjs    （KaTeX 位置见 scripts/paperkit.mjs 顶部）

import { fileURLToPath } from "node:url";
import { Paper, tex, frac, fracBox, blank, note, big, candidates, strip } from "../../scripts/paperkit.mjs";

// ───────── 本案的数学：答案是参数的函数 ─────────

const unitMax = (...dens) => frac(1, Math.min(...dens));        // 分子都是 1：分母小的那个大
const sameDenMax = (den, ...nums) => frac(Math.max(...nums), den); // 分母相同：分子大的那个大
const descending = (fracs) => tex(fracs.map(([a, b]) => `\\dfrac{${a}}{${b}}`).join(">"));
const cloze = (den, rel) => `${tex(`\\dfrac{1}{${den}}${rel}`)}${fracBox()}`;  // 1/den rel 1/□

/** 反填极值：1/den rel 1/□ 时，□ 在 den 的哪一侧、贴边取到几。 */
const extremum = (den, rel) => rel === ">"
  ? { side: "大", edge: den + 1, word: "最小", right: "小", so: "大" }
  : { side: "小", edge: den - 1, word: "最大", right: "大", so: "小" };

const HAN = "零一二三四五六七八九";
const spoken = (num, den) => `${HAN[den]}分之${HAN[num]}`;
const larger = ([a, b], [c, d]) => (a / b > c / d ? [a, b] : [c, d]);
const decides = ([a], [c]) => (a === c ? "分母" : "分子"); // 分子相同看分母；否则分母相同，看分子

// ───────── 参数 ─────────

const probe = { strips: [5, 7], den: 6, pool: [3, 5, 6, 7, 9, 12], same: { den: 7, nums: [3, 5] } };
const unit = { sharers: [5, 7], strips: [2, 3, 4], pairs: [[8, 6], [9, 12], [3, 5]] };
const reverse = [[5, ">"], [3, "<"]];
const same = {
  pizza: { den: 7, nums: [3, 5] },
  strips: { den: 8, nums: [3, 5] },
  order: { den: 9, nums: [4, 1, 5] },
};
const mixed = [[[1, 6], [1, 4]], [[3, 8], [5, 8]], [[2, 7], [4, 7]], [[1, 8], [1, 3]]];
const clinic = { den: 4, rel: "<", given: 2 };  // 病人：家长代笔的错答
const original = [[6, ">"], [4, "<"]];          // 原题两问
const final = { den: 7, nums: [3, 5] };         // 毕业复测第三问

// ───────── 图谱：出卷目录 ─────────

const P = new Paper({
  eyebrow: "小学数学 · 错题探针与补强（分数大小比较）",
  title: "比大小，先看谁说了算",
  route: "先探一探 → 分母说了算 → 反着填 → 分子说了算 → 防串线 → 错题诊所 → 毕业复测",
  running: "探针与补强",
}).graph([
  { id: "cnm_p079", name: "认识几分之一", role: "先修", where: "情境与纸带，分母＝平分的份数" },
  { id: "cnm_p226", name: "认识几分之几", role: "直接先修", where: "第（1）题读数，分子＝取走的份数" },
  { id: "cnm_p227", name: "简单的分数大小比较", role: "本案节点",
    where: "两条规则（分子都是 1 看分母、分母相同看分子）＋判别（第五大题）＋原题的反填极值（第三、六、七大题）" },
  { id: "cnm_p080", name: "同分母分数的加减法", role: "同单元下一站", outside: "不在本卷；第四大题练熟，就是它的地基" },
]);

// ───────── 一、探针 ─────────

P.section("先探一探（这四题是帮你找卡点的）", { nodes: ["cnm_p227"] })
  .q({ pts: 6, ans: `${unitMax(...probe.strips)} 大` },
    "下面两条纸带一样长，涂色的是其中的一份。哪个分数大？把它圈出来。{分}",
    ...probe.strips.map((n) => `${note("纸带")}&nbsp;&nbsp;${strip(n)}`),
    `${probe.strips.map((n) => frac(1, n)).join(" 和 ")}，大的是（把上面对应的分数圈出来即可）`)
  .space(0.8)
  .q({ pts: 6, ans: `圈 ${probe.pool.filter((v) => v > probe.den).join("、")}` },
    `${cloze(probe.den, ">")}，□ 里能填的数，把对的都圈出来：{分}`,
    candidates(probe.pool))
  .space(0.8)
  .q({ pts: 4, ans: `不能——填 ${probe.den} 以后两边相等（一样大），不是大于` },
    `还是上一题：□ 里能填 ${probe.den} 吗？{分}`,
    `能 / 不能（圈一个）。因为填 ${probe.den} 以后，两边就 ${blank("6em")} 了。`)
  .q({ pts: 4, ans: `${sameDenMax(probe.same.den, ...probe.same.nums)} 大` },
    `这两条纸带都平均分成了 ${probe.same.den} 份，涂色的份数不同。哪个分数大？把它圈出来。{分}`,
    ...probe.same.nums.map((k) => strip(probe.same.den, k)));

// ───────── 二、分母说了算：情境 → 图示 → 抽象 ─────────

P.section("分母说了算（分子都是 1 的时候）", { nodes: ["cnm_p079", "cnm_p227"] })
  .q({ pts: 6, ans: `${Math.min(...unit.sharers)} 人分的那份大` },
    `情境题：两块一样大的披萨，一块平均分给 ${unit.sharers[0]} 个小朋友，一块平均分给 ${unit.sharers[1]} 个小朋友。每个小朋友分到的披萨，哪一份大？把对的圈出来。{分}`,
    unit.sharers.map((n) => `${n} 个小朋友分的那份大`).join("　/　"))
  .q({ pts: 8, ans: descending(unit.strips.map((n) => [1, n])) },
    "看图排队：三条一样长的纸带，分的份数不同，涂色的都是一份。给它们从大到小排队。{分}",
    ...unit.strips.map((n) => strip(n)),
    `${blank()} ＞ ${blank()} ＞ ${blank()} ${note(`（在横线上填 ${unit.strips.map((n) => tex(`\\tfrac{1}{${n}}`)).join("、")}）`)}`)
  .newPage()
  .q({ pts: 8, ans: `大的是 ${unit.pairs.map((pair) => unitMax(...pair)).join("、")}；一句话填「小」` },
    "脱图比：不看图，直接比，把大的那一个圈出来。（每组 2 分）再填一句话。（2 分）（共 8 分）",
    big(unit.pairs.map(([a, b]) => `${frac(1, a)} 和 ${frac(1, b)}`).join("&nbsp;".repeat(6))),
    `一句话：分子都是 1 的时候，分母越大，这一份越 ${blank("2.6em")}。`);

// ───────── 三、反着填：定范围 → 贴边取 ─────────

P.space(2).section("反着填：先定范围，再贴边取", { nodes: ["cnm_p227"] });
for (const [den, rel] of reverse) {
  const x = extremum(den, rel);
  P.q({ pts: 11, ans: `先圈「${x.side}」，${x.word}填 ${x.edge}` },
    `${cloze(den, rel)}{分}`,
    `第一步：□ 里的数都比 ${den}（ 大 / 小，圈一个）——因为右边的分数要更${x.right}，分母就要更${x.so}。`,
    `第二步：贴着 ${den} 往${x.side}数，□ 里${x.word}填 ${blank()}。`)
    .space(6.8);
}

// ───────── 四、分子说了算：情境 → 图示 → 抽象 ─────────

const { pizza, strips, order } = same;
const slot = `（${blank("2.2em")}）分之（${blank("2.2em")}）`;

P.space(2.2).section("分子说了算（分母相同的时候）", { nodes: ["cnm_p226", "cnm_p227"] })
  .q({ pts: 5, ans: pizza.nums.map((k) => spoken(k, pizza.den)).join("、") },
    `情境读数：一块披萨平均切成 ${pizza.den} 块。弟弟拿了 ${pizza.nums[0]} 块，是这块披萨的${slot}；哥哥拿了 ${pizza.nums[1]} 块，是这块披萨的${slot}。{分}`)
  .q({ pts: 4, ans: `${sameDenMax(strips.den, ...strips.nums)} 大` },
    `看图比：两条纸带都平均分成了 ${strips.den} 份，涂色的份数不同。哪个分数大？把它圈出来。{分}`,
    ...strips.nums.map((k) => strip(strips.den, k)))
  .q({ pts: 5, ans: descending([...order.nums].sort((a, b) => b - a).map((n) => [n, order.den])) },
    `脱图排队：把 ${order.nums.map((n) => frac(n, order.den)).join("、")} 从大到小排队。{分}`,
    `${blank()} ＞ ${blank()} ＞ ${blank()} ${note("（在横线上填上面三个分数）")}`)
  .newPage();

// ───────── 五、防串线 ─────────

const verdicts = (by) => mixed.filter((pair) => decides(...pair) === by)
  .map((pair) => `${frac(...larger(...pair))} 大`).join("、");

P.section("防串线：先想好看谁，再比", { nodes: ["cnm_p227"] })
  .q({ pts: 8, air: 7.5, ans: `看分母：${verdicts("分母")}；看分子：${verdicts("分子")}` },
    "每一组先圈「看分子 / 看分母」，再把大的分数圈出来。（每组 2 分）",
    ...mixed.map(([a, b]) => big(`看分子 / 看分母　　${frac(...a)} 和 ${frac(...b)}`)));

// ───────── 六、错题诊所：病人是代笔的现成错答 ─────────

const cure = extremum(clinic.den, clinic.rel);

P.space(6).section("错题诊所（原题 + 一个现成的答案，你来当医生）", { nodes: ["cnm_p227"] })
  .q({ pts: 8, ans: `填 ${clinic.given} 不等式成立，但 ${clinic.given} 不是${cure.word}；${cure.word}填 ${cure.edge}` },
    `原题：要使 ${cloze(clinic.den, clinic.rel)}，□ 里${cure.word}填（ ${clinic.given} ）。有人就这样填了 ${clinic.given}。`,
    `第一步，代回验一验：填 ${clinic.given} 以后，${frac(1, clinic.given)} 确实比 ${frac(1, clinic.den)} 大，不等式成立。（3 分）`,
    `第二步，可是题目问的是「${cure.word}」：把 ${cure.edge} 代回去试试——${frac(1, cure.edge)} 比 ${frac(1, clinic.den)}（ 大 / 小，圈一个），也成立。（3 分）`,
    `所以 ${clinic.given} 不是${cure.word}，□ 里${cure.word}应该填 ${blank()}。（2 分）`);

// ───────── 七、毕业复测：原题去掉脚手架 ─────────

P.space(8).section("毕业复测", { nodes: ["cnm_p227"], note: "每题 2 分" });
for (const [den, rel] of original) {
  const x = extremum(den, rel);
  P.q({ pts: 2, ans: `${x.edge}` }, `要使 ${cloze(den, rel)}，□ 里${x.word}填（ ${blank()} ）。`).space(1.8);
}
P.q({ pts: 2, ans: `${sameDenMax(final.den, ...final.nums)} 大` },
  `${final.nums.map((n) => frac(n, final.den)).join(" 和 ")}，哪个大？把大的圈出来。`);

// ───────── 家长页 ─────────

P.parent("给家长 · 答案与判读", "这一页请单独收好，不要给孩子看。本卷含诊断性质，判读以第一大题探针为准。")
  .heading("一、答案")
  .answers()
  .heading("二、判读树（他卡在哪一层，就从哪一层练起）")
  .p("探针（1）错 → 分母与每份大小的反序没建起来：第二大题是主战场（从分披萨情境题开始），这层没过不要进第三大题。")
  .p("探针（2）（3）错 → 反演或边界问题：第三大题一步一步练（先圈方向再贴边）；诊所那题重点讲「成立 ≠ 最大」「相等 ≠ 大于」。")
  .p("探针（4）错、先看第四大题（1）：读数填错（七分之三写反）→ 先修「认识几分之几」没过，回到读数练；读数对而（4）错 → 同分母规则没建，第四大题做透。")
  .p("第二、四大题单项都对，第五大题错 → 两条规则串线：练的不是比较，是比较之前的判断动作——先说「这次看分子还是分母」，再动手。")
  .p("毕业复测三题全对，且能说出两条规则各自的条件 → 本节点关闭。")
  .heading("三、这份卷子的出处（知识图谱）与走法（CPA）")
  .coverage()
  .p("题目顺序按 CPA 的理念排：每个知识点都先情境（分披萨，靠生活经验判断）、再图示（纸带）、最后抽象（脱图比符号）。试卷是纸面考试，不安排动手操作；若某层停下，在家拿真纸条折一折是辅导动作，不占卷面。填完把数代回原题验一验，养成自带检查的习惯。");

P.build(fileURLToPath(new URL("./worksheet", import.meta.url)));
