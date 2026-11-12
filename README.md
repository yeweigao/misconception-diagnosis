# 错题图谱诊断（misconception-diagnosis）

读懂孩子做错的数学题。

孩子错一道题，很少是「这个知识点不会」，更常见的是他有一套自洽的做法，只是某处接错了。这个 skill 让 AI 从一张作业照片里还原那套做法，借课标知识图谱和误解研究定位接错的地方，出一张能把几种解释分开的诊断卷，并给每个孩子维护一份随证据更新的档案。

## 一个循环

1. **读**：从照片里读出孩子的想法，写成几条可检验的猜测。
2. **测**：出一张卷子（学生卷 + 家长页），每道题都预先写下「如果是这样，他会答成什么」。
3. **记**：把看到的、猜的、测出来的写进孩子的档案。卷子做完拍回来，再读一轮。

卷子是实验，档案才是积累。档案的核心是关于孩子的猜测：每条带着支持和反对它的证据、当前状态、下一步怎么测。错题本和知识点掌握情况都是它的不同视图。

三句话撑着整件事：证据定结论，图谱定内容，卷子定真假。

## 仓库结构

| 路径 | 是什么 |
|---|---|
| `SKILL.md` | 给 AI 的说明：怎么读、怎么用图谱、怎么出卷、怎么记，以及几条不做的事 |
| `references/question-patterns.md` | 前几案用过的题型构造和已见的误解模式（想法库，不是配方） |
| `references/learner-record.md` | 孩子档案的格式 |
| `references/taxonomy-source.md` | 两个图谱来源：怎么查、许可、可信度、各自的盲区 |
| `scripts/taxonomy_lookup.py` | 查图谱：两个来源，一套查法 |
| `scripts/paperkit.mjs` | 出卷：答案只进家长页、图谱落点、溢出检查在构建时把关；计分可选 |
| `scripts/learner.py` | 孩子档案：看档案、看错题本、合并新记录 |
| `scripts/learner_map.py` | 知识地图：把档案里的节点状态投到课标图上、推断一圈、画成 HTML |
| `examples/` | 三个已结案的案例（也是 paperkit 的回归测试） |

## 快速开始

图谱数据不随仓库分发，先克隆两个数据源（也可以用环境变量 `CNMT_DATA` / `MARBLE_DATA` 指定其他位置）：

```bash
git clone https://github.com/xiaoyang111222/cn-math-taxonomy ~/workspace/.cn-math-taxonomy
git clone https://github.com/withmarbleapp/os-taxonomy ~/workspace/.os-taxonomy
```

查一个知识点的先修链、后继和误解研究：

```bash
python3 scripts/taxonomy_lookup.py 认识几分之一 --chain --next
python3 scripts/taxonomy_lookup.py --source marble --research "fractions on a number line"
```

出卷需要 Node、本地 KaTeX（默认在 `~/workspace/tools/katex/`，可用 `KATEX_DIR` 另指）和本机 Chromium，全程离线：

```bash
node examples/unit-fraction-extremum/build_worksheet.mjs
```

孩子档案默认放在 `~/Documents/错题图谱/<孩子>/`（可用 `MD_LEARNERS` 另指），不在仓库里：

```bash
python3 scripts/learner.py show <孩子>
python3 scripts/learner.py book <孩子>
python3 scripts/learner.py map <孩子>     # 写出 <孩子>/知识地图.html
```

## 许可与数据来源

- 本 skill 的文本与脚本：MIT。
- cn-math-taxonomy：CC BY-NC 4.0（商用需另行授权），© 其作者。
- Marble os-taxonomy：图数据 ODbL 1.0、文本 CC BY-SA 4.0；引用其误解或教学文本须署名，并以相同许可分发。
- 孩子的作答照片、成品试卷和档案都不进仓库，见各范例目录的 `README.md`。
