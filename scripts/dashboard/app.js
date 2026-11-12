// 知识图谱 dashboard：cn-math 数学全图（870 点）+ 孩子的点亮状态，Three.js 3D。
// 数据来自 window.GRAPH_DATA（build_data.py 生成，build_html.py 内联进页面）。
// 单文件、离线可开：three.js 经 esbuild 打包内联，不依赖 CDN。

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const D = window.GRAPH_DATA;
const $ = (id) => document.getElementById(id);

// ── 状态 → 颜色 / 大小。亲眼看到的亮，推断的暗一档（与知识地图.html 的虚线框同理） ──
const STATE = {
  "问题·测实": { c: 0xff2e2e, size: 1.7, lit: true,  fam: "red" },
  "有问题":   { c: 0xff5148, size: 1.65, lit: true,  fam: "red" },
  "存疑":     { c: 0xffb020, size: 1.45, lit: true,  fam: "amber" },
  "会·测实":  { c: 0x4dffa8, size: 1.45, lit: true,  fam: "mint" },
  "看到会":   { c: 0x2fe8a8, size: 1.45, lit: true,  fam: "mint" },
  "推断会":   { c: 0x2fae7d, size: 1.2, lit: true,  fam: "mint" },
  "上游待查": { c: 0xc99a3f, size: 1.2, lit: true,  fam: "amber" },
  "可能受影响": { c: 0xc96a5a, size: 1.2, lit: true,  fam: "red" },
  "没碰过":   { c: 0x2c3550, size: 1.0, lit: false, fam: "grey" },
};
// 远看不标字——亮点簇的字会糊成一团；凑近了、或选中了，才标。
// （悬停时 HTML 提示条本来就有名字，不靠 3D 标签。）
const IMPORTANT_LABEL = null; // 保留常量名，避免旧引用报错；规则见 animate
let labelsOn = true;
const FILTERS = [
  ["全部", null],
  ["已点亮", new Set(["看到会", "会·测实", "推断会"])],
  ["有问题", new Set(["有问题", "问题·测实", "可能受影响"])],
  ["存疑", new Set(["存疑", "上游待查"])],
  ["推断", new Set(["推断会", "上游待查", "可能受影响"])],
  ["没碰过", new Set(["没碰过"])],
];
const VIOLET = new THREE.Color(0xa78bfa);

const nodes = D.nodes;
const indexById = new Map(nodes.map((n, i) => [n.id, i]));
const pos = nodes.map((n) => new THREE.Vector3(n.x, n.y, n.z));
const baseColor = nodes.map((n) => {
  const c = new THREE.Color(STATE[n.st].c);
  if (n.kind === "g") c.lerp(VIOLET, 0.45); // 认知节点往紫里偏
  return c;
});
const baseScale = nodes.map((n) => {
  let s = STATE[n.st].size * (1 + 0.05 * Math.min(n.deg, 20));
  if (n.kind === "g") s *= 1.25;
  return s;
});
const problemIdx = nodes.map((n, i) => (STATE[n.st].fam === "red" && STATE[n.st].lit ? i : -1)).filter((i) => i >= 0);

// 邻接：先修 ← 节点 → 后继（点亮链用）
const prereq = nodes.map(() => []);
const succ = nodes.map(() => []);
for (const [a, b, hard] of D.edges) {
  if (hard === 2) continue; // 认知挂线不进链
  prereq[b].push(a);
  succ[a].push(b);
}
const ancestors = (i) => {
  const out = new Set(), q = [...prereq[i]];
  while (q.length) { const x = q.pop(); if (!out.has(x)) { out.add(x); q.push(...prereq[x]); } }
  return out;
};
const children1 = (i) => new Set(succ[i]);

