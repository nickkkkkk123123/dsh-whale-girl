# dsh-whale-girl

**鲸鱼娘·灵动挂件** —— 一个会卖萌、会记账、会弹跳的 DSH 桌面挂件。

在 DSH Desktop 右下角显示一只鲸鱼娘，实时展示 DeepSeek 余额、用量与上下文占用，支持拖动、甩抛弹跳、彩蛋气泡与右键菜单。

## 功能

- 🖼️ **鲸鱼娘立绘** —— 图片内嵌进脚本，无网络依赖，任何环境都能显示
- 💰 **余额 / 用量** —— 实时显示 DeepSeek 余额、今日用量、上轮对话消耗
- 📊 **上下文占用** —— 进度条显示当前会话上下文占用（对齐 DSH 显示）
- ⏱ **峰谷提醒** —— 判断当前时段为用量高峰还是低谷
- 💬 **彩蛋气泡** —— 点击触发随机台词/彩蛋，气泡自动夹在屏幕内
- 🖱 **右键菜单** —— 切换音效、开关显示模块、恢复默认位置
- 🎵 **音效** —— 可爱合成音 / 鸭叫 可切换（mp3 内嵌，无网络依赖）
- 🤸 **甩抛弹跳** —— 快速甩出后在窗口内弹跳，撞边抖动画 + 音效

## 安装

```bash
# 从 GitHub Release 安装（含 tgz 安装包，推荐）
dsh plugin add nickkkkkk123123/dsh-whale-girl

# 或本地源码目录 link 依赖后加入 profile bundles
```

## 配置

挂件配置保存在 `~/.dsh/.whale-girl-config.json`（可用右键菜单可视化修改，也可直接编辑文件）：

```json
{
  "soundMode": "cute",
  "showProgress": true,
  "showBubble": true,
  "showBalance": true,
  "showPeak": true
}
```

| 字段 | 说明 |
| --- | --- |
| `soundMode` | `cute` 可爱合成音 / `duck` 鸭叫 |
| `showProgress` | 是否显示上下文进度条 |
| `showBubble` | 是否显示彩蛋/随机台词气泡 |
| `showBalance` | 是否在详情里显示余额 |
| `showPeak` | 是否显示峰谷提醒 |

## 数据链路（为什么不用 fetch）

DSH Desktop 的 webserver 会对不带 renderer 认证头的子资源请求返回 **403**（包括 `fetch`、`<img>`、`<audio>`、`<script>`）。因此：

- **图片 / 音效**：内嵌为 data URL，完全不走网络请求
- **数据**：宿主通过 `webserver/index-inject` 向主页面顶层注入桥接脚本，脚本用**带认证的 fetch** 拉取 `/dsh-whale-girl/api/state`，再通过 `postMessage` 广播给挂件（slots 组件运行在 iframe/隔离上下文，其自身 fetch 不带认证会被拦）

> 这也是 `dsh-whale-widget` 数据同样获取不到（只显示余额，不显示上下文）的原因——普通 fetch 在 DSH Desktop 拿不到 host 数据。

## 余额 key

余额通过 `credentials.resolve('DEEPSEEK_API_KEY')` 读取，需在 DSH 中配置 `DEEPSEEK_API_KEY`（与 `dsh-whale-widget` 一致）。

## 开发

```bash
pnpm install
pnpm build     # 打包 host (lib/index.js) + client (lib/client.js)
pnpm test      # 运行测试
```

## License

[MIT](./LICENSE)
