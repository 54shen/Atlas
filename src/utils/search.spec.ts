import { describe, expect, it } from 'vitest'
import { buildEngineUrl, filterGroups, isUrlLike, normalizeUrl } from './search'
import type { NavGroup } from '@/types'

const groups: NavGroup[] = [
  {
    id: 'g1',
    name: '开发',
    order: 1,
    links: [
      { id: 'l1', name: 'GitHub', url: 'https://github.com', desc: '代码托管', order: 1 },
      { id: 'l2', name: 'MDN', url: 'https://developer.mozilla.org', order: 2 },
    ],
  },
  {
    id: 'g2',
    name: '影音',
    order: 2,
    links: [{ id: 'l3', name: 'Bilibili', url: 'https://www.bilibili.com', order: 1 }],
  },
]

describe('filterGroups', () => {
  it('空关键词返回全部分组', () => {
    expect(filterGroups(groups, '')).toBe(groups)
    expect(filterGroups(groups, '  ')).toBe(groups)
  })

  it('按站点名过滤并保留命中的链接', () => {
    const result = filterGroups(groups, 'github')
    expect(result).toHaveLength(1)
    expect(result[0].links.map((l) => l.name)).toEqual(['GitHub'])
  })

  it('按描述过滤', () => {
    const result = filterGroups(groups, '代码托管')
    expect(result[0].links.map((l) => l.id)).toEqual(['l1'])
  })

  it('按分组名过滤时保留整组', () => {
    const result = filterGroups(groups, '影音')
    expect(result).toHaveLength(1)
    expect(result[0].links).toHaveLength(1)
  })

  it('无匹配返回空数组', () => {
    expect(filterGroups(groups, '不存在的站点')).toEqual([])
  })

  it('大小写不敏感', () => {
    expect(filterGroups(groups, 'GITHUB')).toHaveLength(1)
  })
})

describe('isUrlLike / normalizeUrl', () => {
  it('识别 http(s) 与域名形式', () => {
    expect(isUrlLike('https://example.com')).toBe(true)
    expect(isUrlLike('example.com')).toBe(true)
    expect(isUrlLike('hello world')).toBe(false)
    expect(isUrlLike('github')).toBe(false)
  })

  it('无协议时补全 https', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com')
    expect(normalizeUrl('https://example.com')).toBe('https://example.com')
  })
})

describe('buildEngineUrl', () => {
  it('替换 {q} 并编码查询词', () => {
    expect(buildEngineUrl('https://www.bing.com/search?q={q}', 'vue 3')).toBe(
      'https://www.bing.com/search?q=vue%203',
    )
  })

  it('无占位符时原样返回', () => {
    expect(buildEngineUrl('https://example.com', 'x')).toBe('https://example.com')
  })
})
