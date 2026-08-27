import React from 'react'
import { WhaleWidget } from './WhaleWidget'

export const name = 'dsh-whale-girl'

export function apply(ctx: any) {
  const slots = ctx.get('slots')
  if (slots === undefined) return
  slots.inject('shell.overlay', () =>
    slots.register(
      { name: 'shell.overlay', id: 'whale-girl-widget', order: 70, label: '鲸鱼娘' },
      () => React.createElement(WhaleWidget)
    )
  )
}
