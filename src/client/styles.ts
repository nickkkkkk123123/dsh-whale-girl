// 挂件样式（内联注入，避免 tsdown CSS 提取后无人加载）
export const WIDGET_CSS = `
.wg-root {
  position: fixed;
  width: 170px;
  height: 170px;
  z-index: 9999;
  cursor: grab;
  user-select: none;
  touch-action: none;
  transition: transform 120ms ease, left 200ms ease, top 200ms ease;
}
.wg-root:active { cursor: grabbing; }
.wg-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  animation: wg-float 3.4s ease-in-out infinite;
  filter: drop-shadow(0 4px 10px rgba(30, 50, 120, 0.18));
}
@keyframes wg-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-9px); }
}
.wg-context {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 4px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(80, 110, 190, 0.25);
  border-radius: 8px;
  padding: 4px 6px;
  backdrop-filter: blur(4px);
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
  margin-top: 5px;
  font-size: 11px;
  line-height: 1.5;
  color: #2a3a66;
}
.wg-context-row {
  white-space: nowrap;
}
.wg-warn {
  color: #dc2626;
  font-weight: 600;
}
`
