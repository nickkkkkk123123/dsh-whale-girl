import React from 'react'
import { createPortal } from 'react-dom'
import { WhaleWidget } from './WhaleWidget'

export const name = 'dsh-whale-girl'

export function apply(ctx: any) {
  const slots = ctx.get('slots')
  if (slots === undefined) return

  // 挂载到 shell.overlay 会被 better-sidebar 等固定定位容器遮挡（层叠上下文问题）。
  // 改用 React portal 直接渲染到 document.body 顶层，确保挂件永远在所有 UI 之上。
  const mountToBody = () => {
    const host = document.createElement('div')
    host.id = 'dsh-whale-girl-mount'
    // 独立层叠上下文 + 最高层级，防被其他插件覆盖。
    // 不设 pointer-events，让挂件（拖动/点击/右键菜单）正常交互。
    host.style.position = 'fixed'
    host.style.zIndex = '2147483647'
    host.style.top = '0'
    host.style.left = '0'
    host.style.width = '0'
    host.style.height = '0'
    document.body.appendChild(host)
    return host
  }

  const host = mountToBody()
  slots.inject('shell.overlay', () =>
    slots.register(
      { name: 'shell.overlay', id: 'whale-girl-widget', order: 70, label: '鲸鱼娘' },
      () => createPortal(<WhaleWidget />, host)
    )
  )
}
