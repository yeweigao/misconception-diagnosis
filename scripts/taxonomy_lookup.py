#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""查知识图谱：两个来源，一套查法。

  骨架（默认）   cn-math-taxonomy     课标定位、达标标准、先修链、题库（小学到高中）
  误解参考       Marble os-taxonomy   微主题图 + 教学研究（常见误解、教学建议）

用法：
  taxonomy_lookup.py 认识几分之一                 定位：册次、达标标准、题库
  taxonomy_lookup.py cnm_p079 --chain             加先修链（它前面本该会什么）
  taxonomy_lookup.py cnm_p079 --next              加后继（它后面接着学什么）
  taxonomy_lookup.py 比较 --grade 3               同名节点按年级筛
  taxonomy_lookup.py "number line" --source marble                       按英文名查 Marble 节点
  taxonomy_lookup.py "Fractions on a number line" --source marble --research   没有研究记录时也明说

数据不随仓库分发。默认在 ~/workspace/ 下找，也可用环境变量 CNMT_DATA / MARBLE_DATA 指定；
找不到时脚本会给出克隆命令。来源、许可与可信度见 references/taxonomy-source.md。
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator


@dataclass(frozen=True)
class Source:
    """一个图谱来源：去哪找、怎么匹配、追多深。"""

    name: str
    env: str
    homes: tuple[str, ...]   # 默认数据目录，按序尝试
    repo: str
    miss: str                # 查不到时的话
    limit: int               # 最多列几个命中
    depth: int               # 先修链最多追几层
    fold_case: bool          # 名称匹配是否忽略大小写

    def locate(self) -> Path:
        for candidate in (os.environ.get(self.env), *self.homes):
            if candidate and (root := Path(candidate).expanduser()).joinpath("topics.json").exists():
                return root
        clone_to = self.homes[0].removesuffix("/data")
        sys.exit(f"找不到 {self.name} 数据。克隆：git clone --depth 1 {self.repo} {clone_to}")


CN = Source(
    name="cn-math", env="CNMT_DATA",
    homes=("~/workspace/.cn-math-taxonomy/data",),
    repo="https://github.com/xiaoyang111222/cn-math-taxonomy",
    miss="cn-math 里没有匹配「{query}」的知识点。",
    limit=12, depth=6, fold_case=False,
)
MARBLE = Source(
    name="Marble", env="MARBLE_DATA",
    homes=("~/workspace/.os-taxonomy/data", "~/workspace/.kg-bench/os-taxonomy/data"),
    repo="https://github.com/withmarbleapp/os-taxonomy",
    miss="Marble 里没有匹配「{query}」的节点。数学概念用英文名查（如 fraction / number line / length）。",
    limit=10, depth=5, fold_case=True,
)


def records(path: Path, *keys: str) -> list[dict]:
    """读一个 JSON 文件里的记录表：顶层就是列表，或包在某个键下。文件不存在算空表。"""
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        data = next((data[k] for k in keys if isinstance(data.get(k), list)), [])
    return data if isinstance(data, list) else []


def grouped(rows: list[dict], key: str) -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = {}
    for row in rows:
        groups.setdefault(row.get(key), []).append(row)
    return groups


class Graph:
    """一份图谱：节点、先修边，以及挂在节点上的题库与教学研究。两个来源同构，只此一个类。"""

    def __init__(self, source: Source):
        root = source.locate()
        self.source = source
        self.topics = {t["id"]: t for t in records(root / "topics.json", "topics")}
        edges = records(root / "dependencies.json", "dependencies")
        self.prerequisites = grouped(edges, "topicId")
        self.successors = grouped(edges, "prerequisiteId")
        self.questions = grouped(records(root / "questions.json", "questions"), "topicId")
        self.research = {r.get("topicId"): r
                         for r in records(root / "teaching-research.json", "records", "research")}

    def find(self, query: str, grade: int | None = None) -> list[dict]:
        """id 精确命中优先；否则按名称包含匹配，可按年级筛。"""
        if query in self.topics:
            return [self.topics[query]]
        fold = str.lower if self.source.fold_case else str
        hits = [t for t in self.topics.values() if fold(query) in fold(t.get("name", ""))]
        if grade is not None:
            hits = [t for t in hits if t.get("grade") == grade]
        return hits[: self.source.limit]

    def before(self, topic_id: str) -> Iterator[tuple[dict, dict]]:
        """直接先修：(先修节点, 边)。"""
        for edge in self.prerequisites.get(topic_id, []):
            if (topic := self.topics.get(edge["prerequisiteId"])) is not None:
                yield topic, edge

    def after(self, topic_id: str) -> Iterator[tuple[dict, dict]]:
        """直接后继：(后继节点, 边)。"""
        for edge in self.successors.get(topic_id, []):
            if (topic := self.topics.get(edge["topicId"])) is not None:
                yield topic, edge

    def chain(self, topic_id: str) -> Iterator[tuple[int, dict, dict]]:
        """先修链，深度优先：(层深, 先修节点, 边)。每个节点只展开一次。"""
        seen: set[str] = set()

        def walk(current: str, depth: int) -> Iterator[tuple[int, dict, dict]]:
            if current in seen or depth > self.source.depth:
                return
            seen.add(current)
            for topic, edge in self.before(current):
                yield depth, topic, edge
                yield from walk(topic["id"], depth + 1)

        yield from walk(topic_id, 0)