// ── 场景 ──
const container = $("scene");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04050d);
scene.fog = new THREE.FogExp2(0x04050d, 0.0011);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 3000);
const bbox = new THREE.Box3().setFromPoints(pos);
const center = bbox.getCenter(new THREE.Vector3());
const span = bbox.getSize(new THREE.Vector3()).length();
const narrow = innerWidth <= 760;
const distK = narrow ? 0.82 : 1;
camera.position.set(center.x + span * 0.55 * distK, center.y + span * 0.42 * distK, center.z + span * 0.72 * distK);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(center);
// 宽屏才把图往画面右侧推，避开左侧面板（手机上面板在底部，不用推）
if (!narrow) {
  camera.lookAt(center);
  camera.updateMatrixWorld();
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
  camera.position.addScaledVector(right, -span * 0.1);
  controls.target.addScaledVector(right, -span * 0.1);
}
const HOME_C = camera.position.clone(), HOME_T = controls.target.clone();
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.45;
controls.minDistance = 20;
controls.maxDistance = span * 2.2;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.55, 0.32);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// 星尘：背景粒子场，只为氛围
{
  const N = 1600, arr = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 320 + Math.random() * 420, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = center.x + r * Math.sin(ph) * Math.cos(th);
    arr[i * 3 + 1] = center.y + r * Math.cos(ph) * 0.6;
    arr[i * 3 + 2] = center.z + r * Math.sin(ph) * Math.sin(th);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    color: 0x8899ff, size: 1.7, transparent: true, opacity: 0.45,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  })));
}

// 节点：发光球体（实例化，一次 draw call）
const nodeMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(1, 14, 10),
  new THREE.MeshBasicMaterial({ toneMapped: false }),
  nodes.length,
);
nodeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(nodeMesh);

