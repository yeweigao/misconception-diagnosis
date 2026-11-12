# 错题图谱诊断（misconception-diagnosis）

把一道错题，做成一份能把病治好的卷子。

核心判断：**错题不是某个知识点不会，是知识图谱上有一条边断了、或者接错了。** 本 skill 还原孩子那条自洽但错误的推理链，找到断边，追到上游，再按图谱的依赖顺序出题，把边一条条补回去。

三句话立住整套方法：证据定结论，图谱定内容，卷子定真假。

## 方法（五步）

1. **还原推理链**——先假设孩子的答案是自洽的，一节一节写出他的推理；归因只从答案与作答证据推（含「巧合检验」：错值恰好等于题中另一个正确量 = 角色错接，不是感知错误）。零作答、代笔答案各有读法。
2. **骨架定位**——用 cn-math-taxonomy 定位知识点、达标标准与先修链，顺手查 Marble os-taxonomy 的教学研究作误解候选。
3. **误解层建图**——在课标骨架下面补认知层：细过课标的节点、接错的边、跨界桥；一直追到能用实物当场验证的节点为止。
4. **按图出卷**——范围由图谱定（本案节点的全部达标标准 + 直接先修，后继只在家长页交代衔接）；顺序由依赖与 CPA 定（情境 → 图示 → 抽象）；每卷必含撤支架探针、错题诊所、校验边、迁移 + 毕业题四种固定件；答案只住在独立家长页（附判读树与图谱覆盖表）。
5. **判读与复测**——原题答对且能讲出理由，本案才关闭；新见的误解模式沉淀进题型库。

双源分工：cn-math-taxonomy 管骨架（课标定位、达标标准、先修链、题库，到高中），Marble os-taxonomy 管误解参考（commonMisconceptions、表征层节点）；误解层逐案现场建。两源各自看不见什么，见 `references/taxonomy-source.md`。

## 仓库结构

| 路径 | 是什么 |
|---|---|
| `SKILL.md` | 方法本体：三条立论、证据读法、三层图谱、五步、交付自查、红线 |
| `references/question-patterns.md` | 题型库：补边的七种构造、判读树写法、已见误解模式 |
| `references/taxonomy-source.md` | 两个图谱来源：怎么查、许可、可信度、各自的盲区 |
| `scripts/taxonomy_lookup.py` | 查图谱：两个来源，一套查法 |
| `scripts/paperkit.mjs` | 出卷骨架：图谱覆盖、分值配平、答案分区在构建时强制 |
| `scripts/check_pdf.py` | 出卷 QA：逐页充实度 |
| `examples/` | 两个完整范例 |

## 快速开始

图谱数据不随仓库分发，先克隆两个数据源（也可用环境变量 `CNMT_DATA` / `MARBLE_DATA` 指定其他位置）：

```bash
git clone https://github.com/xiaoyang111222/cn-math-taxonomy ~/workspace/.cn-math-taxonomy
git clone https://github.com/withmarbleapp/os-taxonomy ~/workspace/.os-taxonomy
```

查一个知识点及其先修链、误解候选：

```bash
python3 scripts/taxonomy_lookup.py 认识几分之一 --chain --next
python3 scripts/taxonomy_lookup.py --source marble --research "fractions on a number line"
```

出卷（Node + 本地 KaTeX + 本机 Chromium，全程离线；KaTeX 默认在 `~/workspace/tools/katex/`，可用 `KATEX_DIR` 另指）并检查逐页充实度（依赖 poppler 的 `pdftoppm` 与 Pillow）：

```bash
node examples/unit-fraction-extremum/build_worksheet.mjs
python3 scripts/check_pdf.py examples/unit-fraction-extremum/worksheet.pdf
```

然后让你的 AI 按 `SKILL.md` 的五步执行。两个范例分工：`examples/fraction-1-11/` 管深度（一案到底，追到实物层）；`examples/unit-fraction-extremum/` 管宽度与新证据形态（零作答 + 家长代笔、按图谱全貌出卷）。两份出卷脚本都是新案例的模板：前者是长卷写法，后者是短卷写法。

## 许可与数据来源

- 本 skill 的文本与脚本：MIT。
- cn-math-taxonomy：CC BY-NC 4.0（商用需另行授权），© 其作者。
- Marble os-taxonomy：图数据 ODbL 1.0、文本 CC BY-SA 4.0；引用其误解/教学文本须署名并以相同许可分发。
- 范例中的孩子作答照片与成品试卷按隐私边界未随仓库发布，见各范例目录的 `README.md`。