# ───────────────────────── 成文：每个函数只管把一个节点说清楚 ─────────────────────────

def edge_label(topic: dict, edge: dict) -> str:
    return f"{topic['id']} {topic['name']} [{edge.get('strength', '')}]"


def choices_of(question: dict) -> str:
    options = question.get("choices")
    return "｜" + " / ".join(f"{o.get('key')}.{o.get('text')}" for o in options) if options else ""


def neighbour_lines(graph: Graph, topic: dict, args: argparse.Namespace) -> Iterator[str]:
    """先修链与后继——两个来源写法相同。"""
    if args.chain:
        yield "  先修链："
        for depth, prerequisite, edge in graph.chain(topic["id"]):
            yield "   " + "  " * depth + "- " + edge_label(prerequisite, edge)
    if args.next:
        yield "  后继：" + ("；".join(edge_label(t, e) for t, e in graph.after(topic["id"])) or "（无）")


def cn_lines(graph: Graph, topic: dict, args: argparse.Namespace) -> Iterator[str]:
    yield f"\n### {topic['id']} {topic.get('name')}｜{topic.get('grade')} 年级｜{topic.get('chapter', '')}"
    if topic.get("description"):
        yield f"  描述：{topic['description']}"
    for criterion in topic.get("mastery_criteria") or []:
        yield f"  达标标准：{criterion}"
    for question in graph.questions.get(topic["id"], [])[:3]:
        yield f"  题库：{question.get('prompt', '')}{choices_of(question)} → {question.get('answer', '')}"
    yield from neighbour_lines(graph, topic, args)


def marble_lines(graph: Graph, topic: dict, args: argparse.Namespace) -> Iterator[str]:
    age = (f"｜约 {topic['ageRangeStart']}–{topic.get('ageRangeEnd')} 岁"
           if topic.get("ageRangeStart") is not None else "")
    yield f"\n### {topic['id']} {topic.get('name')}｜{topic.get('type')}｜{topic.get('subject')}/{topic.get('domain')}{age}"
    if topic.get("description"):
        yield f"  描述：{topic['description']}"
    for evidence in (topic.get("evidence") or [])[:4]:
        yield f"  达成证据：{evidence}"
    if topic.get("assessmentPrompt"):
        yield f"  测评提示：{topic['assessmentPrompt']}"
    if direct := [edge_label(t, e) for t, e in graph.before(topic["id"])]:
        yield "  直接先修：" + "；".join(direct)
    yield from neighbour_lines(graph, topic, args)
    if record := graph.research.get(topic["id"]):
        pedagogy = record.get("pedagogy", {})
        yield f"  【教学研究】{pedagogy.get('summary', '')[:280]}"
        for misconception in pedagogy.get("commonMisconceptions", []):
            yield f"  常见误解：{misconception}"
        for practice in pedagogy.get("bestPractices", [])[:4]:
            yield f"  教学建议：{practice}"
    elif args.research:
        yield "  【教学研究】该节点暂无研究记录（覆盖约 56% 节点），误解层靠推理链自建。"


VIEWS = {"cn": (CN, cn_lines), "marble": (MARBLE, marble_lines)}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("query", nargs="?", help="节点 id，或名称里的一段（Marble 用英文名）")
    parser.add_argument("--source", choices=VIEWS, default="cn", help="cn＝课标骨架（默认）；marble＝误解参考")
    parser.add_argument("--grade", type=int, help="按年级筛同名节点（骨架）")
    parser.add_argument("--chain", action="store_true", help="列出先修链")
    parser.add_argument("--next", action="store_true", help="列出直接后继")
    parser.add_argument("--research", action="store_true", help="Marble：没有研究记录时也明说")
    args = parser.parse_args()
    if not args.query:
        sys.exit(__doc__)

    source, lines = VIEWS[args.source]
    graph = Graph(source)
    hits = graph.find(args.query, args.grade)
    if not hits:
        print(source.miss.format(query=args.query))
        return
    for topic in hits:
        print("\n".join(lines(graph, topic, args)))


if __name__ == "__main__":
    main()
