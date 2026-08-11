# 🧭 Atlas

一个轻量、美观的个人网站导航页：把自己常用网站和自建服务按分类组织成卡片式导航，支持搜索、主题切换、拖拽排序，纯静态部署到公网，手机/任意设备随时访问。

## ✨ 功能

- **分组卡片式导航**：站点按分类展示，自动抓取站点 favicon，失败时回退首字母色块
- **站内搜索 + 引擎跳转**：输入即过滤；回车直接打开站点或跳转搜索引擎（支持自定义引擎）
- **编辑模式**：页面内增删改分组/站点，改动存浏览器本地
- **拖拽排序**：卡片可组内/跨组拖动，分组可拖动排序（支持触屏）
- **亮/暗主题**：跟随系统 + 手动三态切换
- **数据管理**：JSON 导入导出、浏览器书签（HTML）导入、一键恢复仓库数据
- **响应式**：桌面多列网格 / 移动端单列，PWA 可离线（规划中）

## 🚀 快速开始

```bash
npm install        # 安装依赖
npm run dev        # 本地开发（默认 http://localhost:5745）
npm run build      # 类型检查 + 生产构建（产物在 dist/）
npm test           # 运行单元测试
```

## 📁 目录结构

```
├── public/data/          # 导航数据
│   ├── links.json        # 真实数据（个人数据，已被 .gitignore 排除，不入库）
│   └── links.example.json# 示例模板
├── src/
│   ├── components/       # 组件（TopBar/NavCard/NavGroup/弹窗等）
│   ├── stores/           # Pinia 状态（导航数据/搜索/设置）
│   ├── utils/            # 纯函数工具（合并/搜索/导入导出/图标）
│   ├── composables/      # 模块级 UI 状态
│   └── types/            # 数据模型类型
└── docs/                 # 文档（开发文档/测试报告/设计规范）
```

## 📊 数据说明

导航数据集中在 `public/data/links.json`（schema 见 [docs/开发文档.md](docs/开发文档.md) 第 6 章）：

- **数据即文件**：直接编辑 JSON 或使用页面编辑模式，导出后回填仓库即可
- **双源合并**：仓库数据为基线，浏览器 localStorage 保存本地修改（本地优先）
- **个人数据不入库**：`links.json` 含个人服务地址，已被 `.gitignore` 排除；仓库内置 `links.example.json` 作为结构模板，部署前把真实数据放入 `public/data/links.json` 即可

## 🌐 部署（静态托管）

纯静态 SPA，任意静态托管均可（Vercel / Cloudflare Pages / GitHub Pages / Nginx）：

1. `npm run build` 产出 `dist/`
2. 将 `dist/` 与 `public/data/links.json`（真实数据）部署到托管平台
3. Vercel 等平台绑定 Git 仓库后 push 即自动部署

## 🐧 Linux 部署（systemd 开机自启）

> 本项目为**纯前端静态应用**（无后端）。以 `/root/Atlas` 为例（路径可换）。

### 1. 克隆 + 安装依赖

```bash
git clone https://github.com/54shen/Atlas.git
cd ~/Atlas
npm install                               # 国内可加 --registry=https://registry.npmmirror.com

# 个人导航数据（links.json）不入库，克隆后需手动放入真实数据
cp public/data/links.example.json public/data/links.json   # 先用示例模板跑通，再替换为你的真实数据
```

> **环境要求**：Node.js ≥ 20.19（或 22.12+）。服务器版本太老会启动失败（报 `crypto.hash is not a function`），升级方法见下方「常见问题」。

### 2. 创建 systemd 服务

```bash
cat > /etc/systemd/system/Atlas.service << 'EOF'
[Unit]
Description=Atlas Frontend
After=network.target

[Service]
Type=simple
WorkingDirectory=/root/Atlas
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

> ⚠ npm 路径不一定在 /usr/bin：先 `which npm` 确认；用 nvm 装的要把 ExecStart 换成完整路径（如 `/root/.nvm/versions/node/v22.x.x/bin/npm`）。
>
> 家庭自用 dev 模式够用；长期跑建议生产模式（`npm run build` 后用 nginx 托管 `dist/`，见上方「部署（静态托管）」）。

### 3. 启动 + 开机自启

```bash
systemctl daemon-reload
systemctl enable Atlas
systemctl start Atlas
systemctl status Atlas        # 确认 running
```

### 4. 更新与运维

```bash
# 一键更新：拉代码 + 装依赖 + 重启（推荐）
cd ~/Atlas && git pull && npm install && systemctl restart Atlas

# 看日志
journalctl -u Atlas -f
```

### 5. 常见问题（FAQ）

**Q1：启动报错 `crypto.hash is not a function` / `Vite requires Node.js version 20.19+`**

服务器 Node 版本太老（Ubuntu/Debian 官方源默认只有 18.x）。升级到 Node 22：

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -   # 添加 NodeSource 源
apt install -y nodejs                                        # 重新安装（替换旧版本）
node -v                                                      # 应显示 v22.x.x
systemctl restart Atlas
```

**Q2：外网访问不到（只有 localhost 能打开）**

项目已配置 `server.host: true`（Vite 绑定 0.0.0.0），部署后直接访问 `http://服务器IP:5745`。仍无法访问时依次检查：

1. 防火墙放行 5745 端口：

```bash
# firewalld
firewall-cmd --permanent --add-port=5745/tcp && firewall-cmd --reload
# ufw
ufw allow 5745
```

2. 云服务器控制台的**安全组**放行 5745 端口（TCP）。

**Q3：用域名访问报 `Blocked request. This host ("xxx") is not allowed.`**

Vite 的域名白名单防护，把域名加进 `vite.config.ts` 的 `server.allowedHosts`：

```ts
server: {
  host: true,
  port: 5745,
  allowedHosts: ['atlas.54shen.cn'], // 换成你的域名；有多个域名就都列上
}
```

改完 `systemctl restart Atlas` 生效。

## 📚 文档

- [开发文档](docs/开发文档.md) — 需求分析、技术选型、架构设计、开发计划
- [测试报告](docs/测试报告.md) — 单元测试覆盖与结果
- [设计规范](docs/设计规范.md) — UI/UX 设计规范

## 🛠️ 技术栈

Vue 3 · TypeScript · Vite 7 · Pinia · SortableJS（懒加载）· Vitest
