#!/usr/bin/env python3
"""孩子的档案：我们对这个孩子在想什么的理解，跟着证据一起长。

档案是一个 JSON 文件，三样东西：

  猜测 beliefs      关于孩子的一句可检验的话（「混排时把整数的数大的大搬到分母上」），
                    挂在图谱节点上，带支持与反对的证据、当前状态、下一步怎么测。
  看到的 sightings  每一份交来的作业或卷子：哪道题、他写了什么、对不对、看出了什么。
                    错题本就是它按时间排开的样子。
  实验 experiments  每一张出给他的卷子：要检验哪几条猜测，每道题预先写下的预测，
                    收回后的结果。

状态由人（模型）判断，脚本只把住一条：结论要有证据。
  猜测 → 有支持   至少一条支持证据
  测实 / 推翻     至少一条证据来自实验（卷子收回后的结果），猜测要靠卷子定真假
  已解决          原题复测通过，证据同样来自实验

用法：
  learner.py show <孩子>                 看档案：猜测按状态分组、待收回的实验、节点视图
  learner.py book <孩子>                 错题本：按时间看每次交来的作业
  learner.py add  <孩子> <batch.json>    合并一批新记录（格式见 references/learner-record.md）
  learner.py map  <孩子>                 知识地图：节点状态投到课标图上，写出 <孩子>/知识地图.html
  learner.py dashboard <孩子>            live 档案：整份数学图谱的 3D 工作台，写出 <孩子>/知识图谱.html
  learner.py path <孩子>                 打印档案目录

add 之后会自动刷一遍 live 档案（刷不上只报一声，不挡写档；手动刷用 dashboard）。
档案放在 $MD_LEARNERS（默认 ~/Documents/错题图谱）/<孩子>/ 下，不进 skill 仓库。
"""

import json
import os
import sys
from datetime import date
from pathlib import Path

ROOT = Path(os.environ.get("MD_LEARNERS", Path.home() / "Documents" / "错题图谱"))
STATUSES = ["猜测", "有支持", "测实", "推翻", "已解决"]
NEEDS_EXPERIMENT = {"测实", "推翻", "已解决"}


def folder(child: str) -> Path:
    return ROOT / child


def load(child: str) -> dict:
    path = folder(child) / "learner.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {"child": {"name": child}, "beliefs": [], "sightings": [], "experiments": []}


def save(child: str, record: dict) -> Path:
    path = folder(child) / "learner.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


# ── 合并 ──

def merge(record: dict, batch: dict) -> list[str]:
    """把一批记录并进档案；返回做了什么。出错抛 ValueError，档案不落盘。"""
    done = []
    today = date.today().isoformat()
    record["child"].update(batch.get("child", {}))

    experiments = {e["id"]: e for e in record["experiments"]}
    for item in batch.get("experiments", []):
        if item["id"] in experiments:
            experiments[item["id"]].update(item)
            done.append(f"实验 {item['id']} 更新")
        else:
            item.setdefault("date", today)
            item.setdefault("status", "待做")
            record["experiments"].append(item)
            experiments[item["id"]] = item
            done.append(f"实验 {item['id']} 新建")

    for item in batch.get("sightings", []):
        item.setdefault("date", today)
        record["sightings"].append(item)
        done.append(f"看到 {item['date']} {item.get('source', '')}")

    beliefs = {b["id"]: b for b in record["beliefs"]}
    for item in batch.get("beliefs", []):
        evidence = item.pop("evidence", [])
        for e in evidence:
            e.setdefault("date", today)
            if e.get("dir") not in ("支持", "反对"):
                raise ValueError(f"猜测 {item['id']} 的证据要写明 dir：支持 或 反对")
            if e.get("experiment") and e["experiment"] not in experiments:
                raise ValueError(f"证据引用了不存在的实验 {e['experiment']}")
        if item["id"] in beliefs:
            belief = beliefs[item["id"]]
            history = (belief.get("status"), item.get("status"))
            belief.update({k: v for k, v in item.items() if k != "id"})
            belief["evidence"] += evidence
            done.append(f"猜测 {item['id']}：" + ("→".join(filter(None, history)) if history[1] else "补证据"))
        else:
            if "claim" not in item:
                raise ValueError(f"新猜测 {item['id']} 缺 claim（一句可检验的话）")
            item.setdefault("status", "猜测")
            item.setdefault("nodes", [])
            item["evidence"] = evidence
            item.setdefault("since", today)
            record["beliefs"].append(item)
            beliefs[item["id"]] = item
            done.append(f"猜测 {item['id']} 新建（{item['status']}）")

    for belief in record["beliefs"]:
        check(belief)
    return done


