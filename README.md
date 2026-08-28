# dsh-whale-girl

**鲸鱼娘·灵动挂件** —— 一个会卖萌、会记账、会弹跳的 DSH 桌面挂件。

在 DSH Desktop 右下角显示一只鲸鱼娘，实时展示 DeepSeek 余额、用量与上下文占用，支持拖动、甩抛弹跳、中键弹弓抛掷、彩蛋气泡与右键菜单。

## 功能

- 🖼️ **鲸鱼娘立绘** —— 图片内嵌进脚本（量化压缩至 46KB），无网络依赖，任何环境都能显示
- 💰 **余额 / 用量** —— 实时显示 DeepSeek 余额、今日用量、上轮对话消耗，余额跌破预警线自动气泡提醒
- 📊 **上下文占用** —— 进度条显示当前会话上下文占用（对齐 DSH 显示），≥90% 主动提醒开新会话
- ⏱ **峰谷提醒** —— 判断当前时段为用量高峰还是低谷
- 💬 **彩蛋气泡** —— 点击触发随机台词/彩蛋；空闲 2~5 分钟还会自己开口说一句（说话即唤醒动画，说完继续省电）
- 🖱 **右键菜单** —— 切换音效、开关显示模块、切换 API 提供方、调节弹弓力度与毛玻璃强度、省电模式开关、恢复默认位置
- 🎵 **音效** —— 可爱合成音 / 鸭叫 可切换（mp3 内嵌，无网络依赖）
- 🤸 **甩抛弹跳** —— 快速甩出后在窗口内弹跳，撞边抖动画 + 音效
- 🎯 **中键弹弓抛掷** —— 按住中键拖动，挂件跟随并绘制蓝色水滴连接线，松手沿原位置方向弹射（力度与拉开距离成正比，可在菜单调节）
- 🍃 **省电模式** —— 空闲 60 秒自动暂停漂浮动画并停用毛玻璃（交互立即恢复），降低常驻 GPU/CPU 占用
- 🧊 **毛玻璃强度** —— 进度条底板模糊度 0~16 可调，0 为关闭（更省资源）

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
  "showPeak": true,
  "slingPower": 20,
  "ecoMode": true,
  "frost": 4,
  "lowBalance": 10
}
```

| 字段 | 说明 |
| --- | --- |
| `soundMode` | `cute` 可爱合成音 / `duck` 鸭叫 |
| `showProgress` | 是否显示上下文进度条 |
| `showBubble` | 是否显示彩蛋/随机台词气泡 |
| `showBalance` | 是否在详情里显示余额 |
| `showPeak` | 是否显示峰谷提醒 |
| `slingPower` | 中键弹弓发射力度系数（5~60，松手速度 = 拉开距离 × 系数） |
| `ecoMode` | 省电模式：空闲 60 秒暂停漂浮动画并停用毛玻璃 |
| `frost` | 毛玻璃强度 0~16（进度条底板 blur 像素，0=关闭，背景透明度联动） |
| `lowBalance` | 余额预警线（元），余额低于该值时气泡提醒充值，0=关闭预警 |

## API 提供方切换

右键鲸鱼娘 → **API 提供方** 菜单区会列出所有已配置的提供方（内置 DeepSeek 官方 + `settings.yaml` 中声明的 `llm-pi-ai.providers` / `llm-openai-compatible.providers`），并显示各自的余额（平台无公开余额 API 时显示"余额未知"）。点击某项即切换默认模型路由（写入 `agent-default-model`，新会话生效）。

- **余额查询**：已知平台专用 API（DeepSeek / 硅基流动）优先，否则按 baseURL 自动探测常见余额端点，都没有则显示"余额未知"。
- **切换模型**：优先用该 provider 在配置里声明的第一个模型，未声明时回退到内置映射。

## 中键弹弓与省电

- **中键弹弓**：按住鼠标中键拖动挂件（自动屏蔽浏览器中键滚轮），原位置与挂件间绘制蓝色水滴连接线；松手时挂件沿「原位置 → 当前」的反方向弹回（橡皮筋手感），速度 = 拉开距离 × `slingPower`，撞边弹跳 + 音效复用甩抛物理。
- **省电模式**：挂件交互（按下/划过/菜单）会刷新空闲计时，60 秒无交互后自动暂停漂浮动画、停用毛玻璃底板（`:hover` 立即恢复）；菜单可关闭该模式。毛玻璃强度 `frost` 调到 0 或开启省电都能显著降低常驻渲染开销。

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
