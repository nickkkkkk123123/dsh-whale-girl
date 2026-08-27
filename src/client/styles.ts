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
`