def check(belief: dict) -> None:
    status, evidence = belief["status"], belief["evidence"]
    if status not in STATUSES:
        raise ValueError(f"猜测 {belief['id']} 的状态「{status}」不认识；可用：{'、'.join(STATUSES)}")
    if status != "猜测" and not evidence:
        raise ValueError(f"猜测 {belief['id']} 标成「{status}」却没有证据")
    if status == "有支持" and not any(e["dir"] == "支持" for e in evidence):
        raise ValueError(f"猜测 {belief['id']} 标成「有支持」却没有支持它的证据")
    if status in NEEDS_EXPERIMENT and not any(e.get("experiment") for e in evidence):
        raise ValueError(f"猜测 {belief['id']} 标成「{status}」，要有来自实验（收回的卷子）的证据")


# ── 显示 ──

def show(record: dict) -> str:
    lines = [f"# {record['child'].get('name', '')} 的档案"]
    extra = "，".join(f"{k}：{v}" for k, v in record["child"].items() if k != "name")
    if extra:
        lines.append(extra)

    for status in ["有支持", "猜测", "测实", "已解决", "推翻"]:
        group = [b for b in record["beliefs"] if b["status"] == status]
        if not group:
            continue
        lines.append(f"\n## {status}（{len(group)}）")
        for b in group:
            pro = sum(e["dir"] == "支持" for e in b["evidence"])
            con = len(b["evidence"]) - pro
            lines.append(f"- [{b['id']}] {b['claim']}  ·  证据 +{pro} −{con}  ·  节点 {', '.join(b['nodes']) or '—'}")
            if b.get("next") and status in ("猜测", "有支持"):
                lines.append(f"    下一步：{b['next']}")

    pending = [e for e in record["experiments"] if e["status"] != "已回收"]
    if pending:
        lines.append("\n## 待收回的卷子")
        for e in pending:
            lines.append(f"- [{e['id']}] {e['date']} {e.get('title', '')}  ·  检验 {', '.join(e.get('tests', []))}")
            for p in e.get("predictions", []):
                arms = "；".join(f"{k} → {v}" for k, v in p.get("if", {}).items())
                lines.append(f"    {p['item']}：{arms}")

    states = node_states(record)
    if states:
        lines.append("\n## 按节点看（亲眼看到的；图谱推断见 map）")
        order = {s: i for i, s in enumerate(OBSERVED)}
        for node, st in sorted(states.items(), key=lambda kv: (order[kv[1]["state"]], kv[0])):
            lines.append(f"- {node}：{st['state']}  ·  {'；'.join(st['why'])}")
    return "\n".join(lines)


# ── 节点状态：从证据算，不另存 ──

# 亲眼看到的状态，按严重程度排。图谱推断出的状态在 learner_map.py 里，与这些分开标。
OBSERVED = ["问题·测实", "有问题", "存疑", "会·测实", "看到会"]


