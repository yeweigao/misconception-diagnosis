"""孩子的知识地图：把档案里亲眼看到的节点状态投到课标图上，推断一圈，画成一页 HTML。

三件事，各管一段：

  project()   取子图：档案里出现过的课标节点，加上它们的先修（硬边追两层、软边一层）；
              有问题的节点再加直接后继；
              课标以下的认知节点挂在同一条猜测（或同一道题）里的课标节点下面。猜测的 related 节点（相关但本身
              没问题，如把规则「借」过来的整数比大小）也进子图、也挂线，但不产生状态。
  infer()     推断：只给没亲眼看到的节点，且与亲眼看到的分开标。
                做对了的节点，它的硬先修大概率也会         → 推断会
                做错了还没有猜测解释的节点，先查它的直接先修 → 上游待查
                有问题的节点，它的直接后继学起来会受影响      → 可能受影响
              已经有猜测解释的问题不往上游推：病因已经定位，再怀疑上游只会把家长带偏。
  render()    分层排版（先修在左，后继在右），认知节点排在课标层下面；附猜测与待收回的卷子。

推断是给大人看的提示，不是结论：它不进档案，每次从证据重算。
"""

from __future__ import annotations

import html
from collections import defaultdict

from learner import OBSERVED, node_states

INFERRED = ["推断会", "上游待查", "可能受影响"]
STYLE = {  # 状态 → (底色, 字色, 边框, 虚线)
    "问题·测实": ("#b03a2e", "#ffffff", "#b03a2e", False),
    "有问题":   ("#f4c7c0", "#5a1a12", "#b03a2e", False),
    "存疑":     ("#f6e2a6", "#4d3a05", "#b8860b", False),
    "会·测实":  ("#2e7d4f", "#ffffff", "#2e7d4f", False),
    "看到会":   ("#cde9d6", "#123d24", "#2e7d4f", False),
    "推断会":   ("#ffffff", "#123d24", "#2e7d4f", True),
    "上游待查": ("#ffffff", "#4d3a05", "#b8860b", True),
    "可能受影响": ("#ffffff", "#5a1a12", "#b03a2e", True),
    "没碰过":   ("#ffffff", "#666666", "#bbbbbb", False),
}
OK = {"会·测实", "看到会"}
PROBLEM = {"问题·测实", "有问题"}


def is_curriculum(node: str) -> bool:
    return node.startswith("cn")


# ── 取子图 ──

def project(record: dict, graph) -> dict:
    observed = node_states(record)
    related = {n for b in record["beliefs"] for n in b.get("related", []) if n in graph.topics}
    seeds = [n for n in observed if is_curriculum(n) and n in graph.topics]
    nodes: set[str] = set(seeds) | related
    edges: set[tuple[str, str, str]] = set()   # (先修, 后继, 强度)

    def climb(node: str, depth: int) -> None:
        for topic, edge in graph.before(node):
            strength = edge.get("strength", "")
            if strength != "hard" and depth > 0:
                continue
            nodes.add(topic["id"])
            edges.add((topic["id"], node, strength))
            if strength == "hard" and depth < 1:
                climb(topic["id"], depth + 1)

    for seed in seeds:
        climb(seed, 0)
        if observed[seed]["state"] in PROBLEM:   # 后继只对有问题的节点取：看会牵连到什么
            for topic, edge in graph.after(seed):
                nodes.add(topic["id"])
                edges.add((seed, topic["id"], edge.get("strength", "")))
    for a in list(nodes):   # 子图内部本来就有的边也连上
        for topic, edge in graph.before(a):
            if topic["id"] in nodes:
                edges.add((topic["id"], a, edge.get("strength", "")))

    # 认知节点：挂到同一条猜测里的课标节点下
    anchors: dict[str, list[str]] = defaultdict(list)
    groups = [[*b["nodes"], *b.get("related", [])] for b in record["beliefs"]]
    groups += [it.get("nodes", []) for s in record["sightings"] for it in s.get("items", [])]
    for group in groups:
        curriculum = [n for n in group if n in nodes]
        for n in group:
            if not is_curriculum(n):
                for c in curriculum:
                    if c not in anchors[n]:
                        anchors[n].append(c)
    for n in observed:
        if not is_curriculum(n):
            anchors.setdefault(n, [])

    names = {n: graph.topics[n]["name"] for n in nodes}
    linked = {x for a, b, _ in edges for x in (a, b)}
    loose = related - linked - set(seeds)   # 只作为「借来的规则」出现、与子图不连边的课标节点
    return {"nodes": nodes, "edges": edges, "anchors": dict(anchors), "names": names,
            "observed": observed, "loose": loose}


# ── 推断 ──