// 边：先修 → 后继。硬边亮一点，认知挂线是紫的
const edgeGeo = new THREE.BufferGeometry();
{
  const v = [], col = [];
  const cHard = new THREE.Color(0x5a6c9a), cSoft = new THREE.Color(0x3a4668), cCog = new THREE.Color(0x7a6cae);
  for (const [a, b, hard] of D.edges) {
    v.push(pos[a].x, pos[a].y, pos[a].z, pos[b].x, pos[b].y, pos[b].z);
    const c = hard === 2 ? cCog : hard === 1 ? cHard : cSoft;
    col.push(c.r, c.g, c.b, c.r, c.g, c.b);
  }
  edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  edgeGeo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
}
const edgeMat = new THREE.LineBasicMaterial({
  vertexColors: true, transparent: true, opacity: 0.16,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
scene.add(edgeLines);

// 高亮链的边（选中节点时重建）
const hlGeo = new THREE.BufferGeometry();
const hlLines = new THREE.LineSegments(hlGeo, new THREE.LineBasicMaterial({
  vertexColors: true, transparent: true, opacity: 0.9,
  blending: THREE.AdditiveBlending, depthWrite: false,
}));
hlLines.visible = false;
scene.add(hlLines);

// 标签：只给点亮的节点（~40 个），字画在 canvas 上
const labelGroup = new THREE.Group();
scene.add(labelGroup);
function makeLabel(text, color) {
  const fs = 30, pad = 12;
  const cv = document.createElement("canvas");
  let cx = cv.getContext("2d");
  cx.font = `600 ${fs}px "PingFang SC","Noto Sans CJK SC",sans-serif`;
  cv.width = Math.ceil(cx.measureText(text).width) + pad * 2;
  cv.height = fs + pad * 2;
  cx = cv.getContext("2d");
  cx.fillStyle = "rgba(6,10,24,0.82)";
  cx.beginPath();
  cx.roundRect(0, 0, cv.width, cv.height, 14);
  cx.fill();
  cx.font = `600 ${fs}px "PingFang SC","Noto Sans CJK SC",sans-serif`;
  cx.fillStyle = color;
  cx.textBaseline = "middle";
  cx.fillText(text, pad, cv.height / 2 + 2);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  const k = 0.034;
  sp.scale.set(cv.width * k, cv.height * k, 1);
  return sp;
}
for (let i = 0; i < nodes.length; i++) {
  if (!STATE[nodes[i].st].lit) continue;
  const hex = "#" + baseColor[i].getHexString();
  const sp = makeLabel(nodes[i].name, hex);
  sp.position.copy(pos[i]).add(new THREE.Vector3(0, baseScale[i] + 2.6, 0));
  sp.userData.node = i;
  labelGroup.add(sp);
}

// ── 视觉状态：筛选 × 高亮链 × 呼吸 ──
let activeFilter = 0;
let chainSet = null; // Set<idx> | null
const curScale = [...baseScale];
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3();
const tmpC = new THREE.Color();

function applyVisual() {
  const fset = FILTERS[activeFilter][1];
  for (let i = 0; i < nodes.length; i++) {
    let bright = 1, scale = baseScale[i];
    if (fset && !fset.has(nodes[i].st)) { bright *= 0.1; scale *= 0.45; }
    if (chainSet) {
      if (chainSet.has(i)) { bright *= 1.2; scale *= 1.3; }
      else { bright *= 0.16; scale *= 0.7; }
    }
    tmpC.copy(baseColor[i]).multiplyScalar(bright);
    nodeMesh.setColorAt(i, tmpC);
    curScale[i] = scale;
    M.compose(pos[i], Q.identity(), S.setScalar(scale));
    nodeMesh.setMatrixAt(i, M);
  }
  nodeMesh.instanceColor.needsUpdate = true;
  nodeMesh.instanceMatrix.needsUpdate = true;
  edgeMat.opacity = chainSet || fset ? 0.05 : 0.16;
}

function setChain(nodeIdx, mode) {
  if (nodeIdx == null || mode === "none") {
    chainSet = null;
    hlLines.visible = false;
    applyVisual();
    return;
  }
  const set = new Set([nodeIdx]);
  if (mode === "up" || mode === "both") for (const a of ancestors(nodeIdx)) set.add(a);
  if (mode === "down" || mode === "both") for (const c of children1(nodeIdx)) set.add(c);
  chainSet = set;
  // 重建高亮边：链内的边，青色是上游、紫色是下游
  const v = [], col = [];
  const cUp = new THREE.Color(0x6ee7ff), cDown = new THREE.Color(0xc084fc);
  const anc = ancestors(nodeIdx), down = children1(nodeIdx);
  for (const [a, b, hard] of D.edges) {
    if (hard === 2) continue;
    if (!set.has(a) || !set.has(b)) continue;
    v.push(pos[a].x, pos[a].y, pos[a].z, pos[b].x, pos[b].y, pos[b].z);
    const c = down.has(b) && a === nodeIdx ? cDown : cUp;
    col.push(c.r, c.g, c.b, c.r, c.g, c.b);
  }
  hlGeo.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  hlGeo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  hlLines.visible = v.length > 0;
  applyVisual();
}

// ── 相机飞行 ──
let fly = null;
function flyTo(target, dist) {
  const dir = camera.position.clone().sub(controls.target).normalize();
  fly = {
    t0: performance.now(), dur: 1100,
    fromT: controls.target.clone(), toT: target.clone(),
    fromC: camera.position.clone(),
    toC: target.clone().add(dir.multiplyScalar(dist ?? span * 0.32)),
  };
}
function flyReset() {
  fly = {
    t0: performance.now(), dur: 1100,
    fromT: controls.target.clone(), toT: HOME_T.clone(),
    fromC: camera.position.clone(),
    toC: HOME_C.clone(),
  };
}

// ── UI：统计、图例、筛选、猜测、卷子 ──
const litCount = ["看到会", "会·测实", "推断会"].reduce((a, s) => a + (D.counts[s] || 0), 0);
const probCount = ["有问题", "问题·测实"].reduce((a, s) => a + (D.counts[s] || 0), 0);
const doubtCount = D.counts["存疑"] || 0;
const pendingExps = D.experiments.filter((e) => e.status !== "已回收");
$("stats").innerHTML =
  `<span class="chip" id="chipLit" style="cursor:pointer" title="飞到点亮的地方"><b class="mint">${litCount}</b>已点亮</span>` +
  `<span class="chip"><b class="red">${probCount}</b>有问题</span>` +
  `<span class="chip"><b class="amber">${doubtCount}</b>存疑</span>` +
  `<span class="chip"><b class="cyan">${pendingExps.length}</b>卷子待收回</span>`;
{
  const litCenter = new THREE.Vector3();
  let litN = 0;
  nodes.forEach((n, i) => { if (STATE[n.st].lit) { litCenter.add(pos[i]); litN++; } });
  litCenter.divideScalar(Math.max(litN, 1));
  $("chipLit").onclick = () => flyTo(litCenter, span * 0.22);
}

$("legend").innerHTML = Object.entries(STATE).map(([s, v]) =>
  `<span><i style="background:#${v.c.toString(16).padStart(6, "0")}"></i>${s}${v.lit ? "" : ""}</span>`).join("");

const fWrap = $("filters");
FILTERS.forEach(([label], fi) => {
  const b = document.createElement("button");
  b.className = "fbtn" + (fi === 0 ? " on" : "");
  b.textContent = label;
  b.onclick = () => {
    activeFilter = fi;
    fWrap.querySelectorAll(".fbtn").forEach((x, j) => x.classList.toggle("on", j === fi));
    applyVisual();
  };
  fWrap.appendChild(b);
});

$("tglLabels").onchange = (e) => { labelsOn = e.target.checked; };
$("tglEdges").onchange = (e) => { edgeLines.visible = e.target.checked; };
$("tglSpin").onchange = (e) => { controls.autoRotate = e.target.checked; };
$("togglePanel").onclick = () => $("panel").classList.toggle("hidden");
$("hidePanel").onclick = () => $("panel").classList.add("hidden");

const beliefById = new Map(D.beliefs.map((b) => [b.id, b]));
const BELIEF_ORDER = { "测实": 0, "有支持": 1, "猜测": 2, "已解决": 3, "推翻": 4 };
const belWrap = $("beliefs");
[...D.beliefs].sort((a, b) => BELIEF_ORDER[a.status] - BELIEF_ORDER[b.status]).forEach((b) => {
  const div = document.createElement("div");
  div.className = "bel";
  div.innerHTML = `<span class="st ${b.status}">${b.status}</span><span class="cl">${b.claim}</span>` +
    (b.next ? `<div class="nx">下一步：${b.next}</div>` : "");
  div.onclick = () => {
    belWrap.querySelectorAll(".bel").forEach((x) => x.classList.remove("sel"));
    div.classList.add("sel");
    const first = b.nodes.map((id) => indexById.get(id)).find((i) => i != null);
    if (first != null) selectNode(first, { fly: true });
  };
  belWrap.appendChild(div);
});
$("exps").innerHTML = pendingExps.length
  ? pendingExps.map((e) => `<div class="exp"><b>${e.date}《${e.title}》</b><br>检验 ${e.tests.join("、")}</div>`).join("")
  : `<div class="exp">没有待收回的卷子。</div>`;

// 搜索
const searchEl = $("search"), slist = $("slist");
searchEl.addEventListener("input", () => {
  const q = searchEl.value.trim();
  if (!q) { slist.style.display = "none"; return; }
  const hits = nodes.filter((n) => n.name.includes(q)).slice(0, 8);
  slist.innerHTML = hits.map((n) =>
    `<li data-id="${n.id}">${n.name}<small>${n.kind === "g" ? "认知节点" : `${n.grade}年级 · ${n.st}`}</small></li>`).join("");
  slist.style.display = hits.length ? "block" : "none";
});
slist.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  slist.style.display = "none";
  searchEl.value = "";
  const i = indexById.get(li.dataset.id);
  if (i != null) selectNode(i, { fly: true });
});
searchEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const first = slist.querySelector("li");
    if (first) first.click();
  }
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("#suggest")) slist.style.display = "none";
});

