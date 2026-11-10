# 图谱双源：cn-math-taxonomy（骨架）+ Marble os-taxonomy（误解参考）

错题图谱诊断的图谱不自建，用两个现成仓库分工。这一页写清各自是什么、怎么查、能信到什么程度、以及各自结构性看不见什么——最后一点最重要。两源用同一个脚本查：`scripts/taxonomy_lookup.py`（默认 cn，`--source marble` 切 Marble，`--research` 带出误解记录）。

## 源一（骨架层）：cn-math-taxonomy

- GitHub：https://github.com/xiaoyang111222/cn-math-taxonomy
- 在线诊断：https://math.pansgo.com/diagnose/ （选题答题，答错沿先修边回溯）
- 图谱浏览：https://math.pansgo.com/explore/
- 许可：**CC BY-NC 4.0**——个人学习、教学、研究免费；商业使用（付费课程、付费 App、机构收费服务）需向作者单独授权。产物若涉商用，先向用户说明。
- 规模（2026-11-10 查证）：数学 870 个知识点（小学 284 / 初中 315 / 高中 271）、数学先修边 1459+ 条、数学题库 3627 道；对齐人教版教材目录 + 《义务教育数学课程标准（2022 年版）》。
- 数据：`data/topics.json`（id/name/grade/chapter/description/mastery_criteria/diagnostic_question/standards）、`data/dependencies.json`（topicId/prerequisiteId/strength=hard|soft/reason）、`data/questions.json`（每点约 2 道，带答案与核验式）。
- 克隆：`git clone --depth 1 https://github.com/xiaoyang111222/cn-math-taxonomy ~/workspace/.cn-math-taxonomy`
- 用法定位：节点 id 与册次写进案例记录；hard 先修链是出题顺序的上限参考；题库可借作骨架层探针（测「技能会不会」），不能当误解层探针（理由见「看不见什么」）。

## 源二（误解参考）：Marble os-taxonomy

- GitHub：https://github.com/withmarbleapp/os-taxonomy （cn-math 的数据格式即源于它，两仓库同构）
- 许可：图数据 **ODbL 1.0**；其撰写文本（节点描述、教学研究）**CC BY-SA 4.0**——引用误解/教学文本须署名 Marble 并以同许可分发，写进要发布的材料前先向用户说明。
- 规模（2026-11-10 查证）：1,858 个微主题（数学 578）、3,994 条先修边、教学研究记录 1,046 条（覆盖约 56% 节点）；只到小学学段（含少量 KS3）。节点分类型：CONCEPTUAL / PROCEDURAL / **REPRESENTATIONAL** / LANGUAGE / META，带年龄段、达成证据（evidence）与操作型测评提示（assessmentPrompt）。
- 数据：`data/topics.json`、`data/dependencies.json`（同构）、`data/teaching-research.json`（records：topicId → pedagogy{summary, bestPractices, keyRepresentations, commonMisconceptions}，多条误解标注 IES 研究出处）。
- 克隆：`git clone --depth 1 https://github.com/withmarbleapp/os-taxonomy ~/workspace/.os-taxonomy`
- 用法定位：第二步顺手查——把概念译成英文名查对应节点（分数数轴类查 "Fractions on a number line" 这种表征节点），commonMisconceptions 作**候选误解清单**与孩子的推理链对照，bestPractices 作教学动作参考。候选不是结论：命中也要靠作答证据升格为假设，再靠卷子探针验。

## 可信度（两源同等对待）

- 两源均为机器构建。cn-math 作者自注：先修关系（hard/soft、某条边该不该存在）需一线教师审核；小学、初中题有自动核验，高中题没有盲解。Marble 的研究记录带来源与置信字段，但覆盖不全且未见独立复核。
- 本 skill 的立场：**两源都是草稿级参考**。引用某条链/某条误解做诊断结论前，用学科常识复核；与孩子的实际作答冲突时，以作答证据为准。

## 各自结构性看不见什么（2026-11-10 同组探针实测，写死防止误用）

**cn-math-taxonomy 看不见误解**（拿范例案 1/11 实测）：

1. 先修链是课内顺序，不是认知顺序。「认识几分之一」（cnm_p079）的先修只有除法的意义（soft）与认识二分之一（hard），再往上是平均分、乘法、连加；本案的病根（0 的起点义、点段不分）在测量 strand，两者之间**零条边**。
2. 没有表征层节点：全图谱没有「数轴」节点，也没有「0＝起点」「点数＝段数＋1」这类课标以下的认知命题。
3. 诊断题是定义背诵型（如「分数的分母表示什么？」）。能背定义不等于能在图上做对；本案孩子大概率通过它的诊断、继续错数轴题。

**Marble 看不见中国课堂**：

1. 对齐的是 Common Core / 英国课纲 / IB 等，没有人教版册次与中国课标条目；节点名为英文，定位与家长沟通仍要回 cn-math 或孩子的课本。
2. 没有题库（只有每节点一句测评提示），也没有初高中。
3. 它的图同样缺跨界边：抽查「Fractions on a number line」的全部先修祖先，测量类为 0——分数↔测量的桥只活在它的研究文本里（「把数轴当尺子数刻度」正是它列的第一误解），不在边里。所以误解层里的跨界桥仍须按个案自建，它给的是误解的**名字与教法**，不是现成的边。

结论：cn-math 负责**定位与排序**（站在哪、前面本该会什么技能、题从哪取材），Marble 负责**病因候选**（这类题孩子通常错在哪、研究上怎么教），误解层负责**确诊与修复**（本案的断边、探针与卷子）。三者缺一不可，只用任何单一来源都会系统性漏掉一整类东西。