def node_states(record: dict) -> dict[str, dict]:
    """每个出现过的节点：{state, why}。

    猜测默认描述一个问题；写了 "polarity": "会" 的猜测描述他会什么。
    判断次序：测实的问题 > 有支持的问题 > 悬而未决的猜测 > 测实会（含已解决的问题）
              > 做错了却还没有猜测解释它 > 只见过做对。
    """
    signals: dict[str, dict[str, list[str]]] = {}

    def note(node: str, kind: str, why: str) -> None:
        signals.setdefault(node, {}).setdefault(kind, []).append(why)

    for b in record["beliefs"]:
        positive = b.get("polarity") == "会"
        tag = f"{b['id']}·{b['status']}"
        for node in b["nodes"]:
            if b["status"] == "推翻":
                continue
            if positive:
                note(node, "ok_tested" if b["status"] in ("测实", "已解决") else
                     "ok_seen" if b["status"] == "有支持" else "doubt", tag)
            else:
                note(node, {"测实": "problem_tested", "有支持": "problem", "猜测": "doubt",
                            "已解决": "ok_tested"}[b["status"]], tag)
    for s in record["sightings"]:
        tested = bool(s.get("experiment"))
        for it in s.get("items", []):
            for node in it.get("nodes", []):
                if it.get("correct"):
                    note(node, "ok_tested" if tested else "ok_seen", "对")
                else:
                    note(node, "wrong", "错")

    rules = [("problem_tested", "问题·测实"), ("problem", "有问题"), ("doubt", "存疑"),
             ("ok_tested", "会·测实"), ("wrong", "存疑"), ("ok_seen", "看到会")]
    states = {}
    for node, kinds in signals.items():
        state = next(label for kind, label in rules if kind in kinds)
        why = [f"{w}×{kinds[k].count(w)}" if kinds[k].count(w) > 1 else w
               for k in kinds for w in dict.fromkeys(kinds[k])]
        states[node] = {"state": state, "why": why}
    return states


def book(record: dict) -> str:
    lines = [f"# {record['child'].get('name', '')} 的错题本"]
    for s in sorted(record["sightings"], key=lambda s: s["date"]):
        lines.append(f"\n## {s['date']}  {s.get('source', '')}")
        if s.get("summary"):
            lines.append(s["summary"])
        for it in s.get("items", []):
            mark = "✓" if it.get("correct") else "✗"
            answer = f"  写的：{it['answer']}" if it.get("answer") else ""
            lines.append(f"- {mark} {it['item']}{answer}")
            if it.get("note"):
                lines.append(f"    {it['note']}")
    return "\n".join(lines)


def refresh_dashboard(child: str) -> None:
    """add 之后顺手刷 live 档案。刷不上只报一声：档案已经落盘，页面可以手动再刷。"""
    try:
        from dashboard import build_dashboard
        build_dashboard(child, verbose=False)
        print("  知识图谱已刷新")
    except Exception as error:  # noqa: BLE001 — 任何原因都不能挡写档
        print(f"  （知识图谱没刷上：{error}，跑 learner.py dashboard {child} 手动刷）")


def main(argv: list[str]) -> int:
    if len(argv) < 3 or argv[1] not in ("show", "book", "add", "map", "dashboard", "path"):
        print(__doc__)
        return 2
    command, child = argv[1], argv[2]
    if command == "path":
        print(folder(child))
        return 0
    if command == "dashboard":
        from dashboard import build_dashboard
        build_dashboard(child)
        return 0
    record = load(child)
    if command == "show":
        print(show(record))
    elif command == "book":
        print(book(record))
    elif command == "map":
        from learner_map import infer, project, render
        from taxonomy_lookup import CN, Graph
        sub = project(record, Graph(CN))
        out = folder(child) / "知识地图.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render(record, sub, infer(sub)), encoding="utf-8")
        print(f"写出 {out}（课标节点 {len(sub['nodes'])} 个，认知节点 {len(sub['anchors'])} 个）")
    else:
        if len(argv) < 4:
            print("add 需要一个 batch.json")
            return 2
        batch = json.loads(Path(argv[3]).read_text(encoding="utf-8"))
        try:
            done = merge(record, batch)
        except ValueError as error:
            print(f"没有写入：{error}")
            return 1
        print(f"写入 {save(child, record)}")
        print("\n".join(f"  {d}" for d in done))
        refresh_dashboard(child)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