// ── 选中节点：详情面板 ──
let selected = null;
const detailEl = $("detail");
const famClass = (st) => ({ red: "red", amber: "amber", mint: "mint", grey: "grey" })[STATE[st].fam];

function selectNode(i, { fly: doFly = false } = {}) {
  selected = i;
  const n = nodes[i];
  const related = D.beliefs.filter((b) => b.nodes.includes(n.id));
  const ev = D.evidence[n.id] || [];
  const evHtml = ev.map((w) => {
    const m = w.match(/^(b\d+)·/);
    const b = m && beliefById.get(m[1]);
    return b ? `<div>· ${b.id}（${b.status}）：${b.claim}</div>` : `<div>· ${w}</div>`;
  }).join("");
  const relHtml = related.map((b) =>
    `<div>· <b>${b.id} · ${b.status}</b> ${b.claim}${b.next ? `<br><span style="color:var(--dim)">下一步：${b.next}</span>` : ""}</div>`).join("");
  detailEl.innerHTML =
    `<div class="nm">${n.name}</div>` +
    `<div class="meta">${n.kind === "g" ? "认知节点（课标以下，本档案里建的）" : `${n.id} · ${n.grade}年级${n.sem} · ${n.dom}<br>${n.ch}`}</div>` +
    `<span class="badge ${famClass(n.st)}">${n.st}</span>` +
    `<div class="ev">${n.obs ? "亲眼看到的，有证据。" : "推断的：只是提示，不进档案。"}` +
    (evHtml ? `<div style="margin-top:6px"><b>证据</b>${evHtml}</div>` : "") +
    (relHtml ? `<div style="margin-top:6px"><b>相关猜测</b>${relHtml}</div>` : "") +
    `</div>` +
    `<div class="btns">` +
    `<button class="abtn" id="btnUp">上游链</button>` +
    `<button class="abtn" id="btnDown">下游牵连</button>` +
    `<button class="abtn" id="btnFly">定位</button>` +
    `<button class="abtn ghost" id="btnClear">清除高亮</button></div>`;
  $("btnUp").onclick = () => setChain(i, "up");
  $("btnDown").onclick = () => setChain(i, "down");
  $("btnFly").onclick = () => flyTo(pos[i]);
  $("btnClear").onclick = () => setChain(null, "none");
  setChain(i, "both");
  if (doFly) flyTo(pos[i]);
  if (innerWidth <= 760) $("panel").classList.remove("hidden");
}

