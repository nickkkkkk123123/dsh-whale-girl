// 挂件样式（内联注入，避免 tsdown CSS 提取后无人加载）
export const WIDGET_CSS = `
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
  max-height: 58vh;
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
`
