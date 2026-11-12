#!/usr/bin/env python3
"""live 档案：把孩子的档案画成一张 3D 知识图谱工作台（单文件 HTML，离线可开）。

  python3 scripts/dashboard.py <孩子>     写出 <孩子>/知识图谱.html
  python3 scripts/learner.py dashboard <孩子>   同上（learner.py 的子命令）
  learner.py add 之后也会自动刷一遍（刷不上只报一声，不挡写档）。

图是 cn-math 数学全图（870 个课标节点＋先修边），不是 topics.json 里的 3421 个点——
其余 2500 多点是语文、英语、科学等学科，不在本 skill 的范围。状态复用 learner_map.infer()，
在全图上跑：亲眼看到的亮，推断的暗一档（与知识地图.html 的虚线框同理）。

布局：年级×学期分层（往上是往高年级），层内按领域分扇区、按章节排角度，
半径抖动由节点 id 的哈希决定——重建时位置不变，页面是固定的，亮起来的地方越长越多。
认知节点（课标以下）挂在锚点课标节点外侧，往紫里偏。

产物只有一个 HTML：数据与 Three.js 打包后的 JS 都内联进去，双击就能开，不需要服务器、
不需要联网。打包后的 JS（dashboard/dashboard.bundle.js）是生成的、提交在仓库里的，
所以用这个脚本只需要 Python；改了 app.js 之后重打 bundle 的办法见 dashboard/README.md。
"""

import hashlib
import json
import math
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import learner  # noqa: E402
import learner_map  # noqa: E402
from taxonomy_lookup import CN, Graph  # noqa: E402

ASSETS = Path(__file__).resolve().parent / "dashboard"
MATH_DOMAINS = ["数与代数", "图形与几何", "统计与概率", "综合与实践"]
SEM = {"上": 0.0, "全": 0.5, "下": 1.0}


def jitter(key: str, salt: str) -> float:
    """id 哈希给出的确定性抖动，[-1, 1)，重建不变。"""
    h = hashlib.md5(f"{key}:{salt}".encode()).hexdigest()
    return (int(h[:8], 16) / 0xFFFFFFFF) * 2 - 1