def infer(sub: dict) -> dict[str, str]:
    observed = {n: s["state"] for n, s in sub["observed"].items()}
    state = dict(observed)
    hard_before = defaultdict(list)
    after = defaultdict(list)
    for a, b, strength in sub["edges"]:
        after[a].append(b)
        if strength == "hard":
            hard_before[b].append(a)

    # 「有问题」的节点已由猜测解释，不往上游推；只有做错了还没解释的「存疑」，才先查上游
    for node, s in observed.items():
        if s == "存疑" and is_curriculum(node):
            for p in hard_before[node]:
                state.setdefault(p, "上游待查")
    for node in (n for n, s in observed.items() if s in PROBLEM):
        for nxt in after[node]:
            state.setdefault(nxt, "可能受影响")

    frontier = [n for n, s in observed.items() if s in OK]
    while frontier:
        node = frontier.pop()
        for p in hard_before[node]:
            if p not in observed and state.get(p) != "推断会":
                state[p] = "推断会"
                frontier.append(p)
    for n in sub["nodes"]:
        state.setdefault(n, "没碰过")
    return state


# ── 画 ──

W, H, GX, GY, PAD = 168, 50, 64, 22, 28


def layers(sub: dict) -> dict[str, int]:
    before = defaultdict(list)
    for a, b, _ in sub["edges"]:
        before[b].append(a)
    memo: dict[str, int] = {}

    def depth(n: str, trail=()) -> int:
        if n not in memo:
            memo[n] = 0 if n in trail else 1 + max((depth(p, trail + (n,)) for p in before[n]), default=-1)
        return memo[n]

    return {n: depth(n) for n in sub["nodes"]}


