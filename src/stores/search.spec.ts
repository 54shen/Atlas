import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNavStore } from './nav'
import { useSearchStore } from './search'
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
        links: [
          { id: 'l1', name: 'GitHub', url: 'https://github.com', order: 1 },
          { id: 'l2', name: 'MDN', url: 'https://developer.mozilla.org', order: 2 },
        ],
      },
      {
        id: 'g2',
        name: '影音',
        order: 2,
        links: [{ id: 'l3', name: 'Bilibili', url: 'https://www.bilibili.com', order: 1 }],
      },
    ],
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  const nav = useNavStore()
  nav.baseData = makeData()
  nav.loading = false
  useSearchStore().query = ''
})

describe('search store', () => {
  it('空关键词显示全部分组', () => {
    const search = useSearchStore()
    expect(search.visibleGroups).toHaveLength(2)
  })

  it('关键词过滤分组与站点', () => {
    const search = useSearchStore()
    search.query = 'github'
    expect(search.visibleGroups).toHaveLength(1)
    expect(search.visibleGroups[0].links.map((l) => l.id)).toEqual(['l1'])
  })

  it('按分组名匹配时保留整组', () => {
    const search = useSearchStore()
    search.query = '影音'
    expect(search.visibleGroups).toHaveLength(1)
    expect(search.visibleGroups[0].links).toHaveLength(1)
  })

  it('isEmptyResult：有输入且无匹配为 true', () => {
    const search = useSearchStore()
    expect(search.isEmptyResult).toBe(false)
    search.query = '不存在的站点'
    expect(search.isEmptyResult).toBe(true)
  })

  it('firstMatch：返回第一个匹配站点，无匹配为 null', () => {
    const search = useSearchStore()
    search.query = 'bili'
    expect(search.firstMatch?.name).toBe('Bilibili')
    search.query = ''
    expect(search.firstMatch?.id).toBe('l1')
    search.query = 'zzz'
    expect(search.firstMatch).toBeNull()
  })
})