def build_data(child: str) -> dict:
    graph = Graph(CN)
    record = learner.load(child)
    observed = learner.node_states(record)
    sub0 = learner_map.project(record, graph)  # 只借它的认知节点挂靠

    math_ids = [t["id"] for t in graph.topics.values() if t.get("domain") in MATH_DOMAINS]
    math_set = set(math_ids)
    all_edges = [e for rows in graph.prerequisites.values() for e in rows]
    edges = sorted(
        (e["prerequisiteId"], e["topicId"], e.get("strength", ""))
        for e in all_edges
        if e["prerequisiteId"] in math_set and e["topicId"] in math_set
    )
    sub = {"nodes": math_set,
           "edges": {(a, b, s) for a, b, s in edges},
           "anchors": sub0["anchors"], "observed": observed}
    state = learner_map.infer(sub)

    # ── 布局：年级×学期分层，层内领域扇区 ──
    topics = {i: graph.topics[i] for i in math_ids}
    layer_of = {i: (topics[i].get("grade", 1) - 1) * 2 + SEM.get(topics[i].get("semester"), 0.0)
                for i in math_ids}
    by_layer: dict[float, list[str]] = defaultdict(list)
    for i in math_ids:
        by_layer[layer_of[i]].append(i)
    pos: dict[str, tuple[float, float, float]] = {}
    for layer, ids in by_layer.items():
        y = layer * 7.0
        radius = (34 + layer * 1.8) * min(1.6, max(0.7, math.sqrt(len(ids) / 40)))
        by_dom: dict[str, list[str]] = defaultdict(list)
        for i in ids:
            by_dom[topics[i].get("domain", "")].append(i)
        doms = [d for d in MATH_DOMAINS if d in by_dom] + [d for d in by_dom if d not in MATH_DOMAINS]
        wedge = 2 * math.pi / max(len(doms), 1)
        for di, dom in enumerate(doms):
            group = sorted(by_dom[dom], key=lambda i: (topics[i].get("chapter", ""), i))
            a0 = di * wedge + 0.06
            span = wedge - 0.12
            for k, i in enumerate(group):
                frac = (k + 0.5) / len(group)
                ang = a0 + span * frac + jitter(i, "a") * 0.02
                r = radius * (0.35 + 0.65 * math.sqrt(frac)) * (1 + 0.08 * jitter(i, "r"))
                pos[i] = (r * math.cos(ang), y + 1.2 * jitter(i, "y"), r * math.sin(ang))

    # 认知节点：挂在锚点课标节点外侧，同一锚点扇形散开；
    # 没锚点的（该猜测只挂了认知节点）放到已点亮的课标节点中心旁，不单独飘到天上
    lit_curr = [pos[i] for i in observed if i in pos]
    lit_center = tuple(sum(p[k] for p in lit_curr) / len(lit_curr) for k in range(3)) if lit_curr else (0, 0, 0)
    cog = sorted({n for n in observed if not n.startswith("cn")} |
                 {n for n in sub0["anchors"]})
    fan: dict[str, int] = Counter()
    for n in cog:
        anchors = [a for a in sub0["anchors"].get(n, []) if a in pos]
        if not anchors:
            ax, ay, az = lit_center
            pos[n] = (ax + 16 * jitter(n, "x"), ay + 6 + 3 * jitter(n, "y"), az + 16 * jitter(n, "z"))
            continue
        main = next((a for a in anchors if state.get(a) in learner_map.PROBLEM), anchors[0])
        ax, ay, az = pos[main]
        norm = math.hypot(ax, az) or 1.0
        k = fan[main]
        fan[main] += 1
        spread = (k - 1) * 0.35 + 0.2 * jitter(n, "s")
        dx, dz = ax / norm, az / norm
        ox, oz = dx * math.cos(spread) - dz * math.sin(spread), dx * math.sin(spread) + dz * math.cos(spread)
        pos[n] = (ax + ox * 15, ay + 4.5 + 1.5 * jitter(n, "y"), az + oz * 15)

    degree = Counter()
    for a, b, _ in edges:
        degree[a] += 1
        degree[b] += 1

    nodes = []
    for i in math_ids:
        t = topics[i]
        nodes.append({
            "id": i, "name": t["name"], "grade": t.get("grade"), "sem": t.get("semester"),
            "dom": t.get("domain"), "ch": t.get("chapter", ""), "st": state.get(i, "没碰过"),
            "obs": i in observed, "kind": "c",
            "x": round(pos[i][0], 2), "y": round(pos[i][1], 2), "z": round(pos[i][2], 2),
            "deg": degree.get(i, 0),
        })
    for n in cog:
        nodes.append({
            "id": n, "name": n, "grade": None, "sem": None, "dom": "认知节点",
            "ch": "", "st": state.get(n, "没碰过"), "obs": n in observed, "kind": "g",
            "x": round(pos[n][0], 2), "y": round(pos[n][1], 2), "z": round(pos[n][2], 2),
            "deg": len(sub0["anchors"].get(n, [])),
        })
    index = {n["id"]: k for k, n in enumerate(nodes)}
    out_edges = [[index[a], index[b], 1 if s == "hard" else 0] for a, b, s in edges]
    for n in cog:  # 认知节点 → 锚点的挂线（紫色，强度记 2）
        for a in sub0["anchors"].get(n, []):
            if a in index:
                out_edges.append([index[n], index[a], 2])

    beliefs = [{
        "id": b["id"], "claim": b["claim"], "status": b["status"],
        "nodes": [n for n in b["nodes"] if n in index],
        "next": b.get("next", ""),
        "pro": sum(1 for e in b.get("evidence", []) if e.get("dir") == "支持"),
        "con": sum(1 for e in b.get("evidence", []) if e.get("dir") == "反对"),
    } for b in record["beliefs"]]
    experiments = [{
        "id": e["id"], "date": e["date"], "title": e.get("title", ""),
        "tests": e.get("tests", []), "status": e.get("status", ""),
    } for e in record["experiments"]]
    evidence = {n: s["why"][:4] for n, s in observed.items() if n in index}
    counts = Counter(n["st"] for n in nodes)
    return {
        "child": record["child"].get("name", child),
        "generated": date.today().isoformat(),
        "counts": dict(counts),
        "nodes": nodes, "edges": out_edges,
        "beliefs": beliefs, "experiments": experiments, "evidence": evidence,
    }


def build_dashboard(child: str, verbose: bool = True) -> Path:
    """生成（或刷新）孩子的 live 档案页，返回写出的文件。"""
    data = build_data(child)
    html = (ASSETS / "template.html").read_text(encoding="utf-8")
    html = html.replace("__CHILD__", data["child"]).replace("__DATE__", data["generated"])
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    html = html.replace("<!--DATA-->", f"<script>window.GRAPH_DATA={payload};</script>")
    bundle = (ASSETS / "dashboard.bundle.js").read_text(encoding="utf-8")
    html = html.replace("<!--BUNDLE-->", f"<script>{bundle}</script>")
    out = learner.folder(child) / "知识图谱.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    if verbose:
        lit = sum(v for k, v in data["counts"].items() if k != "没碰过")
        print(f"写出 {out}（{len(data['nodes'])} 个节点，点亮 {lit} 个）")
    return out


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    build_dashboard(sys.argv[1])
