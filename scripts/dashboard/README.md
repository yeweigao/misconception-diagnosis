# dashboard/ —— live 档案的前端

`scripts/dashboard.py` 生成的单文件页面（`<孩子>/知识图谱.html`）就是这里拼出来的：
`template.html`（页面骨架与面板）＋ `dashboard.bundle.js`（Three.js 应用，打包后的）＋
当次生成的数据（内联进页面）。

| 文件 | 是什么 |
|---|---|
| `app.js` | 应用源码：场景、节点、边、标签、拾取、面板、筛选。改交互改这里 |
| `template.html` | 页面模板：`__CHILD__` / `__DATE__` 由 dashboard.py 换掉；`<!--DATA-->` 与 `<!--BUNDLE-->` 是内联位置 |
| `dashboard.bundle.js` | 生成的：app.js + Three.js 打包、压缩后的单个文件。**提交在仓库里**，所以用 dashboard.py 只需要 Python，不需要 Node、不需要联网 |
| `package.json` | 只有重打 bundle 时用 |

改了 `app.js` 或 `template.html` 之后，重打 bundle 再提交（bundle 不跟源码同步，页面用的还是旧的）：

```bash
cd scripts/dashboard
npm install   # 第一次才要（需要联网装 three 与 esbuild）
npm run build
```

改 `template.html` 不用重打 bundle（模板是每次生成时现读的），改 `app.js` 才要。
