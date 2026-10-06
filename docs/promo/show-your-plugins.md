# Show Your Plugins 投稿稿（dsh-market / deepseek-harness 讨论区）

> 用法：发帖时取对应语言一节直接粘贴；截图/GIF 位置见 `【图】` 占位，录屏后替换。

---

## 中文版

**标题：🐳 dsh-whale-girl — 会记账、会弹跳、还会躺平睡觉的鲸鱼娘挂件（v0.4.3）**

各位好，分享一下我做的 DSH 桌面挂件：**鲸鱼娘**。在窗口右下角养一只，她能帮你盯着余额和上下文，也能被甩来甩去。

**它是什么？**

一个纯前端的 DSH 插件——不占额外进程（就是 Web UI 里的一个 DOM 节点），立绘和音效全部内嵌（v0.4.3 安装包约 350KB），零网络依赖。

**能干什么？**

- 💰 实时余额 / 今日用量 / 上轮消耗，余额跌破预警线自动提醒
- 📊 上下文占用进度条，≥90% 提醒开新会话
- 🪢 绳摆物理拖拽 + 甩抛弹跳 + 中键弹弓（弹性绳/重力/落地滑行都有独立开关和滑杆）
- ✨ v0.4.3 新增：高速运动拖尾（DeepSeek 蓝光点）
- 😴 v0.4.3 新增：DeepSleep 挺尸态——没任务又没人理她 5~10 分钟，她就原地躺平冒 Zzz；戳一下立刻醒
- 💬 彩蛋台词池（模型梗/token 梗/名场面），点她就会说话

【图：拖尾甩抛 GIF】
【图：哄睡瘫倒 GIF】

**安装**（npm 已发布，官方端/第三方端都支持）：

```bash
dsh plugin --profile desktop add dsh-whale-girl
```

**值一提的技术点**：

- DSH 的 webserver 对子资源请求有认证拦截，所以数据走「宿主注入桥接脚本 + 带认证 fetch + postMessage 广播」的链路，图片/音效全部 data URL
- 曾经的 DSH 流式输出卡顿与本插件无关（DSH 前端每 token 全量重建消息），已在官方 0.2.0-rc.2 根治（动画帧合并发布，2026-10-06 验证），插件侧的物理暂停等缓解措施保留
- 官方 Desktop 与第三方端双兼容（0.4.3 专项适配：无 slots 服务时客户端直挂 body）

**占用**：空闲 ~0.6% CPU 增量、0 额外进程、省电模式空闲自动停渲染。仓库里有完整实测方法和数据，拒绝"桌宠都吃资源"的刻板印象。

**彩蛋**：她偶尔会说 "Let me go~ I'm making the calls~ Let me write the JSON~♪"

仓库：https://github.com/nickkkkkk123123/dsh-whale-girl
dsh-market 搜索「鲸鱼娘 / Whale Girl」可直接安装。

有问题/想加功能欢迎回帖，下个版本在画新表情立绘（""><" 痛颜 + 闭眼睡觉）👋

---

## English version

**Title: 🐳 dsh-whale-girl — a widget that tracks your balance, bounces around, and takes naps**

Hey everyone, sharing my DSH desktop widget: **Whale Girl**. She lives in the corner of your window, keeps an eye on your balance and context usage, and yes — you can fling her across the screen.

**What it is**

A pure front-end DSH plugin — no extra processes (just a DOM node in the Web UI), all artwork and sound embedded as data URLs (~350KB package), zero network dependencies.

**What she does**

- 💰 Live balance / daily usage / last-turn cost, with low-balance bubble alerts
- 📊 Context usage bar (aligned with DSH), warns you to start a new session at 90%
- 🪢 Rope-swing drag physics + fling & bounce + middle-click slingshot (elastic rope, gravity, ground friction — all toggleable with sliders)
- ✨ New in v0.4.3: motion trails — DeepSeek-blue light dots sampled by distance
- 😴 New in v0.4.3: DeepSleep — after 5–10 min with no tasks and no interaction, she keels over and naps with floating Zzz; poke her to wake up
- 💬 Easter-egg dialogue pool (model memes, token memes, classic quotes)

【图：Trail fling GIF】
【图：Sleep transition GIF】

**Install** (published on npm, works on both official and community DSH):

```bash
dsh plugin --profile desktop add dsh-whale-girl
```

**A couple of technical notes worth mentioning**

- DSH's webserver blocks unauthenticated subresource requests, so data flows through a host-injected bridge script + authenticated fetch + postMessage broadcast; images/sounds are all data URLs
- The former DSH streaming-output stutter was NOT caused by this plugin (DSH rebuilt the whole assistant message per token); fixed upstream in official 0.2.0-rc.2 (animation-frame coalesced publication, verified 2026-10-06), plugin-side physics-pause mitigations retained
- Dual compatibility: official Desktop and community builds (v0.4.3 adapted for hosts without the `slots` service — client mounts directly to body)

**Footprint**: ~0.6% idle CPU delta, 0 extra processes, eco mode stops rendering when idle. Full measurement methodology in the repo — desktop pets don't have to be resource hogs.

Repo: https://github.com/nickkkkkk123123/dsh-whale-girl
Also on dsh-market: search "Whale Girl".

Feedback and feature requests welcome. Next up: new expression sprites (pain "><" face + closed-eyes sleep) 👋
