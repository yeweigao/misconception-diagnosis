#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""查知识图谱，双源分工：
- 骨架定位（默认 cn）：cn-math-taxonomy —— 中文名、人教版册次、先修链、题库，覆盖小学到高中。
- 误解参考（--source marble）：Marble os-taxonomy —— 微主题图 + 教学研究（常见误解/教学建议）。

数据定位：cn → $CNMT_DATA / ~/workspace/.cn-math-taxonomy/data
          marble → $MARBLE_DATA / ~/workspace/.os-taxonomy/data / ~/workspace/.kg-bench/os-taxonomy/data
缺数据时克隆（见 references/taxonomy-source.md）。

用法：
  taxonomy_lookup.py 认识几分之一              # cn：定位 + 题库
  taxonomy_lookup.py cnm_p079 --chain          # cn：+ 先修链
  taxonomy_lookup.py "number line" --source marble            # Marble：按英文名查节点
  taxonomy_lookup.py "Fractions on a number line" --source marble --research  # + 常见误解与教学建议
"""
import json, os, sys

def find_dir(env, cands, fname):
    for d in [os.environ.get(env)] + cands:
        if d and os.path.exists(os.path.join(d, fname)):
            return d
    return None

def load(d, f):
    return json.load(open(os.path.join(d, f), encoding="utf-8"))

def unwrap(x, *keys):
    if isinstance(x, dict):
        for k in keys:
            if isinstance(x.get(k), list):
                return x[k]
    return x if isinstance(x, list) else []

def cn(args, chain, grade):
    d = find_dir("CNMT_DATA", [os.path.expanduser("~/workspace/.cn-math-taxonomy/data")], "topics.json")
    if not d:
        sys.exit("找不到 cn-math 数据。克隆：git clone --depth 1 "
                 "https://github.com/xiaoyang111222/cn-math-taxonomy ~/workspace/.cn-math-taxonomy")
    T = unwrap(load(d, "topics.json"), "topics")
    D = unwrap(load(d, "dependencies.json"), "dependencies")
    Q = unwrap(load(d, "questions.json"), "questions") if os.path.exists(os.path.join(d, "questions.json")) else []
    byid = {t["id"]: t for t in T}
    pre = {}
    for e in D:
        pre.setdefault(e["topicId"], []).append(e)
    qby = {}
    for x in Q:
        qby.setdefault(x.get("topicId"), []).append(x)
    q = args[0]
    if q in byid:
        hits = [byid[q]]
    else:
        hits = [t for t in T if q in t.get("name", "")]
        if grade is not None:
            hits = [t for t in hits if t.get("grade") == grade]
    if not hits:
        print(f"cn-math 里没有匹配「{q}」的知识点。")
        return
    for t in hits[:12]:
        print(f"\n### {t['id']} {t.get('name')}｜{t.get('grade')} 年级｜{t.get('chapter','')}")
        if t.get("description"):
            print(f"  描述：{t['description']}")
        for x in qby.get(t["id"], [])[:3]:
            ch = ""
            if x.get("choices"):
                ch = "｜" + " / ".join(f"{c.get('key')}.{c.get('text')}" for c in x["choices"])
            print(f"  题库：{x.get('prompt','')}{ch} → {x.get('answer','')}")
        if chain:
            seen = set()
            def walk(tid, depth):
                if tid in seen or depth > 6:
                    return
                seen.add(tid)
                for e in pre.get(tid, []):
                    p = byid.get(e["prerequisiteId"])
                    if p:
                        print("   " + "  " * depth + f"- {p['name']} [{e.get('strength','')}]")
                        walk(e["prerequisiteId"], depth + 1)
            print("  先修链：")
            walk(t["id"], 0)

def marble(args, chain, research):
    d = find_dir("MARBLE_DATA", [os.path.expanduser("~/workspace/.os-taxonomy/data"),
                                 os.path.expanduser("~/workspace/.kg-bench/os-taxonomy/data")], "topics.json")
    if not d:
        sys.exit("找不到 Marble 数据。克隆：git clone --depth 1 "
                 "https://github.com/withmarbleapp/os-taxonomy ~/workspace/.os-taxonomy")
    T = unwrap(load(d, "topics.json"), "topics")
    D = unwrap(load(d, "dependencies.json"), "dependencies")
    R = {}
    rp = os.path.join(d, "teaching-research.json")
    if os.path.exists(rp):
        for r in unwrap(load(d, "teaching-research.json"), "records", "research"):
            R[r.get("topicId")] = r
    byid = {t["id"]: t for t in T}
    pre = {}
    for e in D:
        pre.setdefault(e["topicId"], []).append(e)
    q = args[0]
    if q in byid:
        hits = [byid[q]]
    else:
        hits = [t for t in T if q.lower() in t.get("name", "").lower()]
    if not hits:
        print(f"Marble 里没有匹配「{q}」的节点。数学概念用英文名查（如 fraction / number line / length）。")
        return
    for t in hits[:10]:
        age = ""
        if t.get("ageRangeStart") is not None:
            age = f"｜约 {t['ageRangeStart']}–{t.get('ageRangeEnd')} 岁"
        print(f"\n### {t['id']} {t.get('name')}｜{t.get('type')}｜{t.get('subject')}/{t.get('domain')}{age}")
        if t.get("description"):
            print(f"  描述：{t['description']}")
        for ev in (t.get("evidence") or [])[:4]:
            print(f"  达成证据：{ev}")
        if t.get("assessmentPrompt"):
            print(f"  测评提示：{t['assessmentPrompt']}")
        pres = [e for e in pre.get(t["id"], []) if e["prerequisiteId"] in byid]
        if pres:
            print("  直接先修：" + "；".join(f"{byid[e['prerequisiteId']]['name']} [{e.get('strength','')}]" for e in pres))
        if chain:
            seen = set()
            def walk(tid, depth):
                if tid in seen or depth > 5:
                    return
                seen.add(tid)
                for e in pre.get(tid, []):
                    p = byid.get(e["prerequisiteId"])
                    if p:
                        print("   " + "  " * depth + f"- {p['name']} [{e.get('strength','')}]")
                        walk(e["prerequisiteId"], depth + 1)
            print("  先修链：")
            walk(t["id"], 0)
        r = R.get(t["id"])
        if r:
            ped = r.get("pedagogy", {})
            print(f"  【教学研究】{ped.get('summary','')[:280]}")
            for m in ped.get("commonMisconceptions", []):
                print(f"  常见误解：{m}")
            for b in ped.get("bestPractices", [])[:4]:
                print(f"  教学建议：{b}")
        elif research:
            print("  【教学研究】该节点暂无研究记录（覆盖约 56% 节点），误解层靠推理链自建。")

def main():
    argv = sys.argv[1:]
    source = "cn"
    if "--source" in argv:
        i = argv.index("--source")
        source = argv[i + 1]
        del argv[i:i + 2]
    grade = None
    if "--grade" in argv:
        i = argv.index("--grade")
        grade = int(argv[i + 1])
        del argv[i:i + 2]
    chain = "--chain" in argv
    research = "--research" in argv
    args = [a for a in argv if not a.startswith("--")]
    if not args:
        sys.exit(__doc__)
    if source == "marble":
        marble(args, chain, research)
    else:
        cn(args, chain, grade)

if __name__ == "__main__":
    main()