// ── 拾取：悬停提示 + 点击选中 ──
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tip = $("tip");
let hoverIdx = null, downPos = null;

function pick(cx, cy) {
  pointer.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObject(nodeMesh);
  return hits.length ? hits[0].instanceId : null;
}
renderer.domElement.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") return;
  const i = pick(e.clientX, e.clientY);
  hoverIdx = i;
  if (i == null) { tip.style.display = "none"; renderer.domElement.style.cursor = ""; return; }
  const n = nodes[i];
  tip.querySelector(".t").textContent = n.name;
  tip.querySelector(".s").textContent = `${n.kind === "g" ? "认知节点" : `${n.grade}年级 · ${n.dom}`} · ${n.st}`;
  tip.style.display = "block";
  tip.style.left = Math.min(e.clientX + 14, innerWidth - 290) + "px";
  tip.style.top = (e.clientY + 14) + "px";
  renderer.domElement.style.cursor = "pointer";
});
renderer.domElement.addEventListener("pointerdown", (e) => { downPos = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]);
  downPos = null;
  if (moved > 6) return;
  const i = pick(e.clientX, e.clientY);
  if (i != null) selectNode(i, {});
});
renderer.domElement.addEventListener("dblclick", () => {
  setChain(null, "none");
  selected = null;
  flyReset();
});

// ── 渲染循环：呼吸 + 飞行 ──
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  // 有问题的节点轻轻呼吸
  for (const i of problemIdx) {
    const s = curScale[i] * (1 + 0.16 * Math.sin(t * 2.2 + i));
    M.compose(pos[i], Q.identity(), S.setScalar(s));
    nodeMesh.setMatrixAt(i, M);
  }
  nodeMesh.instanceMatrix.needsUpdate = true;
  // 标签：凑近了（130 内）或选中了才标，远看只留光点
  for (const sp of labelGroup.children) {
    const i = sp.userData.node;
    sp.visible = labelsOn && (i === selected || camera.position.distanceTo(pos[i]) < 130);
  }
  if (fly) {
    const k = Math.min((performance.now() - fly.t0) / fly.dur, 1);
    const e = 1 - Math.pow(1 - k, 3);
    controls.target.lerpVectors(fly.fromT, fly.toT, e);
    camera.position.lerpVectors(fly.fromC, fly.toC, e);
    if (k >= 1) fly = null;
  }
  controls.update();
  composer.render();
}
applyVisual();
animate();
requestAnimationFrame(() => {
  const l = $("loading");
  l.style.opacity = "0";
  setTimeout(() => l.remove(), 700);
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});
