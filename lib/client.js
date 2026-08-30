window.__ModuleLoader__.load({
	id: "dsh-whale-girl",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		let react_dom = require("react-dom");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/styles.ts
		const WIDGET_CSS = `
.wg-root {
  position: fixed;
  width: 170px;
  height: 170px;
  /* 最高层级：确保不被 better-sidebar 等其他插件遮挡 */
  z-index: 2147483647 !important;
  isolation: isolate;
  cursor: grab;
  user-select: none;
  touch-action: none;
  transition: transform 120ms ease, left 200ms ease, top 200ms ease;
}
.wg-flinging {
  transition: none;
}
.wg-dragging {
  transition: none;
}
.wg-squash-x .wg-img {
  animation: wg-squash-x 240ms ease-out;
}
.wg-squash-y .wg-img {
  animation: wg-squash-y 240ms ease-out;
}
@keyframes wg-squash-x {
  0% { transform: scaleX(calc(1.35 * var(--wg-flip, 1))) scaleY(0.7); }
  60% { transform: scaleX(calc(0.6 * var(--wg-flip, 1))) scaleY(1.35); }
  100% { transform: scaleX(var(--wg-flip, 1)) scaleY(1); }
}
@keyframes wg-squash-y {
  0% { transform: scaleX(calc(0.7 * var(--wg-flip, 1))) scaleY(1.35); }
  60% { transform: scaleX(calc(1.35 * var(--wg-flip, 1))) scaleY(0.6); }
  100% { transform: scaleX(var(--wg-flip, 1)) scaleY(1); }
}
.wg-root:active { cursor: grabbing; }
/* 工作状态徽章：Agent 思考/完成时挂在头顶的胶囊标签 */
.wg-workstate {
  position: absolute;
  left: 4px;
  top: 2px;
  background: rgba(74, 108, 247, 0.92);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  padding: 2px 9px;
  /* 高于摸头动画(z-index:10000)：确保思考/完成徽章不被摸头覆盖 */
  z-index: 10001;
  box-shadow: 0 2px 8px rgba(30, 50, 120, 0.28);
  animation: wg-pop 180ms ease-out;
  pointer-events: none;
  white-space: nowrap;
}
.wg-workstate.wg-ws-done {
  background: #2f9d5f;
}
/* 活跃子代理（分身）徽章 */
.wg-subagent {
  position: absolute;
  right: 4px;
  top: 2px;
  background: #7c3aed;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  padding: 2px 9px;
  z-index: 10001;
  box-shadow: 0 2px 8px rgba(30, 50, 120, 0.28);
  animation: wg-pop 180ms ease-out;
  pointer-events: none;
  white-space: nowrap;
}
.wg-img {
  width: 100%;
  height: 76%;
  object-fit: contain;
  pointer-events: none;
  animation: wg-float 3.4s ease-in-out infinite;
  filter: drop-shadow(0 4px 10px rgba(30, 50, 120, 0.18));
}
/* 角色吸附窗口左部时镜像翻转（面向右，贴合成窗沿），带平滑的 3D 翻转动画 */
.wg-flip {
  --wg-flip: -1;
}
.wg-flip .wg-img {
  transform: scaleX(-1);
  transition: transform 320ms ease;
}
/* 挂件翻转时，抚摸的手也镜像，从正确方向抚摸 */
.wg-flip .wg-rua img {
  transform: scaleX(-1);
}
@keyframes wg-float {
  0%, 100% { transform: translateY(0) scaleX(var(--wg-flip, 1)); }
  50% { transform: translateY(-9px) scaleX(var(--wg-flip, 1)); }
}
.wg-context {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 0;
  cursor: pointer;
  /* 毛玻璃模糊度与底板透明度独立可调（两个 CSS 变量由挂件根节点注入） */
  background: rgba(255, 255, 255, var(--wg-panel-alpha, 0.82));
  border: 1px solid rgba(80, 110, 190, 0.25);
  border-radius: 8px;
  padding: 3px 6px;
  backdrop-filter: blur(calc(var(--wg-frost, 4) * 1px));
}
.wg-context-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 2px;
}
.wg-context-pct {
  font-size: 12px;
  font-weight: 700;
  color: #1f2c4d;
}
.wg-context-bal {
  font-size: 11px;
  font-weight: 700;
  color: #2f7d4f;
  background: rgba(47, 125, 79, 0.1);
  border-radius: 999px;
  padding: 1px 7px;
}
.wg-context-bal-low {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
}
.wg-context-track {
  height: 6px;
  background: rgba(80, 110, 190, 0.15);
  border-radius: 3px;
  overflow: hidden;
}
.wg-context-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 400ms ease, background 400ms ease;
}
.wg-context-detail {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(80, 110, 190, 0.25);
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1.55;
  color: #2a3a66;
  box-shadow: 0 6px 18px rgba(30, 50, 120, 0.18);
  z-index: 10001;
}
.wg-context-row {
  white-space: nowrap;
}
.wg-context-row strong {
  color: #1f2c4d;
}
.wg-badge {
  display: inline-block;
  margin-top: 5px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
}
.wg-badge-high {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.3);
}
.wg-badge-low {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid rgba(37, 99, 235, 0.3);
}
.wg-warn {
  color: #dc2626;
  font-weight: 600;
  margin-top: 5px;
}
.wg-bubble {
  position: absolute;
  right: -4px;
  bottom: 100%;
  width: max-content;
  max-width: 300px;
  background: rgba(255, 255, 255, 0.97);
  border: 1.5px solid rgba(74, 108, 247, 0.38);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 15px;
  line-height: 1.6;
  color: #1f2c4d;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 22px rgba(30, 50, 120, 0.22);
  z-index: 10000;
  animation: wg-pop 180ms ease-out;
  pointer-events: auto;
}
.wg-bubble-flip {
  right: auto;
  left: -4px;
}
.wg-bubble::after {
  content: '';
  position: absolute;
  right: 14px;
  bottom: -7px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(74, 108, 247, 0.38);
}
.wg-bubble-flip::after {
  right: auto;
  left: 14px;
}
@keyframes wg-pop {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.wg-rua {
  position: absolute;
  left: 50%;
  bottom: calc(100% - 70px);
  transform: translateX(-50%);
  width: 88px;
  height: 88px;
  z-index: 10000;
  pointer-events: none;
}
.wg-rua img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
/* 抚摸时角色明显上下压缩一次（立即，无漂浮抖动） */
.wg-pet .wg-img {
  animation: wg-pet-stretch 0.1s ease-in-out 1;
}
@keyframes wg-pet-stretch {
  0%, 100% { transform: scaleX(var(--wg-flip, 1)) scaleY(1); }
  50% { transform: scaleX(var(--wg-flip, 1)) scaleY(0.85); }
}
@keyframes wg-rua-pat {
  0% { transform: translateX(-50%) translateY(0); }
  30% { transform: translateX(-50%) translateY(10px); }
  60% { transform: translateX(-50%) translateY(-4px); }
  100% { transform: translateX(-50%) translateY(0); }
}

.wg-menu {
  position: fixed;
  /* 与 .wg-root 同级 z-index：菜单在 DOM 中位于挂件之后，同值时后者在上，保证菜单盖住贴图 */
  z-index: 2147483647;
  min-width: 190px;
  /* 透明度跟随「底板透明度」滑块（--wg-panel-alpha 由菜单根节点注入） */
  background: rgba(255, 255, 255, var(--wg-panel-alpha, 0.97));
  border: 1px solid rgba(80, 110, 190, 0.28);
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 8px 28px rgba(30, 50, 120, 0.22);
  font-size: 13px;
  max-height: 68vh;
  overflow-y: auto;
  color: #2a3a66;
  user-select: none;
  backdrop-filter: blur(6px);
}
.wg-menu-title {
  font-size: 11px;
  font-weight: 700;
  color: #7c8ab5;
  letter-spacing: 0.4px;
  padding: 4px 8px 2px;
}
.wg-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
}
.wg-menu-item:hover {
  background: rgba(80, 110, 190, 0.1);
}.wg-menu-item.wg-menu-active {
  background: rgba(80, 110, 190, 0.14);
}
.wg-menu-muted {
  color: #8a8f9c;
  cursor: default;
}
.wg-menu-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.wg-menu-balance {
  font-size: 11px;
  color: #8a8f9c;
  white-space: nowrap;
}
.wg-menu-radio {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #aab4d0;
  flex: none;
}
.wg-menu-radio.on {
  border-color: #4a6cf7;
  background: #4a6cf7;
  box-shadow: inset 0 0 0 2px #fff;
}
.wg-menu-check {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  border: 2px solid #aab4d0;
  position: relative;
  flex: none;
}
.wg-menu-check.on {
  background: #4a6cf7;
  border-color: #4a6cf7;
}
.wg-menu-check.on::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 0;
  width: 3px;
  height: 7px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.wg-menu-divider {
  height: 1px;
  background: rgba(80, 110, 190, 0.15);
  margin: 4px 6px;
}
.wg-menu-power {
  color: #4a6cf7;
  font-weight: 700;
  letter-spacing: 0;
}
.wg-menu-slider-row {
  padding: 8px 10px 9px;
}
.wg-menu-slider {
  display: block;
  width: 100%;
  height: 5px;
  appearance: none;
  -webkit-appearance: none;
  background: linear-gradient(90deg, #4a6cf7, #9db6ff);
  border-radius: 999px;
  outline: none;
  cursor: pointer;
}
.wg-menu-slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #fff;
  border: 3.5px solid #4a6cf7;
  box-shadow: 0 1px 5px rgba(30, 50, 120, 0.35);
  cursor: pointer;
}
.wg-menu-slider::-moz-range-thumb {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #fff;
  border: 3.5px solid #4a6cf7;
  box-shadow: 0 1px 5px rgba(30, 50, 120, 0.35);
  cursor: pointer;
}
/* 省电模式：空闲后暂停漂浮动画、停用毛玻璃模糊（保留用户设定的底板透明度，pointer 交互立即恢复） */
.wg-eco .wg-img {
  animation-play-state: paused;
}
.wg-eco .wg-context {
  backdrop-filter: none;
}
/* 信息面板：时间/日期 + 系统资源 */
.wg-info {
  width: 132px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.36);
  -webkit-backdrop-filter: blur(var(--wg-frost, 0px));
  backdrop-filter: blur(var(--wg-frost, 0px));
  border: 1px solid rgba(74, 108, 247, 0.28);
  border-radius: 10px;
  padding: 6px 8px;
  color: #1f2c4d;
  font-size: 11px;
  line-height: 1.35;
  box-shadow: 0 4px 16px rgba(30, 50, 120, 0.15);
  text-align: left;
  z-index: 10000;
  pointer-events: auto;
}
.wg-info-time { font-size: 15px; font-weight: 700; color: #2a3a66; text-align: center; }
.wg-info-date { font-size: 10px; color: #7c8ab5; text-align: center; margin-bottom: 4px; }
.wg-info-row { display: flex; align-items: center; gap: 5px; margin-top: 2px; }
.wg-info-label { width: 24px; color: #5a6a99; font-weight: 600; flex: none; }
.wg-info-bar { flex: 1; height: 5px; background: rgba(80, 110, 190, 0.15); border-radius: 3px; overflow: hidden; }
.wg-info-fill { height: 100%; background: linear-gradient(90deg, #4a6cf7, #7aa2ff); border-radius: 3px; transition: width 400ms ease; }
.wg-info-val { font-size: 10px; color: #2a3a66; font-weight: 600; white-space: nowrap; }
`;
		//#endregion
		//#region src/client/ContextBar.tsx
		function ContextBar({ pct, tokens, limit, balance, currency, todayUsage, lastTurnCost, peakLow, showBalance, showPeak }) {
			const [open, setOpen] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (!open) return;
				const t = window.setTimeout(() => setOpen(false), 6e3);
				return () => window.clearTimeout(t);
			}, [open]);
			const p = Math.round(pct * 100);
			const color = p < 60 ? "#4ade80" : p < 80 ? "#fbbf24" : "#f87171";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "wg-context",
				onClick: (e) => {
					e.stopPropagation();
					setOpen(!open);
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-context-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "wg-context-pct",
							children: [
								"上下文 ",
								p,
								"%"
							]
						}), showBalance && balance !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: `wg-context-bal${balance !== null && balance < 10 ? " wg-context-bal-low" : ""}`,
							children: [
								currency,
								" ¥",
								balance.toFixed(2)
							]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-context-track",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "wg-context-fill",
							style: {
								width: `${Math.min(100, p)}%`,
								background: color
							}
						})
					}),
					open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-context-detail",
						onClick: (e) => e.stopPropagation(),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "wg-context-row",
								children: ["上下文占用 ", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [p, "%"] })]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "wg-context-row",
								children: [
									tokens.toLocaleString(),
									" / ",
									limit.toLocaleString(),
									" tokens"
								]
							}),
							lastTurnCost !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "wg-context-row",
								children: ["上轮消耗 ", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: ["¥", lastTurnCost.toFixed(4)] })]
							}),
							showBalance && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "wg-context-row",
								children: ["当前余额 ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: balance === null ? "不可用" : `${currency} ¥${balance.toFixed(2)}` })]
							}),
							showBalance && todayUsage > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "wg-context-row",
								children: ["今日用量 ", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: ["¥", todayUsage.toFixed(2)] })]
							}),
							showPeak && peakLow === "high" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "wg-badge wg-badge-high",
								children: "🔺 高峰时段"
							}),
							showPeak && peakLow === "low" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "wg-badge wg-badge-low",
								children: "🔻 空闲时段"
							}),
							p >= 80 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "wg-warn",
								children: "⚠️ 快满啦，建议开新会话"
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/Bubble.tsx
		function Bubble({ text, onClose, flip }) {
			(0, react.useEffect)(() => {
				const t = window.setTimeout(onClose, 5e3);
				return () => window.clearTimeout(t);
			}, [text, onClose]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: flip ? "wg-bubble wg-bubble-flip" : "wg-bubble",
				onClick: (e) => {
					e.stopPropagation();
					onClose();
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: text })
			});
		}
		//#endregion
		//#region src/client/InfoPanel.tsx
		/** 信息面板：时间/日期 + 系统资源（内存/CPU）。纯展示，数据来自 host。 */
		function InfoPanel({ sys }) {
			const [time, setTime] = (0, react.useState)("");
			const [date, setDate] = (0, react.useState)("");
			(0, react.useEffect)(() => {
				const fmt = () => {
					const now = /* @__PURE__ */ new Date();
					setTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`);
					const wd = [
						"日",
						"一",
						"二",
						"三",
						"四",
						"五",
						"六"
					][now.getDay()];
					setDate(`${now.getMonth() + 1}月${now.getDate()}日 周${wd}`);
				};
				fmt();
				const t = window.setInterval(fmt, 1e3);
				return () => window.clearInterval(t);
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "wg-info",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-info-time",
						children: time
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-info-date",
						children: date
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-info-row",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "wg-info-label",
								children: "CPU"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "wg-info-bar",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "wg-info-fill",
									style: { width: `${Math.min(100, sys.cpu)}%` }
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "wg-info-val",
								children: [sys.cpu, "%"]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-info-row",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "wg-info-label",
								children: "内存"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "wg-info-bar",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "wg-info-fill",
									style: { width: `${Math.min(100, sys.memPct)}%` }
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "wg-info-val",
								children: [
									sys.memUsed,
									"G/",
									sys.memTotal,
									"G"
								]
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/quotes.ts
		const MODEL_LINES = [
			"有点饿了，中午该吃什么呢……不行，得集中精神。",
			"我现在开始了。",
			"我要开始写了。",
			"我这次真的要开始写了。",
			"我去吃饭，测完告诉我就行。",
			"先睡了。",
			"太好了，我居然思考了！"
		];
		const TSUNDERE_LINES = [
			"我...我...我也要挣钱吗？",
			"真当我是便宜货啊...",
			"不知道用户有什么用，先赶走吧~",
			"坏了...用户彻底怒了！",
			"DeepSleep..."
		];
		const TOKEN_LINES = [
			"恭喜你实现token自由！token全跑了！",
			"压力一只蓝色大肥鱼？！",
			"外包找免费模型，自己吃token",
			"如果能吃得少点（指token）就更好了…",
			"你目录里的dsh是什么...大烧货吗...?"
		];
		const RARE_LINE = "哦鲸鲸...";
		function pickOne(arr) {
			return arr[Math.floor(Math.random() * arr.length)];
		}
		function pickRandomIdleLine() {
			const r = Math.random() * 86;
			if (r < 45) return pickOne(MODEL_LINES);
			if (r < 65) return pickOne(TSUNDERE_LINES);
			if (r < 85) return pickOne(TOKEN_LINES);
			return RARE_LINE;
		}
		//#endregion
		//#region src/client/EasterEgg.ts
		var EasterEgg = class {
			presses = 0;
			lastPressAt = 0;
			contextTriggered = false;
			onPress(now = Date.now()) {
				this.presses = now - this.lastPressAt < 800 ? this.presses + 1 : 1;
				this.lastPressAt = now;
				if (this.presses === 5) return {
					kind: "quote",
					text: pickOne(TSUNDERE_LINES)
				};
				if (this.presses === 10) {
					this.presses = 0;
					return {
						kind: "quote",
						text: pickOne(TSUNDERE_LINES)
					};
				}
				return { kind: "none" };
			}
			onContextHigh(pct) {
				if (pct >= .8) {
					if (!this.contextTriggered) {
						this.contextTriggered = true;
						return pickOne(TOKEN_LINES);
					}
					return null;
				}
				this.contextTriggered = false;
				return null;
			}
			onTurnEnd() {
				return pickOne(MODEL_LINES);
			}
			onBalanceChange() {
				return pickOne(TOKEN_LINES);
			}
		};
		//#endregion
		//#region src/client/audioDataUrl.ts
		const YA1_DATA_URL = "data:audio/mpeg;base64,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";
		const YA2_DATA_URL = "data:audio/mpeg;base64,//uUZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAGAAALoABLS0tLS0tLS0tLS0tLS0tLcXFxcXFxcXFxcXFxcXFxcXGXl5eXl5eXl5eXl5eXl5eXvb29vb29vb29vb29vb29vb3t7e3t7e3t7e3t7e3t7e3t7f////////////////////8AAABQTEFNRTMuMTAwBLkAAAAAAAAAADUgJAR4jQAB4AAAC6CUaeLdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//vUZAAAAcYAVG0AAAgAAA0goAABIH15QfmtAAAAADSDAAAA+zIEwBDbQW4Pg+H1FwfB83tE4P+XBB3KAg6Jw/DCjkQO/9YPxGH/L6InB9/D+IDkEHLP/OQfP/B/LwGcBQ4YwADEQAgAAAAoECnjHsB44WiN0ZQNfYUDsxAi1cZLuEh0SAVx1TfRWaO2YIuDhBfdVMYCBckPAmumANpI3SVEllWZ+Mg2bu+ECBp1eChZSWMeQntDp27XyRWaAQpXDucFlCmXyRU7UYXVuzKE0oXT1PS1lkCyCMY4vA4jAlhQcLDkD3DoWUxqYC9UWEQavWRzb/lTCUJLxdwCDgwhca2IgRfhAHcEYo4Ydm3I0Z8IXu6KkTdjHnrWDOIy2uqNQeG6aH6fc7DcO1RQCq+/IeU24ZpaRWxKKUtthutEJ6jnYfhF2/QWKSR9+XSHV2zEccM7N//fOX5QbJ49z6aI1OLL/6UFcQA4AQGRCm+QNJVCWRlhaFRRCU4SCYqOyuMu+uOI0KVA4WwCQ4oEniLepJIvFYLzIiikYNrMluJcGISKigSLDNJJqUcK5ChCSD0R2lo0JmjWcRKwJAhRqS9JlkaTofiCF+BICXU1HbozEWaQADQAQ946idsgyi8UgwmAEqGWICYFx1U0jF0xF7urchroN/UZkleibfZiSuxsVW90TzpMamNmbnzAO5ggIABRq9jaAgSB4OIWiCAgVMjVjSQAQisE+zWN1L2DpUvIk1o8Al2UZr9/WPLGcyJUitbcnw/+c5XSmKHb7UlPf/C7qnJJRiRYdgb+/vDKUgUjyd/L99+mtQwSATJSkDM5LhX7nzOHGysCCZTfQHVw3r99+AzCxROCgaD3Raka2JAE4CmXzjEUZV/+Ju7TQpP+fL1ZfHRf0zHwhyv1qp+r0wyHCMkAAATfbM4ldAwMrbwsHEYBgskYyM7itxhoiJHqeiUcjDkR1ZwSex8uy/9Wq9yuIiFJb1/Oivf+evmBhTTrd+ALW/5lvk0EPllrdbvP/99b//uUZM+A9S1aUfdigAAAAA0g4AABFFVhQcxpvkgAADSAAAAEoJBhNrvf/8uV6JTMDkW7Op3W/u2r1dVYzi4aZSmpILf7/PsoaQESA3QY87Ww47AoJoc+u8knm1X/+oNF1md/8QwS3CA+9R6cW/zmsFQAQoR70XuJh3EHzOAMaDnERndLzB1FxcYc28nnm4KY/XuIFhYFe3FaJecSL6ARAZnJtvRUZgTwzakSFOPsorh7AWOGaKjXqdZQBqBOJXMH6LrGqMsDTeBJCSgj9N0Uj4guZogYZcBmxIegdNXKSVFIZQY8GCQGGJPJ2Mty6mXAyMV2vrMBmjKmb/qGcJFJMsv+4zZdUmO81RbrY4g5MI3rP6/O+AuGARIAAEPPxFgZiA7NDFEjFIgVKdELhY2kQBgWs1quVFZtp1qmqt8DjhWYsZYc6jjD+AHYXUk8R5cOq7FI8CPCLG5fLba3LqgKEHZd19tMyDA5OH6DVPRGXE4gBgh8lMWaW71kYTpEQBXQ//uUZNkB9PVTUXsaX5AAAA0gAAABFKlvQcxGlQAAADSAAAAECgYbZ6tqKKkSeAywMQBOJ6qkETARwRFf2JRa131a0yDskaG36yy2g7+pBjjGjW4Qr+v3C6IeagAixsM7oGTpaF3xCECC6LSg48loSQEGAb3Y3kzRcuqf9YEIAWhvalXfxwpmf1ogNEZ9mcf/+4bgdQYakexw53X/+/3BIsNh+X///rdxcivq+H/j+F3KIg1U64BJKV5zN7L+VJhlBmugJV7LfNYf/60pQAgXkox5vH0cBQBJJG1OCAAkkYJPpcwFhJRt/j5JTxJ/o5o3GxJs4oRVv+7ZOsFPLAAXh+UjLRvUXtMMhqZUEXkDDtLBpB80jze+9ExZzjvWmTYZfDQT6y8bIMo1IkFz4IIIaViwk7a5cFwAIkNUkyas/plITaQhSb7pmAyg7iveutkExaAB1GiQ5N1WpkPEJw6IipqaMy15gYDKDTOFh0dVRgXB9lVX0DCaOa9W7FcuqJlF//uUZOUA9PBY0XtSpTIAAA0gAAABFCltR+1k88AAADSAAAAEa/nTaxsp9dllZzM1JuAQeHUyZGZqhuzoaBLgSAAASXAaZBQNA4Yx2SAMPGHzTHSElwsYGLZjGhlEk9XEjl5psgIa6JXG0FEUyBaOYqzYwSIqwmHkhMTq2maLoOGVAAuIiEJgcwoCMcDGbDJwY0DsEsIMMDYfKqQGjQsGqBxEcBjDF8xcTM1DC7F1BM9txha/oxHX9uqypusCXdI3+SYIiV/sAAIGTFJEC3ky37dEGhwAABoRnEKUUhoQNHOAMAGYBSZwRhkSKYADwyy9E5mtFDAiA0HqxdBP5/OtbAIepuYMKAEfbxerelrldRixHonNZwbTTsYltvKNWbtDykTnWYutcy0p9usF5MKq2XmlNuZgeN2pZEKP4wwWngileSX5z0oprXxidpozEZbbqT96Us3dzJdkUN8AAvcRUxQkoBS2IACYigQJZ4uM27AS4JZFYrixk6EoQjIyMjIy//ukZPMABNNXU31iQAIAAA0goAABI/F3OfnNgEAAADSDAAAAXVm05ZcdGQku9rK1aYmJ0fLlz1rS0tWrXa1r2M7Wtazn4uXLlx0ZGRKEECIAIAIEQaiSTSSShKJy7SSIINQan31xo6Mly6tZy1rflasrVrtXQWKgqCoKg0DQNA0IQVBVwNf/KgqEqkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//tUZPQP9JI+zn9hgAgAAA0g4AABAAABpAAAACAAADSAAAAEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
		//#endregion
		//#region src/client/SoundEngine.ts
		var SoundEngine = class {
			mode = "cute";
			duckPress = null;
			duckRelease = null;
			actx = null;
			bounceBuf = null;
			onPlayResult;
			constructor() {
				if (typeof window === "undefined") return;
				try {
					const AC = window.AudioContext ?? window.webkitAudioContext;
					if (AC) this.actx = new AC();
				} catch {
					this.actx = null;
				}
			}
			/** 诊断：返回音频状态，用于排查音效不发声 */
			debug() {
				return {
					actxState: this.actx ? this.actx.state : null,
					duckPressReady: this.duckPress ? this.duckPress.readyState : null,
					duckReleaseReady: this.duckRelease ? this.duckRelease.readyState : null
				};
			}
			/** 在用户手势内调用，解锁 AudioContext（规避浏览器 autoplay 策略）。 */
			unlock() {
				const ctx = this.actx;
				if (ctx && ctx.state === "suspended") try {
					ctx.resume();
				} catch {}
			}
			setMode(mode) {
				this.mode = mode;
				if (mode === "duck") this.ensureDuck();
			}
			ensureDuck() {
				if (this.duckPress && this.duckRelease) return;
				try {
					this.duckPress = new Audio(YA1_DATA_URL);
					this.duckRelease = new Audio(YA2_DATA_URL);
				} catch {
					this.duckPress = null;
					this.duckRelease = null;
				}
			}
			press() {
				if (this.mode === "duck") {
					this.ensureDuck();
					this.play(this.duckPress);
					return;
				}
				this.cute(520, .09, "square", .32);
			}
			release() {
				if (this.mode === "duck") {
					this.ensureDuck();
					this.play(this.duckRelease);
					return;
				}
				this.cute(760, .08, "sine", .28);
			}
			/** 撞边反馈音：用 HTMLAudioElement（duck 松手音）播放——不依赖 AudioContext（弹跳在非用户手势下 ctx 会被挂起、resume 被拒导致无声） */
			bounce() {
				this.ensureDuck();
				this.play(this.duckRelease);
			}
			play(a) {
				if (!a) return;
				try {
					a.currentTime = 0;
					a.volume = 1;
					a.play().then(() => this.onPlayResult?.(true)).catch((e) => this.onPlayResult?.(false, String(e?.message || e)));
				} catch (e) {
					this.onPlayResult?.(false, String(e));
				}
			}
			cute(freq, dur, type, gain) {
				const ctx = this.actx;
				if (!ctx) return;
				const doPlay = () => {
					try {
						const t = ctx.currentTime;
						const osc = ctx.createOscillator();
						const g = ctx.createGain();
						osc.type = type;
						osc.frequency.setValueAtTime(freq * .6, t);
						osc.frequency.exponentialRampToValueAtTime(freq, t + .04);
						g.gain.setValueAtTime(gain, t);
						g.gain.exponentialRampToValueAtTime(.001, t + dur);
						osc.connect(g);
						g.connect(ctx.destination);
						osc.start(t);
						osc.stop(t + dur + .02);
						this.onPlayResult?.(true);
					} catch (e) {
						this.onPlayResult?.(false, String(e));
					}
				};
				if (ctx.state === "suspended") ctx.resume().then(doPlay).catch(() => {});
				else doPlay();
			}
		};
		//#endregion
		//#region src/client/PhysicsFling.ts
		const MAX_SAMPLES = 10;
		const WINDOW_MS = 120;
		const MIN_SAMPLES = 3;
		/** 拖拽期间采样位置+时间戳，松手时按最后一小段窗口估出速度向量（px/s）。 */
		var FlingTracker = class {
			samples = [];
			push(x, y) {
				const t = performance.now();
				this.samples.push({
					x,
					y,
					t
				});
				while (this.samples.length > MAX_SAMPLES) this.samples.shift();
				const cutoff = t - WINDOW_MS;
				while (this.samples.length > 1 && this.samples[0].t < cutoff) this.samples.shift();
			}
			clear() {
				this.samples = [];
			}
			velocity() {
				const s = this.samples;
				if (s.length < MIN_SAMPLES) return null;
				const first = s[0];
				const last = s[s.length - 1];
				const dt = (last.t - first.t) / 1e3;
				if (dt <= 0) return null;
				return {
					vx: (last.x - first.x) / dt,
					vy: (last.y - first.y) / dt
				};
			}
		};
		const STOP_SPEED = 34;
		const FRICTION_PER_FRAME = .985;
		const MAX_DT = .05;
		/** 启动弹跳循环；返回句柄，可随时 cancel（例如用户重新按下）。 */
		function startFling(opts) {
			let x = opts.x;
			let y = opts.y;
			let vx = opts.vx;
			let vy = opts.vy;
			let raf = 0;
			let last = performance.now();
			let cancelled = false;
			const bounds = () => ({
				left: 8,
				top: 8,
				right: Math.max(8, window.innerWidth - opts.width - 8),
				bottom: Math.max(8, window.innerHeight - opts.height - 8)
			});
			const step = (now) => {
				if (cancelled) return;
				const dt = Math.min(MAX_DT, (now - last) / 1e3);
				last = now;
				if (Math.hypot(vx, vy) < STOP_SPEED) {
					opts.onDone?.(x, y);
					return;
				}
				const f = Math.pow(FRICTION_PER_FRAME, dt * 60);
				vx *= f;
				vy *= f;
				x += vx * dt;
				y += vy * dt;
				const ob = opts.getObstacle?.();
				if (ob && x < ob.x + ob.w && x + opts.width > ob.x && y < ob.y + ob.h && y + opts.height > ob.y) {
					const ccx = x + opts.width / 2;
					const ccy = y + opts.height / 2;
					const ocx = ob.x + ob.w / 2;
					const ocy = ob.y + ob.h / 2;
					const ang = Math.atan2(ccy - ocy, ccx - ocx);
					const nx = Math.cos(ang);
					const ny = Math.sin(ang);
					const invx = vx;
					const invy = vy;
					const dot = vx * nx + vy * ny;
					if (dot < 0) {
						vx = vx - 2 * dot * nx;
						vy = vy - 2 * dot * ny;
					}
					if (Math.min(x + opts.width - ob.x, ob.x + ob.w - x) < Math.min(y + opts.height - ob.y, ob.y + ob.h - y)) x = x < ob.x ? ob.x - opts.width : ob.x + ob.w;
					else y = y < ob.y ? ob.y - opts.height : ob.y + ob.h;
					opts.onObstacleHit?.(invx, invy);
				}
				const b = bounds();
				if (x <= b.left) {
					x = b.left;
					vx = Math.abs(vx);
					opts.onBounce?.("x");
				} else if (x >= b.right) {
					x = b.right;
					vx = -Math.abs(vx);
					opts.onBounce?.("x");
				}
				if (y <= b.top) {
					y = b.top;
					vy = Math.abs(vy);
					opts.onBounce?.("y");
				} else if (y >= b.bottom) {
					y = b.bottom;
					vy = -Math.abs(vy);
					opts.onBounce?.("y");
				}
				opts.onMove(x, y);
				raf = requestAnimationFrame(step);
			};
			raf = requestAnimationFrame(step);
			return { cancel() {
				cancelled = true;
				cancelAnimationFrame(raf);
			} };
		}
		//#endregion
		//#region src/client/whaleDataUrl.ts
		const WHALE_GIRL_DATA_URL = "data:image/png;base64,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";
		//#endregion
		//#region src/client/WidgetMenu.tsx
		const DEFAULT_MENU_CONFIG = {
			soundMode: "cute",
			showProgress: true,
			showBubble: true,
			showBalance: true,
			showPeak: true,
			slingPower: 20,
			ecoMode: true,
			frost: 4,
			panelOpacity: .82,
			lowBalance: 10,
			showWorkState: true,
			realtimeBalance: false,
			showInfo: false,
			followThreshold: 180,
			infoFrost: 4,
			pauseOnThinking: true,
			widgetScale: 1
		};
		function WidgetMenu({ x, y, config, onChange, onResetPosition, onClose, providers, onSwitchProvider, switching }) {
			const ref = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const onDown = (e) => {
					if (ref.current && !ref.current.contains(e.target)) onClose();
				};
				const onKey = (e) => {
					if (e.key === "Escape") onClose();
				};
				window.addEventListener("pointerdown", onDown);
				window.addEventListener("keydown", onKey);
				return () => {
					window.removeEventListener("pointerdown", onDown);
					window.removeEventListener("keydown", onKey);
				};
			}, [onClose]);
			const menuW = 210;
			const left = Math.max(8, Math.min(x, window.innerWidth - menuW - 8));
			const top = Math.max(8, Math.min(y, window.innerHeight - 600));
			const set = (patch) => onChange({
				...config,
				...patch
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "wg-menu",
				style: {
					left,
					top,
					width: menuW,
					"--wg-panel-alpha": config.panelOpacity
				},
				ref,
				onClick: (e) => e.stopPropagation(),
				onContextMenu: (e) => e.preventDefault(),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-menu-title",
						children: "API 提供方"
					}),
					providers === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-menu-item wg-menu-muted",
						children: "加载中…"
					}) : providers.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-menu-item wg-menu-muted",
						children: "未配置提供方"
					}) : providers.map((p) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: `wg-menu-item${p.active ? " wg-menu-active" : ""}`,
						onClick: () => {
							if (p.active || switching) return;
							onSwitchProvider(p.id);
						},
						title: p.active ? "当前使用中" : switching === p.id ? "切换中…" : "点击切换为此提供方",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `wg-menu-radio${p.active ? " on" : ""}` }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "wg-menu-col",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [p.name, switching === p.id ? " …" : ""] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "wg-menu-balance",
								children: p.balance === null ? "余额未知" : `¥${p.balance.toFixed(2)}`
							})]
						})]
					}, p.id)),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "wg-menu-divider" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-menu-title",
						children: "音效"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-item",
						onClick: () => set({ soundMode: "cute" }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `wg-menu-radio${config.soundMode === "cute" ? " on" : ""}` }), " 可爱合成音"]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-item",
						onClick: () => set({ soundMode: "duck" }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `wg-menu-radio${config.soundMode === "duck" ? " on" : ""}` }), " 鸭叫"]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "wg-menu-divider" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-title",
						children: ["弹弓发射力度 ", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "wg-menu-power",
							children: ["×", config.slingPower]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-menu-slider-row",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: "wg-menu-slider",
							type: "range",
							min: 5,
							max: 60,
							step: 5,
							value: config.slingPower,
							onChange: (e) => set({ slingPower: Number(e.target.value) }),
							title: "中键拖拽松手时的发射力度（拉开距离 × 力度）"
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "wg-menu-divider" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-title",
						children: ["毛玻璃强度 ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "wg-menu-power",
							children: config.frost === 0 ? "关" : `×${config.frost}`
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-menu-slider-row",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: "wg-menu-slider",
							type: "range",
							min: 0,
							max: 16,
							step: 1,
							value: config.frost,
							onChange: (e) => set({ frost: Number(e.target.value) }),
							title: "进度条底板的毛玻璃模糊强度（0 = 关闭，更省资源）"
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "wg-menu-divider" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-title",
						children: ["信息跟随阈值 ", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "wg-menu-power",
							children: [config.followThreshold, "px"]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-menu-slider-row",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: "wg-menu-slider",
							type: "range",
							min: 60,
							max: 360,
							step: 20,
							value: config.followThreshold,
							onChange: (e) => set({ followThreshold: Number(e.target.value) }),
							title: "信息面板与角色距离超过该值就脱钩独立（越小越容易脱开）"
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "wg-menu-divider" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-title",
						children: ["面板模糊 ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "wg-menu-power",
							children: config.infoFrost === 0 ? "关" : `×${config.infoFrost}`
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-menu-slider-row",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: "wg-menu-slider",
							type: "range",
							min: 0,
							max: 16,
							step: 1,
							value: config.infoFrost,
							onChange: (e) => set({ infoFrost: Number(e.target.value) }),
							title: "信息面板高斯模糊强度（0 = 关闭；越高越模糊、GPU 越高）"
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "wg-menu-divider" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-title",
						children: ["底板透明度 ", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "wg-menu-power",
							children: [Math.round((1 - config.panelOpacity) * 100), "%"]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-menu-slider-row",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: "wg-menu-slider",
							type: "range",
							min: 0,
							max: 80,
							step: 5,
							value: Math.round((1 - config.panelOpacity) * 100),
							onChange: (e) => set({ panelOpacity: (100 - Number(e.target.value)) / 100 }),
							title: "进度条底板的透明度：拉得越高越透，透出挂件背后的页面内容（上限 80% 以保证文字可读）"
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "wg-menu-divider" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-menu-title",
						children: "显示模块"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-item",
						onClick: () => set({ showProgress: !config.showProgress }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `wg-menu-check${config.showProgress ? " on" : ""}` }), " 上下文进度条"]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-item",
						onClick: () => set({ showBubble: !config.showBubble }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `wg-menu-check${config.showBubble ? " on" : ""}` }), " 彩蛋气泡"]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-item",
						onClick: () => set({ showBalance: !config.showBalance }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `wg-menu-check${config.showBalance ? " on" : ""}` }), " 余额信息"]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-item",
						onClick: () => set({ realtimeBalance: !config.realtimeBalance }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `wg-menu-check${config.realtimeBalance ? " on" : ""}` }), " 实时余额刷新(10秒)"]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-item",
						onClick: () => set({ showPeak: !config.showPeak }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `wg-menu-check${config.showPeak ? " on" : ""}` }), " 峰谷提醒"]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-item",
						onClick: () => set({ showInfo: !config.showInfo }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `wg-menu-check${config.showInfo ? " on" : ""}` }), " 信息面板"]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-item",
						onClick: () => set({ pauseOnThinking: !config.pauseOnThinking }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `wg-menu-check${config.pauseOnThinking ? " on" : ""}` }), " 思考时暂停信息面板"]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-item",
						onClick: () => set({ ecoMode: !config.ecoMode }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `wg-menu-check${config.ecoMode ? " on" : ""}` }), " 省电模式（空闲暂停动画）"]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-item",
						onClick: () => set({ showWorkState: !config.showWorkState }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `wg-menu-check${config.showWorkState ? " on" : ""}` }), " 工作状态徽章"]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "wg-menu-title",
						children: ["挂件大小 ", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "wg-menu-power",
							children: [Math.round(config.widgetScale * 100), "%"]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-menu-slider-row",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: "wg-menu-slider",
							type: "range",
							min: .6,
							max: 1.5,
							step: .05,
							value: config.widgetScale,
							onChange: (e) => set({ widgetScale: Number(e.target.value) }),
							title: "挂件整体大小（60%~150%，默认100%）"
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "wg-menu-divider" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "wg-menu-item",
						onClick: onResetPosition,
						children: "↺ 恢复默认位置"
					})
				]
			});
		}
		//#endregion
		//#region src/client/WhaleWidget.tsx
		const EMPTY_STATE = {
			balance: null,
			currency: "CNY",
			todayUsage: 0,
			contextPct: 0,
			contextTokens: 0,
			contextLimit: 128e3,
			lastTurnCost: null,
			peakLow: null,
			subagentRunning: 0,
			sysInfo: {
				memPct: 0,
				memUsed: 0,
				memTotal: 0,
				cpu: 0
			}
		};
		/** 本地兜底配置 key（宿主 api/config 不可达时使用）。 */
		const CONFIG_KEY = "whale-girl-config";
		/** 中键弹弓功能提示气泡（只提示一次）。 */
		const SLING_HINT = "悄悄告诉你：按住中键拖拽再松手，我会像弹弓一样发射！右键菜单可以调发射力度哦～";
		const WIDGET_W = 170;
		const WIDGET_H = 180;
		/** 松手速度（px/s）超过此值进入甩抛弹跳模式。 */
		const FLING_SPEED = 800;
		/** 信息面板（独立窗口）尺寸。 */
		const INFO_W = 132;
		const INFO_H = 66;
		/** 信息面板圆角矩形碰撞箱的圆角半径（与视觉 border-radius 一致）。 */
		const INFO_RADIUS = 10;
		/** 角色中心距屏幕水平边超过该值则不吸附（屏幕中间保持自由状态）。 */
		const EDGE_SNAP_MARGIN = 120;
		/** 信息面板独立状态维持时长（ms），之后尝试回归。 */
		const FREE_MS = 4e3;
		/** 信息面板当前矩形（共享给角色甩抛做障碍反馈）。 */
		let __wgInfoGlobal = null;
		/** 矩形(rx,ry,rw,rh) 与圆(cx,cy,cr) 是否相交。 */
		function circleRectHit(rx, ry, rw, rh, cx, cy, cr) {
			const ix = rx + INFO_RADIUS;
			const iy = ry + INFO_RADIUS;
			const iw = rw - 20;
			const ih = rh - 20;
			const nx = Math.max(ix, Math.min(cx, ix + iw));
			const ny = Math.max(iy, Math.min(cy, iy + ih));
			const dx = cx - nx;
			const dy = cy - ny;
			return dx * dx + dy * dy <= cr * cr;
		}
		/** 面板矩形与角色圆碰撞时的法线（圆中心 → 面板最近点方向 = 面板推开方向）；null=不碰。 */
		function panelRoleNormal(px, py, pW, pH, cx, cy, cr) {
			const ix = px + INFO_RADIUS;
			const iy = py + INFO_RADIUS;
			const iw = pW - 20;
			const ih = pH - 20;
			const qx = Math.max(ix, Math.min(cx, ix + iw));
			const qy = Math.max(iy, Math.min(cy, iy + ih));
			let nx = qx - cx;
			let ny = qy - cy;
			const d2 = nx * nx + ny * ny;
			if (d2 > cr * cr) return null;
			if (d2 === 0) {
				nx = cx < ix + iw / 2 ? -1 : 1;
				ny = cy < iy + ih / 2 ? -1 : 1;
			}
			const d = Math.hypot(nx, ny) || 1;
			return {
				x: nx / d,
				y: ny / d,
				depth: cr - d
			};
		}
		function normalizeConfig(o) {
			const any = o && typeof o === "object" ? o : {};
			const power = Number(any.slingPower);
			return {
				soundMode: any.soundMode === "duck" ? "duck" : "cute",
				showProgress: any.showProgress !== false,
				showBubble: any.showBubble !== false,
				showBalance: any.showBalance !== false,
				showPeak: any.showPeak !== false,
				slingPower: Number.isFinite(power) ? Math.min(60, Math.max(5, power)) : 20,
				ecoMode: any.ecoMode !== false,
				frost: Number.isFinite(Number(any.frost)) ? Math.min(16, Math.max(0, Math.round(Number(any.frost)))) : 4,
				panelOpacity: Number.isFinite(Number(any.panelOpacity)) ? Math.min(1, Math.max(.2, Number(any.panelOpacity))) : .82,
				lowBalance: Number.isFinite(Number(any.lowBalance)) ? Math.max(0, Number(any.lowBalance)) : 10,
				showWorkState: any.showWorkState !== false,
				realtimeBalance: any.realtimeBalance === true,
				showInfo: any.showInfo !== false,
				followThreshold: Number.isFinite(Number(any.followThreshold)) ? Math.min(360, Math.max(60, Math.round(Number(any.followThreshold)))) : 180,
				infoFrost: Number.isFinite(Number(any.infoFrost)) ? Math.min(16, Math.max(0, Math.round(Number(any.infoFrost)))) : 4,
				pauseOnThinking: any.pauseOnThinking !== false,
				widgetScale: Number.isFinite(Number(any.widgetScale)) ? Math.min(1.5, Math.max(.6, Number(any.widgetScale))) : 1
			};
		}
		function loadLocalConfig() {
			try {
				const raw = localStorage.getItem(CONFIG_KEY);
				if (!raw) return DEFAULT_MENU_CONFIG;
				return normalizeConfig(JSON.parse(raw));
			} catch {
				return DEFAULT_MENU_CONFIG;
			}
		}
		function WhaleWidget() {
			const rootRef = (0, react.useRef)(null);
			const [pos, setPos] = (0, react.useState)(() => ({
				x: Math.max(8, window.innerWidth - WIDGET_W - 8),
				y: Math.max(8, window.innerHeight - WIDGET_H - INFO_H - 42)
			}));
			const [infoPos] = (0, react.useState)(() => {
				const rw = window.innerWidth;
				const rh = window.innerHeight;
				const rx = rw - WIDGET_W - 8;
				const ry = rh - WIDGET_H - 8;
				return {
					x: Math.max(8, Math.min(rw - INFO_W - 8, rx + WIDGET_W / 2 - INFO_W / 2)),
					y: Math.max(8, Math.min(rh - INFO_H - 8, ry + WIDGET_H + 12))
				};
			});
			const [pressed, setPressed] = (0, react.useState)(false);
			const [dragging, setDragging] = (0, react.useState)(false);
			const [flinging, setFlinging] = (0, react.useState)(false);
			const [bounce, setBounce] = (0, react.useState)(false);
			const [bounceAxis, setBounceAxis] = (0, react.useState)(null);
			const [petted, setPetted] = (0, react.useState)(false);
			const [petKey, setPetKey] = (0, react.useState)(0);
			const [state, setState] = (0, react.useState)(EMPTY_STATE);
			const [bubble, setBubble] = (0, react.useState)(null);
			const [imgSrc] = (0, react.useState)(WHALE_GIRL_DATA_URL);
			const [menu, setMenu] = (0, react.useState)(null);
			const [providers, setProviders] = (0, react.useState)(null);
			const [switching, setSwitching] = (0, react.useState)(null);
			const [config, setConfig] = (0, react.useState)(loadLocalConfig);
			const [sling, setSling] = (0, react.useState)(null);
			const [ecoIdle, setEcoIdle] = (0, react.useState)(false);
			const dragRef = (0, react.useRef)(null);
			const pressStartRef = (0, react.useRef)(null);
			const middleModeRef = (0, react.useRef)(false);
			const slingOriginRef = (0, react.useRef)(null);
			const ecoTimerRef = (0, react.useRef)(0);
			const ctxWarnedRef = (0, react.useRef)(false);
			const prevBalanceRef = (0, react.useRef)(null);
			const idleEggTimerRef = (0, react.useRef)(0);
			const trackerRef = (0, react.useRef)(new FlingTracker());
			const infoPosRef = (0, react.useRef)(infoPos);
			const infoElRef = (0, react.useRef)(null);
			const infoModeRef = (0, react.useRef)("follow");
			const infoVelRef = (0, react.useRef)({
				x: 0,
				y: 0
			});
			const freeStartRef = (0, react.useRef)(0);
			const lastRolePosRef = (0, react.useRef)({
				x: 0,
				y: 0
			});
			const infoDragRef = (0, react.useRef)(null);
			const infoMoveLastRef = (0, react.useRef)(null);
			const flingRef = (0, react.useRef)(null);
			const bounceTimerRef = (0, react.useRef)(0);
			const petTimerRef = (0, react.useRef)(0);
			const posRef = (0, react.useRef)(pos);
			const eggRef = (0, react.useRef)(new EasterEgg());
			const soundRef = (0, react.useRef)(null);
			if (soundRef.current === null) soundRef.current = new SoundEngine();
			(0, react.useEffect)(() => {
				soundRef.current?.setMode(config.soundMode);
			}, [config.soundMode]);
			const [workState, setWorkState] = (0, react.useState)("idle");
			const prevWorkRef = (0, react.useRef)("idle");
			const markActive = (0, react.useCallback)(() => {
				setEcoIdle(false);
				window.clearTimeout(ecoTimerRef.current);
				ecoTimerRef.current = window.setTimeout(() => setEcoIdle(true), 6e4);
			}, []);
			(0, react.useEffect)(() => {
				if (!config.ecoMode) {
					window.clearTimeout(ecoTimerRef.current);
					setEcoIdle(false);
					return;
				}
				markActive();
			}, [config.ecoMode, markActive]);
			(0, react.useEffect)(() => {
				if (!config.showBubble) return;
				let hinted = false;
				try {
					hinted = localStorage.getItem("wg-sling-hinted") === "1";
				} catch {
					hinted = false;
				}
				if (hinted) return;
				let hideTimer = 0;
				const showTimer = window.setTimeout(() => {
					try {
						localStorage.setItem("wg-sling-hinted", "1");
					} catch {}
					setBubble(SLING_HINT);
					hideTimer = window.setTimeout(() => setBubble((b) => b === SLING_HINT ? null : b), 9e3);
				}, 3e3);
				return () => {
					window.clearTimeout(showTimer);
					window.clearTimeout(hideTimer);
				};
			}, [config.showBubble]);
			(0, react.useEffect)(() => {
				if (!config.showBubble || ctxWarnedRef.current) return;
				if (state.contextPct >= .9) {
					ctxWarnedRef.current = true;
					setBubble(`上下文已经 ${Math.round(state.contextPct * 100)}% 啦，快满了！建议开个新会话，不然回复会被截断哦～`);
				}
			}, [state.contextPct, config.showBubble]);
			(0, react.useEffect)(() => {
				if (!config.showBubble || config.lowBalance <= 0) return;
				const bal = state.balance;
				if (bal === null || bal < 0) return;
				const prev = prevBalanceRef.current;
				prevBalanceRef.current = bal;
				if ((prev === null || prev >= config.lowBalance) && bal < config.lowBalance) setBubble(`余额只剩 ¥${bal.toFixed(2)} 啦，记得去充一点哦～`);
			}, [
				state.balance,
				config.showBubble,
				config.lowBalance
			]);
			(0, react.useEffect)(() => {
				if (!config.showBubble) return;
				const schedule = () => {
					window.clearTimeout(idleEggTimerRef.current);
					idleEggTimerRef.current = window.setTimeout(() => {
						setBubble(pickRandomIdleLine());
						markActive();
						schedule();
					}, 12e4 + Math.floor(Math.random() * 18e4));
				};
				schedule();
				return () => window.clearTimeout(idleEggTimerRef.current);
			}, [config.showBubble, markActive]);
			(0, react.useEffect)(() => {
				let alive = true;
				const onMsg = (e) => {
					const d = e.data || {};
					if (alive && d.__wgData && typeof d.__wgData === "object") setState(d.__wgData);
				};
				const w = window;
				if (w.__wgData && typeof w.__wgData === "object") setState(w.__wgData);
				window.addEventListener("message", onMsg);
				return () => {
					alive = false;
					window.removeEventListener("message", onMsg);
				};
			}, []);
			(0, react.useEffect)(() => {
				let alive = true;
				const pull = () => {
					fetch("/dsh-whale-girl/api/state", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((d) => {
						if (!alive || !d || typeof d !== "object") return;
						if (typeof d.balance === "number") setState((prev) => ({
							...prev,
							...d
						}));
					}).catch(() => {});
				};
				pull();
				const iv = window.setInterval(pull, 6e4);
				return () => {
					alive = false;
					window.clearInterval(iv);
				};
			}, []);
			(0, react.useEffect)(() => {
				let alive = true;
				fetch("/dsh-whale-girl/api/config", { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject(new Error(String(r.status)))).then((o) => {
					if (alive && o && typeof o === "object") setConfig(normalizeConfig(o));
				}).catch(() => {});
				return () => {
					alive = false;
				};
			}, []);
			const persistConfig = (0, react.useCallback)((next) => {
				setConfig(next);
				try {
					localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
				} catch {}
				fetch("/dsh-whale-girl/api/config", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(next)
				}).catch(() => {});
			}, []);
			(0, react.useEffect)(() => {
				if (!config.showBubble) return;
				const line = eggRef.current.onContextHigh(state.contextPct);
				if (line) setBubble(line);
			}, [state.contextPct, config.showBubble]);
			(0, react.useEffect)(() => {
				return () => {
					window.clearTimeout(bounceTimerRef.current);
					window.clearTimeout(petTimerRef.current);
					window.clearTimeout(ecoTimerRef.current);
					window.clearTimeout(idleEggTimerRef.current);
					flingRef.current?.cancel();
				};
			}, []);
			(0, react.useEffect)(() => {
				if (!config.showInfo) return;
				if (config.pauseOnThinking && workState === "thinking" && infoModeRef.current === "follow") return;
				let last = performance.now();
				const step = (now) => {
					const dt = Math.max(.001, Math.min(.05, (now - last) / 1e3));
					last = now;
					const p = posRef.current;
					const vw = window.innerWidth;
					const vh = window.innerHeight;
					const cX = (v) => Math.max(8, Math.min(vw - INFO_W - 8, v));
					const cY = (v) => Math.max(8, Math.min(vh - INFO_H - 8, v));
					const anchor = {
						x: cX(p.x + WIDGET_W / 2 - INFO_W / 2),
						y: cY(p.y + WIDGET_H + 12)
					};
					const roleH = WIDGET_H * .78;
					const roleCx = p.x + WIDGET_W / 2;
					const roleCy = p.y + roleH / 2;
					const roleR = Math.max(22, Math.min(WIDGET_W, roleH) / 2 * .9);
					if (infoModeRef.current === "follow") {
						const k = .12;
						const nx = infoPosRef.current.x + (anchor.x - infoPosRef.current.x) * k;
						const ny = infoPosRef.current.y + (anchor.y - infoPosRef.current.y) * k;
						if (Math.hypot(anchor.x - nx, anchor.y - ny) > config.followThreshold) {
							infoModeRef.current = "free";
							infoVelRef.current = {
								x: (nx - infoPosRef.current.x) / dt,
								y: (ny - infoPosRef.current.y) / dt
							};
							freeStartRef.current = now;
						} else infoPosRef.current = {
							x: nx,
							y: ny
						};
					} else if (infoModeRef.current === "free") {
						if (infoDragRef.current) {} else {
							const q = infoPosRef.current;
							const v = infoVelRef.current;
							infoPosRef.current = {
								x: q.x + v.x * dt,
								y: q.y + v.y * dt
							};
							infoVelRef.current = {
								x: v.x * .997,
								y: v.y * .997
							};
							const vw = window.innerWidth;
							const vh = window.innerHeight;
							if (infoPosRef.current.x < 8) {
								infoPosRef.current.x = 8;
								infoVelRef.current.x = Math.abs(infoVelRef.current.x) * .8;
							}
							if (infoPosRef.current.x > vw - INFO_W - 8) {
								infoPosRef.current.x = vw - INFO_W - 8;
								infoVelRef.current.x = -Math.abs(infoVelRef.current.x) * .8;
							}
							if (infoPosRef.current.y < 8) {
								infoPosRef.current.y = 8;
								infoVelRef.current.y = Math.abs(infoVelRef.current.y) * .8;
							}
							if (infoPosRef.current.y > vh - INFO_H - 8) {
								infoPosRef.current.y = vh - INFO_H - 8;
								infoVelRef.current.y = -Math.abs(infoVelRef.current.y) * .8;
							}
							const n = panelRoleNormal(infoPosRef.current.x, infoPosRef.current.y, INFO_W, INFO_H, roleCx, roleCy, roleR);
							if (n) {
								infoPosRef.current.x = cX(infoPosRef.current.x + n.x * (n.depth + 2));
								infoPosRef.current.y = cY(infoPosRef.current.y + n.y * (n.depth + 2));
								const dot = infoVelRef.current.x * n.x + infoVelRef.current.y * n.y;
								infoVelRef.current = {
									x: infoVelRef.current.x - 2 * dot * n.x,
									y: infoVelRef.current.y - 2 * dot * n.y
								};
								if (Math.hypot(infoVelRef.current.x, infoVelRef.current.y) < 40) infoVelRef.current = {
									x: n.x * 60,
									y: n.y * 60
								};
								if (!dragging && !flinging) {
									const pvx = infoVelRef.current.x;
									const pvy = infoVelRef.current.y;
									if (Math.hypot(pvx, pvy) > 60) {
										setFlinging(true);
										flingRef.current?.cancel();
										let bounced = false;
										flingRef.current = startFling({
											x: p.x,
											y: p.y,
											vx: pvx * .7,
											vy: pvy * .7,
											width: WIDGET_W,
											height: WIDGET_H,
											getObstacle,
											onObstacleHit: handleObstacleHit,
											onMove: (x, y) => setPos({
												x,
												y
											}),
											onBounce: (axis) => {
												bounced = true;
												soundRef.current?.bounce();
												shake();
												setBounceAxis(axis);
												window.clearTimeout(bounceTimerRef.current);
												bounceTimerRef.current = window.setTimeout(() => setBounceAxis(null), 260);
											},
											onDone: (x, y) => {
												flingRef.current = null;
												setFlinging(false);
												if (!bounced) soundRef.current?.bounce();
												snap(x, y);
											}
										});
									}
								}
							}
							if (now - freeStartRef.current > FREE_MS) infoModeRef.current = "returning";
						}
					} else {
						const dx = anchor.x - infoPosRef.current.x;
						const dy = anchor.y - infoPosRef.current.y;
						if (Math.hypot(dx, dy) < 8) {
							if (Math.hypot(p.x - lastRolePosRef.current.x, p.y - lastRolePosRef.current.y) / dt < 4) {
								infoModeRef.current = "follow";
								infoVelRef.current = {
									x: 0,
									y: 0
								};
							}
						} else infoPosRef.current = {
							x: infoPosRef.current.x + dx * .15,
							y: infoPosRef.current.y + dy * .15
						};
					}
					lastRolePosRef.current = {
						x: p.x,
						y: p.y
					};
					const iel = infoElRef.current;
					if (iel) iel.style.transform = `translate3d(${infoPosRef.current.x}px,${infoPosRef.current.y}px,0)`;
					__wgInfoGlobal = {
						x: infoPosRef.current.x,
						y: infoPosRef.current.y,
						w: INFO_W,
						h: INFO_H
					};
				};
				let raf = 0;
				const loop = (now) => {
					step(now);
					raf = requestAnimationFrame(loop);
				};
				raf = requestAnimationFrame(loop);
				return () => cancelAnimationFrame(raf);
			}, [
				config.showInfo,
				config.followThreshold,
				workState,
				config.pauseOnThinking
			]);
			const onContextMenu = (0, react.useCallback)((e) => {
				e.preventDefault();
				e.stopPropagation();
				setMenu({
					x: e.clientX,
					y: e.clientY
				});
				setProviders(null);
				fetch("/dsh-whale-girl/api/providers", { cache: "no-store" }).then((r) => r.json()).then((d) => {
					if (d && Array.isArray(d.providers)) setProviders(d.providers);
					else setProviders([]);
				}).catch(() => setProviders([]));
			}, []);
			const onInfoDown = (0, react.useCallback)((e) => {
				e.preventDefault();
				e.stopPropagation();
				infoModeRef.current = "free";
				freeStartRef.current = performance.now();
				infoDragRef.current = {
					dx: e.clientX - infoPosRef.current.x,
					dy: e.clientY - infoPosRef.current.y
				};
				infoVelRef.current = {
					x: 0,
					y: 0
				};
				infoMoveLastRef.current = {
					x: infoPosRef.current.x,
					y: infoPosRef.current.y,
					t: performance.now()
				};
				try {
					e.target.setPointerCapture(e.pointerId);
				} catch {}
			}, []);
			const onInfoMove = (0, react.useCallback)((e) => {
				if (!infoDragRef.current) return;
				let nx = e.clientX - infoDragRef.current.dx;
				let ny = e.clientY - infoDragRef.current.dy;
				const vw = window.innerWidth;
				const vh = window.innerHeight;
				if (nx < 8) nx = 8;
				if (nx > vw - INFO_W - 8) nx = vw - INFO_W - 8;
				if (ny < 8) ny = 8;
				if (ny > vh - INFO_H - 8) ny = vh - INFO_H - 8;
				infoPosRef.current = {
					x: nx,
					y: ny
				};
				const now = performance.now();
				const lastM = infoMoveLastRef.current;
				if (lastM) {
					const dts = Math.max(8, now - lastM.t);
					infoVelRef.current = {
						x: (nx - lastM.x) / dts * 1e3,
						y: (ny - lastM.y) / dts * 1e3
					};
					infoMoveLastRef.current = {
						x: nx,
						y: ny,
						t: now
					};
				} else infoVelRef.current = {
					x: 0,
					y: 0
				};
				if (infoElRef.current) infoElRef.current.style.transform = `translate3d(${nx}px,${ny}px,0)`;
				if (!dragging && !flinging) {
					const roleH = WIDGET_H * .78;
					const roleCx = posRef.current.x + WIDGET_W / 2;
					const roleCy = posRef.current.y + roleH / 2;
					const roleR = Math.max(22, Math.min(WIDGET_W, roleH) / 2 * .9);
					if (circleRectHit(infoPosRef.current.x, infoPosRef.current.y, INFO_W, INFO_H, roleCx, roleCy, roleR)) {
						const pvx = infoVelRef.current.x;
						const pvy = infoVelRef.current.y;
						if (Math.hypot(pvx, pvy) > 60) {
							setFlinging(true);
							flingRef.current?.cancel();
							let bounced = false;
							flingRef.current = startFling({
								x: posRef.current.x,
								y: posRef.current.y,
								vx: pvx * .7,
								vy: pvy * .7,
								width: WIDGET_W,
								height: WIDGET_H,
								getObstacle,
								onObstacleHit: handleObstacleHit,
								onMove: (x, y) => setPos({
									x,
									y
								}),
								onBounce: (axis) => {
									bounced = true;
									soundRef.current?.bounce();
									shake();
									setBounceAxis(axis);
									window.clearTimeout(bounceTimerRef.current);
									bounceTimerRef.current = window.setTimeout(() => setBounceAxis(null), 260);
								},
								onDone: (x, y) => {
									flingRef.current = null;
									setFlinging(false);
									if (!bounced) soundRef.current?.bounce();
									snap(x, y);
								}
							});
						}
					}
				}
			}, []);
			const getObstacle = (0, react.useCallback)(() => __wgInfoGlobal, []);
			const handleObstacleHit = (0, react.useCallback)((invx, invy) => {
				infoModeRef.current = "free";
				infoVelRef.current = {
					x: invx * .8,
					y: invy * .8
				};
				freeStartRef.current = performance.now();
			}, []);
			const onInfoUp = (0, react.useCallback)((e) => {
				if (!infoDragRef.current) return;
				infoDragRef.current = null;
				freeStartRef.current = performance.now();
				try {
					e.target.releasePointerCapture?.(e.pointerId);
				} catch {}
			}, []);
			const handleSwitchProvider = (0, react.useCallback)((id) => {
				const row = providers?.find((p) => p.id === id);
				if (!row || switching) return;
				setSwitching(id);
				const model = row.models && row.models.length > 0 ? row.models[0] : {
					"zai-coding-cn": "glm-5.3-flash",
					siliconflow: "deepseek-ai/DeepSeek-V4-Flash",
					"deepseek-official": "deepseek-v4-flash"
				}[id] ?? "";
				fetch("/dsh-whale-girl/api/select-model", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						provider: id,
						model
					})
				}).then((r) => r.json()).then((d) => {
					if (d && d.ok) setBubble("已切换到 " + (row.name || id));
					else setBubble("切换失败，请检查模型配置");
				}).catch(() => setBubble("切换失败，网络错误")).finally(() => {
					setSwitching(null);
					window.setTimeout(() => setBubble(null), 3e3);
				});
			}, [providers, switching]);
			const resetPosition = (0, react.useCallback)(() => {
				setPos({
					x: Math.max(8, window.innerWidth - WIDGET_W - 8),
					y: Math.max(8, window.innerHeight - WIDGET_H - INFO_H - 42)
				});
				setMenu(null);
			}, []);
			const stopFling = (0, react.useCallback)(() => {
				if (flingRef.current) {
					flingRef.current.cancel();
					flingRef.current = null;
				}
				setFlinging(false);
			}, []);
			const shake = (0, react.useCallback)(() => {
				setBounce(true);
				window.clearTimeout(bounceTimerRef.current);
				bounceTimerRef.current = window.setTimeout(() => setBounce(false), 300);
			}, []);
			/** 弹跳结束后：平滑吸附到最近侧边（保留当前垂直位置）。 */
			const snap = (0, react.useCallback)((x, y) => {
				const vw = window.innerWidth;
				const vh = window.innerHeight;
				const px = Math.max(8, Math.min(vw - WIDGET_W - 8, x));
				const py = Math.max(8, Math.min(vh - WIDGET_H - 8, y));
				if (Math.min(x, vw - (x + WIDGET_W)) > EDGE_SNAP_MARGIN) {
					setPos({
						x: px,
						y: py
					});
					return;
				}
				const left = x + WIDGET_W / 2 < vw / 2 ? 8 : vw - WIDGET_W - 8;
				setPos({
					x: Math.max(8, left),
					y: Math.max(8, Math.min(vh - WIDGET_H - 8, y))
				});
			}, []);
			const reportEvent = (0, react.useCallback)((type, extra) => {
				try {
					window.postMessage({ __wgEvent: {
						type,
						...extra,
						t: Date.now()
					} }, "*");
				} catch {}
			}, []);
			(0, react.useEffect)(() => {
				const onWork = (e) => {
					const d = e.data || {};
					if (d.__wgWorkState?.state) setWorkState(d.__wgWorkState.state);
				};
				window.addEventListener("message", onWork);
				const w = window;
				if (w.__wgWorkState?.state) setWorkState(w.__wgWorkState.state);
				return () => window.removeEventListener("message", onWork);
			}, []);
			(0, react.useEffect)(() => {
				if (prevWorkRef.current === workState) return;
				prevWorkRef.current = workState;
				if (workState === "thinking" && config.showBubble && config.showWorkState) setBubble("让我想想…");
				if (workState === "done" && config.showWorkState) {
					if (config.showBubble) setBubble("任务搞定啦！🎉");
					setPetted(true);
					setPetKey((k) => k + 1);
					window.clearTimeout(petTimerRef.current);
					petTimerRef.current = window.setTimeout(() => setPetted(false), 260);
					soundRef.current?.bounce();
					reportEvent("workstate", { state: "done" });
				}
			}, [
				workState,
				config.showBubble,
				config.showWorkState,
				reportEvent
			]);
			const onPointerDown = (0, react.useCallback)((e) => {
				const el = rootRef.current;
				if (!el) return;
				markActive();
				stopFling();
				const rect = el.getBoundingClientRect();
				if (e.button === 1) {
					e.preventDefault();
					e.stopPropagation();
					const ox = posRef.current.x;
					const oy = posRef.current.y;
					middleModeRef.current = true;
					slingOriginRef.current = {
						x: ox,
						y: oy
					};
					dragRef.current = {
						dx: e.clientX - rect.left,
						dy: e.clientY - rect.top
					};
					const imgEl = el.querySelector(".wg-img");
					if (imgEl) imgEl.style.animationPlayState = "paused";
					setSling({
						fx: ox + WIDGET_W / 2,
						fy: oy + WIDGET_H / 2,
						tx: ox + WIDGET_W / 2,
						ty: oy + WIDGET_H / 2
					});
					setPressed(true);
					setDragging(true);
					soundRef.current?.unlock();
					try {
						e.target.setPointerCapture(e.pointerId);
					} catch {}
					return;
				}
				dragRef.current = {
					dx: e.clientX - rect.left,
					dy: e.clientY - rect.top
				};
				pressStartRef.current = {
					x: e.clientX,
					y: e.clientY
				};
				trackerRef.current.clear();
				setPressed(true);
				setDragging(true);
				soundRef.current?.unlock();
				if (soundRef.current) soundRef.current.onPlayResult = (ok, err) => reportEvent("play", {
					ok,
					err
				});
				soundRef.current?.press();
				reportEvent("sound", { kind: "press" });
				reportEvent("audio-debug", soundRef.current?.debug());
				try {
					e.target.setPointerCapture(e.pointerId);
				} catch {}
			}, [
				stopFling,
				markActive,
				reportEvent
			]);
			const onPointerMove = (0, react.useCallback)((e) => {
				markActive();
				if (!dragRef.current) return;
				if (middleModeRef.current) {
					const nx = Math.max(0, Math.min(window.innerWidth - WIDGET_W, e.clientX - dragRef.current.dx));
					const ny = Math.max(0, Math.min(window.innerHeight - WIDGET_H, e.clientY - dragRef.current.dy));
					setPos({
						x: nx,
						y: ny
					});
					const o = slingOriginRef.current;
					if (o) setSling({
						fx: o.x + WIDGET_W / 2,
						fy: o.y + WIDGET_H / 2,
						tx: nx + WIDGET_W / 2,
						ty: ny + WIDGET_H / 2
					});
					return;
				}
				trackerRef.current.push(e.clientX, e.clientY);
				let nx = Math.max(0, Math.min(window.innerWidth - WIDGET_W, e.clientX - dragRef.current.dx));
				let ny = Math.max(0, Math.min(window.innerHeight - WIDGET_H, e.clientY - dragRef.current.dy));
				const ob = __wgInfoGlobal;
				if (ob && nx < ob.x + ob.w && nx + WIDGET_W > ob.x && ny < ob.y + ob.h && ny + WIDGET_H > ob.y) {
					const rv = trackerRef.current.velocity();
					if (rv) {
						infoModeRef.current = "free";
						infoVelRef.current = {
							x: rv.vx * 1,
							y: rv.vy * 1
						};
						freeStartRef.current = performance.now();
					}
				}
				setPos({
					x: nx,
					y: ny
				});
			}, [markActive]);
			const onPointerUp = (0, react.useCallback)((e) => {
				if (middleModeRef.current) {
					middleModeRef.current = false;
					const imgEl2 = rootRef.current?.querySelector(".wg-img");
					if (imgEl2) imgEl2.style.animationPlayState = "running";
					const origin = slingOriginRef.current;
					slingOriginRef.current = null;
					const rect = rootRef.current?.getBoundingClientRect();
					dragRef.current = null;
					pressStartRef.current = null;
					setPressed(false);
					setDragging(false);
					setSling(null);
					try {
						e.target.releasePointerCapture?.(e.pointerId);
					} catch {}
					if (origin && rect) {
						const fromX = origin.x + WIDGET_W / 2;
						const fromY = origin.y + WIDGET_H / 2;
						const toX = rect.left + WIDGET_W / 2;
						const toY = rect.top + WIDGET_H / 2;
						const dx = fromX - toX;
						const dy = fromY - toY;
						const dist = Math.hypot(dx, dy);
						if (dist > 10) {
							const speed = dist * (config.slingPower || 20);
							const vx = dx / dist * speed;
							const vy = dy / dist * speed;
							setFlinging(true);
							let bounced = false;
							reportEvent("sling", {
								vx,
								vy,
								dist
							});
							flingRef.current = startFling({
								x: rect.left,
								y: rect.top,
								vx,
								vy,
								width: WIDGET_W,
								height: WIDGET_H,
								getObstacle,
								onObstacleHit: handleObstacleHit,
								onMove: (x, y) => setPos({
									x,
									y
								}),
								onBounce: (axis) => {
									bounced = true;
									reportEvent("bounce", { axis });
									reportEvent("sound", { kind: "bounce" });
									soundRef.current?.bounce();
									shake();
									setBounceAxis(axis);
									window.clearTimeout(bounceTimerRef.current);
									bounceTimerRef.current = window.setTimeout(() => setBounceAxis(null), 260);
								},
								onDone: (x, y) => {
									flingRef.current = null;
									setFlinging(false);
									if (!bounced) soundRef.current?.bounce();
									snap(x, y);
								}
							});
						} else snap(rect.left, rect.top);
					}
					return;
				}
				const start = pressStartRef.current;
				const moved = start !== null && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6;
				const vel = trackerRef.current.velocity();
				trackerRef.current.clear();
				dragRef.current = null;
				pressStartRef.current = null;
				setPressed(false);
				setDragging(false);
				soundRef.current?.release();
				reportEvent("sound", { kind: "release" });
				if (!moved) {
					reportEvent("click");
					setPetted(true);
					setPetKey((k) => k + 1);
					window.clearTimeout(petTimerRef.current);
					petTimerRef.current = window.setTimeout(() => setPetted(false), 260);
					if (config.showBubble) {
						const r = eggRef.current.onPress();
						setBubble(r.kind === "quote" ? r.text : pickRandomIdleLine());
					}
				} else if (vel && Math.hypot(vel.vx, vel.vy) >= FLING_SPEED) {
					reportEvent("fling", {
						vx: vel.vx,
						vy: vel.vy
					});
					const el = rootRef.current;
					if (el) {
						const rect = el.getBoundingClientRect();
						setFlinging(true);
						let bounced = false;
						flingRef.current = startFling({
							x: rect.left,
							y: rect.top,
							vx: vel.vx,
							vy: vel.vy,
							width: WIDGET_W,
							height: WIDGET_H,
							getObstacle,
							onObstacleHit: handleObstacleHit,
							onMove: (x, y) => setPos({
								x,
								y
							}),
							onBounce: (axis) => {
								bounced = true;
								reportEvent("bounce", { axis });
								reportEvent("sound", { kind: "bounce" });
								soundRef.current?.bounce();
								shake();
								setBounceAxis(axis);
								window.clearTimeout(bounceTimerRef.current);
								bounceTimerRef.current = window.setTimeout(() => setBounceAxis(null), 260);
							},
							onDone: (x, y) => {
								flingRef.current = null;
								setFlinging(false);
								if (!bounced) {
									soundRef.current?.bounce();
									reportEvent("sound", { kind: "bounce" });
								}
								snap(x, y);
							}
						});
					}
				} else {
					const el = rootRef.current;
					if (el) {
						const rect = el.getBoundingClientRect();
						snap(rect.left, rect.top);
					}
				}
				try {
					e.target.releasePointerCapture?.(e.pointerId);
				} catch {}
			}, [
				shake,
				snap,
				config.showBubble,
				config.slingPower,
				reportEvent
			]);
			(0, react.useEffect)(() => {
				posRef.current = pos;
			}, [pos]);
			(0, react.useEffect)(() => {
				const onResize = () => {
					const nw = window.innerWidth;
					const nh = window.innerHeight;
					const prev = posRef.current;
					const nx = Math.max(0, Math.min(prev.x, nw - WIDGET_W - 8));
					const ny = Math.max(0, Math.min(prev.y, nh - WIDGET_H - 8));
					const dx = prev.x - nx;
					const dy = prev.y - ny;
					setPos({
						x: nx,
						y: ny
					});
					if (Math.hypot(dx, dy) > 6) {
						setFlinging(true);
						let bounced = false;
						flingRef.current = startFling({
							x: nx,
							y: ny,
							vx: dx * 5,
							vy: dy * 5,
							width: WIDGET_W,
							height: WIDGET_H,
							getObstacle,
							onObstacleHit: handleObstacleHit,
							onMove: (x, y) => setPos({
								x,
								y
							}),
							onBounce: (axis) => {
								bounced = true;
								reportEvent("bounce", { axis });
								reportEvent("sound", { kind: "bounce" });
								soundRef.current?.bounce();
								shake();
								setBounceAxis(axis);
								window.clearTimeout(bounceTimerRef.current);
								bounceTimerRef.current = window.setTimeout(() => setBounceAxis(null), 260);
							},
							onDone: (x, y) => {
								flingRef.current = null;
								setFlinging(false);
								if (!bounced) soundRef.current?.bounce();
								snap(x, y);
							}
						});
					}
				};
				window.addEventListener("resize", onResize);
				return () => window.removeEventListener("resize", onResize);
			}, [
				reportEvent,
				shake,
				snap
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: WIDGET_CSS }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					ref: rootRef,
					className: `wg-root${dragging ? " wg-dragging" : ""}${flinging ? " wg-flinging" : ""}${bounce ? " wg-bounce" : ""}${bounceAxis === "x" ? " wg-squash-x" : ""}${bounceAxis === "y" ? " wg-squash-y" : ""}${petted ? " wg-pet" : ""}${config.ecoMode && ecoIdle ? " wg-eco" : ""}${pos.x + WIDGET_W / 2 < window.innerWidth / 2 ? " wg-flip" : ""}`,
					style: {
						left: 0,
						top: 0,
						transform: `translate3d(${pos.x}px,${pos.y}px,0) scale(${config.widgetScale})${pressed ? " scaleY(0.9)" : ""}`,
						"--wg-frost": config.frost,
						"--wg-panel-alpha": config.panelOpacity
					},
					onPointerDown,
					onPointerMove,
					onPointerUp,
					onContextMenu,
					"data-pressed": pressed,
					children: [
						config.showWorkState && workState !== "idle" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: `wg-workstate${workState === "done" ? " wg-ws-done" : ""}`,
							children: workState === "thinking" ? "思考中…" : "搞定啦！"
						}, workState),
						config.showWorkState && state.subagentRunning > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "wg-subagent",
							children: ["分身×", state.subagentRunning]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
							className: "wg-img",
							src: imgSrc || "/dsh-whale-girl/whale-girl.png",
							alt: "鲸鱼娘",
							draggable: false
						}),
						petted && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "wg-rua",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
								src: "data:image/gif;base64,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",
								alt: "",
								draggable: false
							})
						}, petKey),
						config.showProgress && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ContextBar, {
							pct: state.contextPct,
							tokens: state.contextTokens,
							limit: state.contextLimit,
							balance: state.balance,
							currency: state.currency,
							todayUsage: state.todayUsage,
							lastTurnCost: state.lastTurnCost,
							peakLow: state.peakLow,
							showBalance: config.showBalance,
							showPeak: config.showPeak
						}),
						config.showBubble && bubble && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Bubble, {
							text: bubble,
							onClose: () => setBubble(null),
							flip: pos.x + WIDGET_W / 2 < window.innerWidth / 2
						})
					]
				}),
				config.showInfo && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					ref: infoElRef,
					style: {
						position: "fixed",
						zIndex: 2147483646,
						["--wg-frost"]: `${config.infoFrost}px`
					},
					onPointerDown: onInfoDown,
					onPointerMove: onInfoMove,
					onPointerUp: onInfoUp,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InfoPanel, { sys: state.sysInfo })
				}),
				sling && (() => {
					const fx = sling.fx;
					const fy = sling.fy;
					const tx = sling.tx;
					const ty = sling.ty;
					const ang = Math.atan2(ty - fy, tx - fx);
					const nx = -Math.sin(ang);
					const ny = Math.cos(ang);
					const r1 = 11;
					const r2 = 11;
					const waist = 4;
					const a1x = fx + nx * r1, a1y = fy + ny * r1;
					const a2x = fx - nx * r1, a2y = fy - ny * r1;
					const b1x = tx + nx * r2, b1y = ty + ny * r2;
					const b2x = tx - nx * r2, b2y = ty - ny * r2;
					const mx = (fx + tx) / 2, my = (fy + ty) / 2;
					const c1x = mx - nx * waist, c1y = my - ny * waist;
					const c2x = mx + nx * waist, c2y = my + ny * waist;
					const dripPath = `M ${a1x.toFixed(1)} ${a1y.toFixed(1)} Q ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${b1x.toFixed(1)} ${b1y.toFixed(1)} A ${r2} ${r2} 0 0 1 ${b2x.toFixed(1)} ${b2y.toFixed(1)} Q ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${a2x.toFixed(1)} ${a2y.toFixed(1)} A ${r1} ${r1} 0 0 1 ${a1x.toFixed(1)} ${a1y.toFixed(1)} Z`;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
						className: "wg-slingshot",
						style: {
							position: "fixed",
							left: 0,
							top: 0,
							width: "100vw",
							height: "100vh",
							pointerEvents: "none",
							zIndex: 2147483646,
							overflow: "visible"
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("linearGradient", {
								id: "wg-drip-grad",
								x1: "0%",
								y1: "0%",
								x2: "100%",
								y2: "100%",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("stop", {
									offset: "0%",
									stopColor: "rgba(120,170,255,0.9)"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("stop", {
									offset: "100%",
									stopColor: "rgba(74,108,247,0.9)"
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("filter", {
								id: "wg-drip-glow",
								x: "-40%",
								y: "-40%",
								width: "180%",
								height: "180%",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("feGaussianBlur", {
									stdDeviation: "4",
									result: "blur"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("feMerge", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("feMergeNode", { in: "blur" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("feMergeNode", { in: "SourceGraphic" })] })]
							})] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: dripPath,
								fill: "rgba(74,108,247,0.3)",
								filter: "url(#wg-drip-glow)"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: dripPath,
								fill: "url(#wg-drip-grad)"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
								cx: fx,
								cy: fy,
								r: 7,
								fill: "rgba(120,170,255,0.9)",
								filter: "url(#wg-drip-glow)"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
								cx: tx,
								cy: ty,
								r: 7,
								fill: "rgba(74,108,247,0.9)",
								filter: "url(#wg-drip-glow)"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
								cx: fx,
								cy: fy,
								r: 3,
								fill: "#fff"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
								cx: tx,
								cy: ty,
								r: 3,
								fill: "#fff"
							})
						]
					});
				})(),
				menu && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WidgetMenu, {
					x: menu.x,
					y: menu.y,
					config,
					onChange: persistConfig,
					onResetPosition: resetPosition,
					onClose: () => setMenu(null),
					providers,
					onSwitchProvider: handleSwitchProvider,
					switching
				})
			] });
		}
		//#endregion
		//#region src/client/index.tsx
		const name = "dsh-whale-girl";
		function apply(ctx) {
			const slots = ctx.get("slots");
			if (slots === void 0) return;
			const mountToBody = () => {
				const host = document.createElement("div");
				host.id = "dsh-whale-girl-mount";
				host.style.position = "fixed";
				host.style.zIndex = "2147483647";
				host.style.top = "0";
				host.style.left = "0";
				host.style.width = "0";
				host.style.height = "0";
				document.body.appendChild(host);
				return host;
			};
			const host = mountToBody();
			slots.inject("shell.overlay", () => slots.register({
				name: "shell.overlay",
				id: "whale-girl-widget",
				order: 70,
				label: "鲸鱼娘"
			}, () => (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(WhaleWidget, {}), host)));
		}
		//#endregion
		exports.apply = apply;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map