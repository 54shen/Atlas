import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import SearchBar from './SearchBar.vue'
import { useNavStore } from '@/stores/nav'
import { DATA_VERSION } from '@/utils/merge'
import type { NavData } from '@/types'

function makeData(): NavData {
  return {
    version: DATA_VERSION,
    updatedAt: '2026-08-11',
    settings: {
      searchEngine: 'bing',
      searchEngines: [{ id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={q}' }],
    },
    groups: [
      {
        id: 'g1',
        name: '开发',
        order: 1,
        links: [{ id: 'l1', name: 'GitHub', url: 'https://github.com', order: 1 }],
      },
    ],
  }
}

const openSpy = vi.fn()
let pinia: ReturnType<typeof createPinia>

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  localStorage.clear()
  openSpy.mockClear()
  vi.stubGlobal('open', openSpy)
  const nav = useNavStore()
  nav.baseData = makeData()
  nav.loading = false
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function mountBar() {
  return mount(SearchBar, { global: { plugins: [pinia] } })
}

describe('SearchBar', () => {
  it('输入网址回车：补全 https 并新窗口打开', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('.search-input')
    await input.setValue('example.com')
    await input.trigger('keydown.enter')
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener')
  })

  it('有匹配站点时回车：打开第一个匹配项', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('.search-input')
    await input.setValue('github')
    await input.trigger('keydown.enter')
    expect(openSpy).toHaveBeenCalledWith('https://github.com', '_blank', 'noopener')
  })

  it('无匹配时回车：跳转当前搜索引擎', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('.search-input')
    await input.setValue('不存在的关键词')
    await input.trigger('keydown.enter')
    expect(openSpy).toHaveBeenCalledWith(
      'https://www.bing.com/search?q=%E4%B8%8D%E5%AD%98%E5%9C%A8%E7%9A%84%E5%85%B3%E9%94%AE%E8%AF%8D',
      '_blank',
      'noopener',
    )
  })

  it('空输入回车：不做任何事', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('.search-input')
    await input.setValue('   ')
    await input.trigger('keydown.enter')
    expect(openSpy).not.toHaveBeenCalled()
  })

  it('展示引擎下拉与清空按钮', async () => {
    const wrapper = mountBar()
    expect(wrapper.find('.engine-select').exists()).toBe(true)
    expect(wrapper.findAll('.engine-select option')).toHaveLength(1)
    const input = wrapper.find('.search-input')
    await input.setValue('x')
    expect(wrapper.find('.search-clear').exists()).toBe(true)
  })
})
