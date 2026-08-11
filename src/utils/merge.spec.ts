import { describe, expect, it } from 'vitest'
import { DATA_VERSION, isNavData, mergeNavData, normalizeOrder } from './merge'
import type { NavData } from '@/types'

function makeBase(): NavData {
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

describe('isNavData', () => {
  it('接受合法数据', () => {
    expect(isNavData(makeBase())).toBe(true)
  })

  it('拒绝空值 / 非对象', () => {
    expect(isNavData(null)).toBe(false)
    expect(isNavData('str')).toBe(false)
    expect(isNavData(42)).toBe(false)
  })

  it('拒绝缺少关键字段的数据', () => {
    const bad = makeBase()
    expect(isNavData({ ...bad, groups: undefined })).toBe(false)
    expect(isNavData({ ...bad, settings: undefined })).toBe(false)
    expect(isNavData({ ...bad, version: undefined })).toBe(false)
  })

  it('拒绝版本不匹配的数据', () => {
    const bad = makeBase()
    bad.version = DATA_VERSION + 1
    expect(isNavData(bad)).toBe(false)
  })
})

describe('mergeNavData', () => {
  const base = makeBase()

  it('local 为空时使用基线数据', () => {
    expect(mergeNavData(base, null)).toBe(base)
  })

  it('local 版本不匹配时回退基线', () => {
    const stale = makeBase()
    stale.version = DATA_VERSION - 1
    expect(mergeNavData(base, stale)).toBe(base)
  })

  it('local 非法时回退基线', () => {
    const bad = { ...makeBase(), groups: 'oops' } as unknown as NavData
    expect(mergeNavData(base, bad)).toBe(base)
  })

  it('local 合法时本地优先', () => {
    const local = makeBase()
    local.groups[0].links[0].name = '本地修改'
    const merged = mergeNavData(base, local)
    expect(merged.groups[0].links[0].name).toBe('本地修改')
  })
})

describe('normalizeOrder', () => {
  it('按 order 排序并重新编号为 1..n', () => {
    const d = makeBase()
    d.groups[0].links[0].order = 5
    d.groups[0].links.push({ id: 'l2', name: 'B', url: 'https://b.com', order: 1 })
    normalizeOrder(d)
    expect(d.groups[0].links.map((l) => l.order)).toEqual([1, 2])
    expect(d.groups[0].links.map((l) => l.id)).toEqual(['l2', 'l1'])
  })

  it('分组同样排序并重新编号', () => {
    const d = makeBase()
    d.groups[0].order = 2
    d.groups.push({ id: 'g2', name: '影音', order: 1, links: [] })
    normalizeOrder(d)
    expect(d.groups.map((g) => g.order)).toEqual([1, 2])
    expect(d.groups.map((g) => g.id)).toEqual(['g2', 'g1'])
  })
})
