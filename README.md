# 错题图谱诊断（misconception-diagnosis）

把一道错题，做成一份能把病治好的卷子。

核心判断：**错题不是某个知识点不会，是知识图谱上有一条边断了、或者接错了。** 本 skill 的工作是还原孩子那条自洽但错误的推理链，找到断边，追到上游，再按图谱的依赖顺序出题把边一条条补回去。

## 方法（五步）

1. **还原推理链**——先假设孩子的答案是自洽的，一节一节写出他的推理；归因只从答案与作答证据推理（含「巧合检验」：错值恰好等于题中另一个正确量 = 角色错接，不是感知错误）。
2. **骨架定位**——用 cn-math-taxonomy 定位知识点与先修链，顺手查 Marble os-taxonomy 的教学研究作误解候选。
3. **误解层建图**——在课标骨架下面补认知层：细过课标的节点、接错的边、跨界桥；一直追到能用实物当场验证的节点为止。
4. **按序出卷**——出卷目录来自图谱（本案节点的全部达标标准 + 直接先修，后继只在家长页交代衔接），题目顺序按图谱依赖序、每个知识点内部按 CPA（情境→图示→抽象）递进；每卷必含撤支架探针、错题诊所（原题复现）、校验边、迁移 + 毕业题四种固定件；答案只出现在独立家长页（附判读树与图谱覆盖表），学生卷不许出现答案。
5. **判读与复测闭环**——原题答对且能讲出理由，本案才关闭；新见的误解模式沉淀进题型库。

双源分工：cn-math-taxonomy 管骨架（课标定位、先修链、题库，到高中），Marble os-taxonomy 管误解参考（commonMisconceptions、表征层节点）；误解层仍逐案现场建。为什么必须有误解层、两源各自看不见什么，见 `references/taxonomy-source.md`（含实测结论）。

## 快速开始

图谱数据不随仓库分发，先克隆两个数据源（脚本也可用环境变量 `CNMT_DATA` / `MARBLE_DATA` 指定其他位置）：

```bash
git clone https://github.com/xiaoyang111222/cn-math-taxonomy ~/workspace/.cn-math-taxonomy
git clone https://github.com/withmarbleapp/os-taxonomy ~/workspace/.os-taxonomy
```

查一个知识点及其先修链、误解候选：

```bash
python3 scripts/taxonomy_lookup.py 认识几分之一
python3 scripts/taxonomy_lookup.py --source marble --research "fractions on a number line"
```

检查出卷 PDF 的逐页充实度（依赖 poppler 的 `pdftoppm` 与 Pillow）：

```bash
python3 scripts/check_pdf.py 卷子.pdf
```

然后让你的 AI 按 `SKILL.md` 的五步执行。两个完整范例：`examples/fraction-1-11/`（一案到底：原题、推理链、两层图谱、出卷脚本；管「追到实物层」的深度）与 `examples/unit-fraction-extremum/`（零作答 + 家长代笔的证据分工、按图谱全貌出卷、KaTeX 出卷脚本；管覆盖面的宽度）。

## 许可与数据来源

- 本 skill 的文本与脚本：MIT。
- cn-math-taxonomy：CC BY-NC 4.0（商用需另行授权），© 其作者。
- Marble os-taxonomy：图数据 ODbL 1.0、文本 CC BY-SA 4.0；引用其误解/教学文本须署名并以相同许可分发。
- 范例中的孩子作答照片与成品试卷按隐私边界未随仓库发布，见各范例目录的 `README.md`。
