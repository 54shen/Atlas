import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NavCard from './NavCard.vue'
import type { NavLink } from '@/types'

const link: NavLink = {
  id: 'l1',
  name: 'GitHub',
  url: 'https://github.com',
  desc: '代码托管',
  order: 1,
}

function mountCard(isEditing = false) {
  return mount(NavCard, { props: { link, isEditing } })
}

describe('NavCard', () => {
  it('非编辑模式不显示操作按钮', () => {
    const wrapper = mountCard()
    expect(wrapper.find('.card-actions').exists()).toBe(false)
  })

  it('编辑模式显示抓手 + 编辑 + 删除按钮', () => {
    const wrapper = mountCard(true)
    expect(wrapper.findAll('.mini-btn')).toHaveLength(2)
    expect(wrapper.find('.card-grip').exists()).toBe(true)
  })

  it('编辑/删除按钮触发对应事件', async () => {
    const wrapper = mountCard(true)
    const buttons = wrapper.findAll('.mini-btn')
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('卡片链接：新标签页打开并带 noopener', () => {
    const wrapper = mountCard()
    const a = wrapper.find('.nav-card')
    expect(a.attributes('href')).toBe('https://github.com')
    expect(a.attributes('target')).toBe('_blank')
    expect(a.attributes('rel')).toContain('noopener')
  })

  it('操作按钮点击不触发链接跳转（href 保持不变）', async () => {
    const wrapper = mountCard(true)
    await wrapper.findAll('.mini-btn')[1].trigger('click')
    expect(wrapper.find('.nav-card').attributes('href')).toBe('https://github.com')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })
})
