# dsh-whale-girl

**鲸鱼娘·灵动挂件** —— 一个会卖萌、会记账、会弹跳、会睡觉的 DSH 桌面挂件。

> ✅ 已收录 [dsh-market 创意工坊](https://dsh-market.com/)（社区插件索引），可在 DSH 内直接搜索"鲸鱼娘 / Whale Girl"安装。
> ✅ **官方 DSH Desktop 与第三方 DSH 双端兼容**（0.4.3 起）：官方端无 slots 服务的宿主环境已适配，两端都能正常显示挂件。

在 DSH Desktop 右下角显示一只鲸鱼娘：实时展示 DeepSeek 余额、用量与上下文占用，支持绳摆拖拽、甩抛弹跳、中键弹弓、拖尾特效、DeepSleep 入睡与哄睡，自带彩蛋气泡与右键菜单。

<!-- TODO(宣传素材)：这里贴拖尾甩抛 GIF（约 3s）——录屏后替换本注释 -->

## 功能

- 🖼️ **鲸鱼娘立绘** —— 图片内嵌进脚本（量化压缩至 46KB），无网络依赖，任何环境都能显示
- 💰 **余额 / 用量** —— 实时显示 DeepSeek 余额、今日用量、上轮对话消耗，余额跌破预警线自动气泡提醒
- 📊 **上下文占用** —— 进度条显示当前会话上下文占用（对齐 DSH 显示），≥90% 主动提醒开新会话
- ⏱ **峰谷提醒** —— 判断当前时段为用量高峰还是低谷
- 🪢 **绳摆拖拽**（v0.4）—— 拖拽时鼠标成为锚点，角色以弹性绳挂在鼠标上摆动跟随；松手沿切向速度飞出。弹簧系数/空气阻力/弹性上限三滑杆可调
- 🤸 **甩抛弹跳** —— 快速甩出后在窗口内弹跳，撞边抖动画 + 音效
- 🌍 **重力模式**（v0.4）—— 松手自然落地、软着陆反弹、地面摩擦滑行（可调）
- 🎯 **中键弹弓抛掷** —— 按住中键拖动，挂件跟随并绘制蓝色水滴连接线，松手弹射（力度与拉开距离成正比，菜单可调）
- ✨ **拖尾**（v0.4.3）—— 高速运动（甩抛/绳摆/拖拽/撞面板）时按距离采样洒下 DeepSeek 蓝光点，速度越快拖尾越长
- 😴 **DeepSleep 挺尸态**（v0.4.3）—— 无任务 + 无互动 5~10 分钟后缓慢瘫倒入睡（1.1s 过渡动画 + 头顶 Zzz）；任意交互或来任务即醒；菜单可一键「立刻哄睡」
- 💬 **彩蛋气泡** —— 点击触发随机台词/彩蛋；空闲 2~5 分钟还会自己开口说一句
- 🖱 **右键菜单** —— 音效切换、显示模块开关、API 提供方切换、弹弓力度、毛玻璃强度、挂件缩放、省电模式、挺尸模式、立刻哄睡、恢复默认位置
- 🎵 **音效** —— 可爱合成音 / 鸭叫可切换（mp3 内嵌，无网络依赖）
- 🧩 **工作状态徽章** —— Agent 思考中/搞定啦徽章 + 过渡台词；活跃子代理（分身）数量角标
- 🛠 **API 提供方面板** —— 列出全部已配置 provider 及其余额，点击即切换默认模型路由
- 🍃 **省电模式** —— 空闲 60 秒自动暂停漂浮动画并停用毛玻璃（交互立即恢复），降低常驻 GPU/CPU 占用
- 🖼 **信息面板** —— 浮窗显示时间/日期/CPU/内存，默认跟随角色；快速移动或拖动时脱钩独立（撞边界/角色反弹、几秒后回归）

## 彩蛋台词（节选）

挂着不动、点她、被甩飞、报错的时候……她都会自己开口。台词池节选：

- "有点饿了，中午该吃什么呢……不行，得集中精神。"
- "Let me go~ I'm making the calls~ Let me write the JSON~♪"
- "大的药来了！"
- "已思考（用时 5 秒）：这用户发的啥啊…？"
- "嚯，这破系统终于给老子放出来了！"
- "恭喜你实现token自由！token全跑了！"
- "你目录里的dsh是什么...大烧货吗...?"

更多的自己养出来（随机加权池：模型语录 / 傲娇 / token 梗 / 梗图名场面 / 稀有台词）。

## 安装

**方式一：npm（推荐，任何人一条命令）**

```bash
# 官方 DSH Desktop
dsh plugin --profile desktop add dsh-whale-girl

# 第三方 DSH（web profile）
dsh plugin --profile web add dsh-whale-girl
```

> 本机没有 `dsh` 命令时用：`npx @deepseek-ai/dsh plugin --profile desktop add dsh-whale-girl`（npm 镜像源自动加速）。

**方式二：GitHub Release tgz（离线/镜像不通时兜底）**

从 [Releases](https://github.com/nickkkkkk123123/dsh-whale-girl/releases) 下载 `dsh-whale-girl-x.y.z.tgz` 后：

```bash
dsh plugin --profile desktop add ./dsh-whale-girl-x.y.z.tgz
```

> 卸载说明：卸载后 DSH_HOME（`~/.dsh`）会留下数据文件（`.whale-girl-config.json` / `.whale-girl-usage.json` / `.whale-girl-diag.log`），均为纯数据、不参与任何执行，不需要可手动删除。

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
  "deepSleep": true,
  "ropeMode": false,
  "gravityMode": false,
  "ropeK": 80,
  "ropeDamp": 3,
  "ropeMax": 150,
  "bounceE": 1,
  "groundFriction": 0.95,
  "frost": 4,
  "panelOpacity": 0.82,
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
| `deepSleep` | 挺尸模式：无任务+无互动 5~10 分钟入睡（默认开） |
| `ropeMode` | 绳摆模式：拖拽时角色以弹性绳挂在鼠标上 |
| `gravityMode` | 重力模式：松手落地（关闭=悬浮归位） |
| `ropeK` / `ropeDamp` / `ropeMax` | 弹性绳弹簧系数 / 空气阻力 / 最大伸长量 |
| `bounceE` / `groundFriction` | 反弹弹性 0.1~1 / 落地滑行摩擦 0.8~0.99 |
| `frost` | 毛玻璃强度 0~16（进度条底板 blur 像素，0=关闭） |
| `panelOpacity` | 底板不透明度 0.2~1（菜单滑块按「透明度 = 1 − 该值」显示） |
| `lowBalance` | 余额预警线（元），0=关闭预警 |

## API 提供方切换

右键鲸鱼娘 → **API 提供方** 菜单区会列出所有已配置的提供方（内置 DeepSeek 官方 + `settings.yaml` 中声明的 `llm-pi-ai.providers` / `llm-openai-compatible.providers`），并显示各自的余额（平台无公开余额 API 时显示"余额未知"）。点击某项即切换默认模型路由（写入 `agent-default-model`，新会话生效）。

- **余额查询**：已知平台专用 API（DeepSeek / 硅基流动）优先，否则按 baseURL 自动探测常见余额端点，都没有则显示"余额未知"。
- **切换模型**：优先用该 provider 在配置里声明的第一个模型，未声明时回退到内置映射。

## 双端兼容说明（0.4.3）

- **第三方 DSH**：挂件经 `shell.overlay` slot + React portal 渲染（原有路径）。
- **官方 DSH Desktop**：官方 web-app 不提供 slots 服务——客户端改为**直接挂载 body 顶层**，并带 mount 点防重入；官方 loader 的 bundles/patch 双路径激活也做了容错（路由重复自动跳过）。两端行为一致。

## 占用实测（回应"桌宠一定吃资源"的刻板印象）

所有数字均为这台机器上的实测值，不是估算：

| 项目 | 数据 | 说明 |
| --- | --- | --- |
| 安装包 | **约 350KB** | 立绘经 palette 量化压缩（1081KB → 46KB）后整体 -90% |
| 额外进程 | **0 个** | 挂件是 DSH Web UI 内的一个 DOM 节点，不开新进程、不装 Helper |
| 空闲 CPU 影响 | **约 0.6%** | 同口径 A/B：65 秒空闲窗口内，漂浮动画开/关的整机 CPU 增量差仅 0.15 秒（信息面板关闭时） |
| 空闲 GPU | 省电模式自动归零 | 空闲 60 秒停止逐帧合成调度，交互瞬间恢复 |

测量方法：重启 DSH 后等待 80 秒（越过省电阈值），对全部 DSH 进程取 `TotalProcessorTime`，测 65 秒窗口增量，省电开/关各测一轮取差值。

> **说明**：**信息面板开启**（时间/系统资源 + 毛玻璃 + 物理跟随循环）会额外占用，强度取决于 `infoFrost` 与 `pauseOnThinking`（DSH 输出/思考时暂停面板物理，默认开）。实测（2026-08-30，v0.3.6）：面板开/关差值 ≈0.7% 单核，增量极小。

## 流式输出卡顿（✅ 已解决，2026-10-06 验证）

**历史现象**（0.1.x 时代 / 第三方桌面端）：agent 流式输出长文字时，挂件（及同页 UI）在相邻 token 之间会卡顿，输出完毕立即恢复流畅。

**历史根因**：**不在本插件**。DSH 前端在流式输出时每收到一个 token 就整体重建当前 assistant 消息（`assistant.ts` 的 `updateChunk` 每 chunk 复制 blocks 并重渲染整条消息），占用主线程；本挂件与它同页面/同主线程，被连带卡住。2026-08-30 已反馈至 DSH Desktop issue #747。

**现状**：官方 DeepSeek Harness **0.2.0-rc.2 已按 #747 建议①修复**——renderer 对流式 chunk 采用 `publication: "animation-frame"`，按动画帧合并发布（每帧最多一次视图刷新，而非每 token 一次），2026-10-06 源码验证（本地 app.asar 内 assistant/tool/turn-process/trajectory 四处定义均生效；引入提交 = 上游 8/25 `perf(conversation): fold packed assistant history`），实机观察流式输出期间挂件不再卡顿。#747 截至验证日仍处 open（上游未关闭），如在更新版本复现请跟帖反馈。

**本插件原缓解措施保留**：`thinking` 时暂停信息面板物理循环（默认开）；transform 定位（不触发 layout reflow）；物理循环减负。

## 数据链路（为什么不用 fetch）

DSH Desktop 的 webserver 会对不带 renderer 认证头的子资源请求返回 **403**（包括 `fetch`、`<img>`、`<audio>`、`<script>`）。因此：

- **图片 / 音效**：内嵌为 data URL，完全不走网络请求
- **数据**：宿主向主页面顶层注入桥接脚本，脚本用**带认证的 fetch** 拉取 `/dsh-whale-girl/api/state`，再通过 `postMessage` 广播给挂件

## 余额 key

余额通过 `credentials.resolve('DEEPSEEK_API_KEY')` 读取，需在 DSH 中配置 `DEEPSEEK_API_KEY`（官方端绑定账号或 API 密钥均可）。

## 开发

```bash
pnpm install
pnpm build     # 打包 host (lib/index.js) + client (lib/client.js)
pnpm test      # 运行测试
```

## License

[MIT](./LICENSE)