def render(record: dict, sub: dict, state: dict[str, str]) -> str:
    rank = layers(sub)
    columns: dict[int, list[str]] = defaultdict(list)
    for n in sorted(sub["nodes"] - sub["loose"], key=lambda n: (rank[n], n)):
        columns[rank[n]].append(n)
    pos = {}
    for col, ns in columns.items():
        for row, n in enumerate(ns):
            pos[n] = (PAD + col * (W + GX), PAD + 16 + row * (H + GY))
    top_band = PAD + 16 + max((len(v) for v in columns.values()), default=1) * (H + GY) + 30

    # 认知节点：排在所挂课标节点的下方，同一列依次往下，有问题的排在前面
    severity = {s: i for i, s in enumerate(OBSERVED)}
    stack: dict[int, int] = defaultdict(int)
    first_seen = {n: i for i, b in reversed(list(enumerate(record["beliefs"]))) for n in b["nodes"]}
    for n, anchor in sorted(sub["anchors"].items(),
                            key=lambda kv: (severity.get(state.get(kv[0]), 9), first_seen.get(kv[0], 99), kv[0])):
        main = [a for a in anchor if a not in sub["loose"]]
        primary = next((a for a in main if state.get(a) in PROBLEM), main[0] if main else None)
        col = rank[primary] if primary else 0
        pos[n] = (PAD + col * (W + GX), top_band + stack[col] * (H + GY))
        stack[col] += 1
    # 借来规则的课标节点：放在它所牵连的认知节点左边一格，读作「从这里借了规则过来」
    for r in sorted(sub["loose"]):
        host = next((n for n, anchor in sub["anchors"].items() if r in anchor), None)
        x, y = pos[host] if host else (PAD, top_band)
        pos[r] = (max(PAD, x - (W + GX)), y)

    width = max(x for x, _ in pos.values()) + W + PAD + 48
    height = max(y for _, y in pos.values()) + H + PAD

    svg = [f'<svg viewBox="0 0 {width} {height}" width="{width}" xmlns="http://www.w3.org/2000/svg">',
           '<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
           'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#999"/></marker></defs>']
    if sub["anchors"]:
        band_x = min(pos[n][0] for n in sub["anchors"])
        svg.append(f'<text x="{band_x}" y="{top_band - 10}" class="band">课标以下的认知节点（本档案里建的）</text>')
    for a, b, strength in sorted(sub["edges"]):
        (x1, y1), (x2, y2) = pos[a], pos[b]
        dash = ' stroke-dasharray="4 4"' if strength != "hard" else ""
        if rank[b] - rank[a] > 1:   # 跨列的边从节点上方绕过去，不穿过中间的节点
            lift = min(y1, y2) - 14
            d = f"M{x1 + W / 2},{y1} C{x1 + W / 2},{lift} {x2 + W / 2},{lift} {x2 + W / 2},{y2}"
        else:
            d = f"M{x1 + W},{y1 + H / 2} C{x1 + W + GX / 2},{y1 + H / 2} {x2 - GX / 2},{y2 + H / 2} {x2},{y2 + H / 2}"
        svg.append(f'<path d="{d}" fill="none" stroke="#999" stroke-width="1.2"{dash} marker-end="url(#arr)"/>')
    for n, anchor in sub["anchors"].items():
        x2, y2 = pos[n]
        for a in anchor:
            x1, y1 = pos[a]
            if a in sub["loose"]:
                svg.append(f'<line x1="{x1 + W}" y1="{y1 + H / 2}" x2="{x2}" y2="{y2 + H / 2}" stroke="#7a6cae" '
                           f'stroke-width="1.2" stroke-dasharray="2 3" marker-end="url(#arr)"/>')
                continue
            # 从课标节点右下角出发，绕到认知节点右侧进去：竖排的几个认知节点各走各的线，不互相穿过
            bow = 18 + (y2 - y1) * 0.12
            svg.append(f'<path d="M{x1 + W - 14},{y1 + H} C{x1 + W + bow},{y1 + H + 24} {x2 + W + bow},{y2 + H / 2} '
                       f'{x2 + W},{y2 + H / 2}" fill="none" stroke="#7a6cae" stroke-width="1.2" stroke-dasharray="2 3"/>')
    for n, (x, y) in pos.items():
        s = state.get(n, "没碰过")
        fill, ink, line, dashed = STYLE[s]
        name = sub["names"].get(n, n)
        sub_label = f"{n} · {s}" if is_curriculum(n) else s
        dash = ' stroke-dasharray="5 3"' if dashed else ""
        svg.append(f'<g><title>{html.escape(name)}（{n}）：{s}</title>'
                   f'<rect x="{x}" y="{y}" width="{W}" height="{H}" rx="7" fill="{fill}" stroke="{line}" '
                   f'stroke-width="1.6"{dash}/>'
                   f'<text x="{x + W / 2}" y="{y + 21}" fill="{ink}" class="name">{html.escape(clip(name))}</text>'
                   f'<text x="{x + W / 2}" y="{y + 38}" fill="{ink}" class="meta">{html.escape(sub_label)}</text></g>')
    svg.append("</svg>")

    legend = "".join(
        f'<span class="key"><i style="background:{STYLE[s][0]};border:1.6px {"dashed" if STYLE[s][3] else "solid"} '
        f'{STYLE[s][2]}"></i>{s}</span>' for s in OBSERVED + INFERRED + ["没碰过"])

    beliefs = "".join(
        f'<tr><td>{b["id"]}</td><td><b>{b["status"]}</b></td><td>{html.escape(b["claim"])}'
        + (f'<div class="next">下一步：{html.escape(b["next"])}</div>' if b.get("next") and b["status"] in ("猜测", "有支持") else "")
        + "</td></tr>" for b in record["beliefs"])
    pending = "".join(
        f'<li>{e["date"]}《{html.escape(e.get("title", ""))}》检验 {", ".join(e.get("tests", []))}</li>'
        for e in record["experiments"] if e.get("status") != "已回收")

    name = html.escape(record["child"].get("name", ""))
    return f"""<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>{name} 的知识地图</title><style>
:root {{ --ink:#1d1d1f; --mute:#6b6b70; --rule:#e2e2e6; --bg:#fafaf8; }}
body {{ margin:0; background:var(--bg); color:var(--ink);
  font-family:"PingFang SC","Noto Sans CJK SC","Source Han Sans SC","Microsoft YaHei",sans-serif; }}
main {{ max-width:1200px; margin:0 auto; padding:28px 16px 48px; }}
h1 {{ font-size:22px; margin:0 0 4px; }} h2 {{ font-size:16px; margin:28px 0 8px; }}
.sub {{ color:var(--mute); font-size:13px; margin-bottom:16px; }}
.legend {{ display:flex; flex-wrap:wrap; gap:6px 16px; font-size:12.5px; color:var(--mute); margin:8px 0 12px; }}
.key i {{ display:inline-block; width:18px; height:12px; border-radius:3px; vertical-align:-2px; margin-right:5px; }}
.map {{ overflow-x:auto; background:#fff; border:1px solid var(--rule); border-radius:10px; padding:4px; }}
svg {{ display:block; max-width:none; }}
svg .name {{ font-size:13px; font-weight:600; text-anchor:middle; }}
svg .meta {{ font-size:10.5px; text-anchor:middle; opacity:.85; }}
svg .band {{ font-size:12px; fill:#7a6cae; }}
table {{ border-collapse:collapse; width:100%; font-size:13.5px; background:#fff; }}
td {{ border-top:1px solid var(--rule); padding:7px 8px; vertical-align:top; }}
td:first-child {{ color:var(--mute); width:3em; }} td:nth-child(2) {{ width:4.5em; }}
.next {{ color:var(--mute); font-size:12.5px; margin-top:2px; }}
.note {{ color:var(--mute); font-size:12.5px; line-height:1.6; }}
</style></head><body><main>
<h1>{name} 的知识地图</h1>
<div class="sub">实心是亲眼看到的，虚线框是从课标图推断的。推断只是提示，每次从档案重算。</div>
<div class="legend">{legend}</div>
<div class="map">{"".join(svg)}</div>
<h2>关于他的猜测</h2><table>{beliefs}</table>
{f"<h2>待收回的卷子</h2><ul>{pending}</ul>" if pending else ""}
<p class="note">课标节点与先修关系来自 cn-math-taxonomy（CC BY-NC 4.0）。箭头从先修指向后学，实线是硬依赖，虚线是软依赖；紫色点线把认知节点挂到相关的课标节点上。</p>
</main></body></html>
"""


def clip(text: str, limit: int = 11) -> str:
    return text if len(text) <= limit else text[: limit - 1] + "…"
