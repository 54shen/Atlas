import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { NAV_DATA_KEY, useNavStore } from './nav'
import { loadLocalData } from '@/utils/storage'
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
        icon: '💻',
        order: 1,
        links: [
          { id: 'l1', name: 'A', url: 'https://a.com', order: 1 },
          { id: 'l2', name: 'B', url: 'https://b.com', order: 2 },
          { id: 'l3', name: 'C', url: 'https://c.com', order: 3 },
        ],
      },
      {
        id: 'g2',
        name: '影音',
        order: 2,
        links: [{ id: 'l4', name: 'D', url: 'https://d.com', order: 1 }],
      },
    ],
  }
}

function setup() {
  const store = useNavStore()
  store.baseData = makeData()
  store.loading = false
  return store
}

/** 断言变更已持久化到 localStorage，且数据合法 */
function expectPersisted(store: ReturnType<typeof setup>) {
  const saved = loadLocalData<NavData>(NAV_DATA_KEY)
  expect(saved).not.toBeNull()
  expect(saved!.version).toBe(DATA_VERSION)
  expect(store.hasLocalData).toBe(true)
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

describe('拖拽持久化（回归：persistFromDrag 重编号先于提交，拖拽不得被还原）', () => {
  it('组内拖拽：数组已变，order 重编号并持久化（无本地快照时创建）', () => {
    const store = setup()
    const links = store.data!.groups[0].links
    const [moved] = links.splice(0, 1) // 模拟 Sortable 把 l1 拖到末尾
    links.push(moved)
    store.persistFromDrag()
    expect(store.data!.groups[0].links.map((l) => l.id)).toEqual(['l2', 'l3', 'l1'])
    expect(store.data!.groups[0].links.map((l) => l.order)).toEqual([1, 2, 3])
    expectPersisted(store)
  })

  it('跨组拖拽：链接归属变化，两组 order 都重编号', () => {
    const store = setup()
    const from = store.data!.groups[0].links
    const to = store.data!.groups[1].links
    const [moved] = from.splice(0, 1) // 模拟把 l1 拖到 g2
    to.splice(1, 0, moved)
    store.persistFromDrag()
    expect(store.data!.groups[0].links.map((l) => l.id)).toEqual(['l2', 'l3'])
    expect(store.data!.groups[1].links.map((l) => l.id)).toEqual(['l4', 'l1'])
    expect(store.data!.groups[1].links.map((l) => l.order)).toEqual([1, 2])
    expectPersisted(store)
  })

  it('分组拖拽：分组顺序与 order 同步', () => {
    const store = setup()
    const groups = store.data!.groups
    const [g] = groups.splice(0, 1) // 模拟把 g1 拖到末尾
    groups.push(g)
    store.persistFromDrag()
    expect(store.data!.groups.map((x) => x.id)).toEqual(['g2', 'g1'])
    expect(store.data!.groups.map((x) => x.order)).toEqual([1, 2])
    expectPersisted(store)
  })

  it('已有本地快照时拖拽同样生效', () => {
    const store = setup()
    store.addGroup('临时') // 产生本地快照
    const links = store.data!.groups[0].links
    const [moved] = links.splice(0, 1)
    links.push(moved)
    store.persistFromDrag()
    expect(store.data!.groups[0].links.map((l) => l.id)).toEqual(['l2', 'l3', 'l1'])
    expect(store.hasLocalData).toBe(true)
  })
})

describe('新增与删除', () => {
  it('新增分组：追加到末尾并持久化', () => {
    const store = setup()
    store.addGroup('购物', '🛒')
    const groups = store.data!.groups
    expect(groups).toHaveLength(3)
    expect(groups[2].name).toBe('购物')
    expect(groups[2].icon).toBe('🛒')
    expect(groups[2].order).toBe(3)
    expect(groups[2].links).toEqual([])
    expectPersisted(store)
  })

  it('新增站点：追加到分组末尾', () => {
    const store = setup()
    store.addLink('g1', { name: 'D', url: 'https://d.com', desc: '测试' })
    const links = store.data!.groups[0].links
    expect(links).toHaveLength(4)
    expect(links[3].name).toBe('D')
    expect(links[3].order).toBe(4)
  })

  it('删除站点与分组', () => {
    const store = setup()
    store.deleteLink('g1', 'l1')
    expect(store.data!.groups[0].links.map((l) => l.id)).toEqual(['l2', 'l3'])
    store.deleteGroup('g2')
    expect(store.data!.groups.map((g) => g.id)).toEqual(['g1'])
  })

  it('编辑分组名与站点', () => {
    const store = setup()
    store.updateGroup('g1', { name: '开发工具' })
    expect(store.data!.groups[0].name).toBe('开发工具')
    store.updateLink('g1', 'l1', { desc: '新描述' })
    expect(store.data!.groups[0].links[0].desc).toBe('新描述')
  })
})

describe('站点名与全局保存', () => {
  it('未设置站点名时默认 Atlas；updateSiteName 修改并持久化', () => {
    const store = setup()
    expect(store.siteName).toBe('Atlas')
    store.updateSiteName('我的导航站')
    expect(store.siteName).toBe('我的导航站')
    expect(loadLocalData<NavData>(NAV_DATA_KEY)!.settings.siteName).toBe('我的导航站')
  })

  it('修改后防抖自动调用保存接口并置 saved 状态', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)
    const store = setup()
    store.addGroup('临时')
    await vi.advanceTimersByTimeAsync(900)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/data')
    expect(JSON.parse(init.body as string).groups.at(-1).name).toBe('临时')
    expect(store.saveStatus).toBe('saved')
  })

  it('保存失败时 saveStatus 为 error', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const store = setup()
    store.addGroup('临时')
    await vi.advanceTimersByTimeAsync(900)
    expect(store.saveStatus).toBe('error')
  })

  it('手动 saveNow 立即保存', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)
    const store = setup()
    store.addGroup('临时')
    await store.saveNow()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.saveStatus).toBe('saved')
  })
})

describe('搜索引擎与数据管理', () => {
  it('切换/添加/删除引擎，删除当前引擎自动回退', () => {
    const store = setup()
    store.addEngine({ name: '知乎', url: 'https://www.zhihu.com/search?q={q}' })
    const zhihu = store.data!.settings.searchEngines.at(-1)!
    store.setSearchEngine(zhihu.id)
    expect(store.data!.settings.searchEngine).toBe(zhihu.id)

    store.removeEngine(zhihu.id)
    expect(store.data!.settings.searchEngine).toBe('bing')
  })

  it('导入数据后本地生效', () => {
    const store = setup()
    const imported = makeData()
    imported.groups[0].links[0].name = '导入的'
    store.importData(imported)
    expect(store.data!.groups[0].links[0].name).toBe('导入的')
    expectPersisted(store)
  })

  it('恢复基线：清除本地数据并回退到仓库数据', () => {
    const store = setup()
    store.addGroup('临时')
    expect(store.hasLocalData).toBe(true)
    store.resetToBase()
    expect(store.hasLocalData).toBe(false)
    expect(localStorage.getItem(NAV_DATA_KEY)).toBeNull()
    expect(store.data!.groups.map((g) => g.id)).toEqual(['g1', 'g2'])
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
