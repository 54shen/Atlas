import { computed, ref, toRaw, watch } from 'vue'
import { defineStore } from 'pinia'
import type { NavData, NavGroup, NavLink, SearchEngine } from '@/types'
import { mergeNavData, normalizeOrder } from '@/utils/merge'
import { clearLocalData, loadLocalData, saveLocalData } from '@/utils/storage'
import { newId } from '@/utils/id'
import { saveToServer } from '@/utils/api'

/** localStorage 键名：导航数据快照 */
export const NAV_DATA_KEY = 'nav:data:v1'

export const useNavStore = defineStore('nav', () => {
  /** 基线数据：来自 public/data/links.json（随部署发布） */
  const baseData = ref<NavData | null>(null)
  /** 本地数据：编辑模式产生的全量快照 */
  const localData = ref<NavData | null>(null)
  const loading = ref(true)
  const error = ref('')
  /** 编辑模式开关 */
  const isEditing = ref(false)
  /** 全局保存状态：idle 空闲 / saving 保存中 / saved 已保存 / error 失败（静态托管无接口） */
  const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

  /** 合并后的最终数据（本地优先） */
  const data = computed<NavData | null>(() =>
    baseData.value ? mergeNavData(baseData.value, localData.value) : null,
  )

  const hasLocalData = computed(() => localData.value !== null)

  /** 当前默认搜索引擎（配置缺失时回退到第一个） */
  const searchEngine = computed<SearchEngine | null>(() => {
    const d = data.value
    if (!d) return null
    return (
      d.settings.searchEngines.find((e) => e.id === d.settings.searchEngine) ??
      d.settings.searchEngines[0] ??
      null
    )
  })

  const engines = computed<SearchEngine[]>(() => data.value?.settings.searchEngines ?? [])

  /** 站点名称（设置里可改，缺省 Atlas） */
  const siteName = computed(() => data.value?.settings.siteName?.trim() || 'Atlas')

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/links.json`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      baseData.value = (await res.json()) as NavData
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    }
    localData.value = loadLocalData<NavData>(NAV_DATA_KEY)
    loading.value = false
  }

  /**
   * 当前生效数据的深拷贝（本地快照优先于基线）。
   * 注意：ref 里的值是 Vue reactive Proxy，structuredClone 无法克隆 Proxy，
   * 必须先 toRaw 还原为普通对象。
   */
  function snapshot(): NavData | null {
    if (!baseData.value) return null
    return structuredClone(toRaw(localData.value ?? baseData.value))
  }

  /** 统一提交入口：规范化排序 → 更新本地快照 → 持久化（不在这里自动保存，避免编辑时卡顿） */
  function commit(next: NavData): void {
    normalizeOrder(next)
    localData.value = next
    saveLocalData(NAV_DATA_KEY, next)
  }

  /** 把当前数据保存到服务器（全局生效）；静态托管环境会失败并置 error 状态 */
  async function saveNow(): Promise<void> {
    const current = data.value
    if (!current) return
    saveStatus.value = 'saving'
    const ok = await saveToServer(toRaw(current))
    saveStatus.value = ok ? 'saved' : 'error'
    if (ok) {
      setTimeout(() => {
        if (saveStatus.value === 'saved') saveStatus.value = 'idle'
      }, 3000)
    }
  }

  /** 退出编辑模式时自动保存一次（编辑过程中不触发网络保存，避免卡顿） */
  watch(
    isEditing,
    (editing) => {
      if (!editing) void saveNow()
    },
    { flush: 'sync' },
  )

  /** 变更封装：深拷贝 → 执行变更 → 提交 */
  function mutate(fn: (d: NavData) => void): void {
    const next = snapshot()
    if (!next) return
    fn(next)
    commit(next)
  }

  // ---------- 分组 ----------

  function addGroup(name: string, icon?: string): void {
    mutate((d) => {
      d.groups.push({ id: newId('g'), name, icon, order: d.groups.length + 1, links: [] })
    })
  }

  function updateGroup(groupId: string, patch: Partial<Pick<NavGroup, 'name' | 'icon'>>): void {
    mutate((d) => {
      const g = d.groups.find((x) => x.id === groupId)
      if (g) Object.assign(g, patch)
    })
  }

  function deleteGroup(groupId: string): void {
    mutate((d) => {
      d.groups = d.groups.filter((g) => g.id !== groupId)
    })
  }

  // ---------- 站点 ----------

  type LinkPatch = Pick<NavLink, 'name' | 'url'> & Partial<Pick<NavLink, 'desc' | 'icon'>>

  function addLink(groupId: string, link: LinkPatch): void {
    mutate((d) => {
      const g = d.groups.find((x) => x.id === groupId)
      if (g) g.links.push({ ...link, id: newId('l'), order: g.links.length + 1 })
    })
  }

  function updateLink(groupId: string, linkId: string, patch: Partial<LinkPatch>): void {
    mutate((d) => {
      const g = d.groups.find((x) => x.id === groupId)
      const l = g?.links.find((x) => x.id === linkId)
      if (l) Object.assign(l, patch)
    })
  }

  function deleteLink(groupId: string, linkId: string): void {
    mutate((d) => {
      const g = d.groups.find((x) => x.id === groupId)
      if (g) g.links = g.links.filter((l) => l.id !== linkId)
    })
  }

  // ---------- 搜索引擎 ----------

  function setSearchEngine(engineId: string): void {
    mutate((d) => {
      d.settings.searchEngine = engineId
    })
  }

  function updateSiteName(name: string): void {
    mutate((d) => {
      d.settings.siteName = name.trim()
    })
  }

  function addEngine(engine: Omit<SearchEngine, 'id'>): void {
    mutate((d) => {
      d.settings.searchEngines.push({ ...engine, id: newId('e') })
    })
  }

  function updateEngine(
    engineId: string,
    patch: Partial<Pick<SearchEngine, 'name' | 'url'>>,
  ): void {
    mutate((d) => {
      const e = d.settings.searchEngines.find((x) => x.id === engineId)
      if (e) Object.assign(e, patch)
    })
  }

  function removeEngine(engineId: string): void {
    mutate((d) => {
      d.settings.searchEngines = d.settings.searchEngines.filter((e) => e.id !== engineId)
      if (d.settings.searchEngine === engineId) {
        d.settings.searchEngine = d.settings.searchEngines[0]?.id ?? ''
      }
    })
  }

  // ---------- 导入 / 恢复 ----------

  /** 导入完整 JSON 数据（整体替换当前数据） */
  function importData(next: NavData): void {
    commit(structuredClone(next))
  }

  /** 追加导入分组（书签导入用），重新分配 id 与 order */
  function importGroups(groups: NavGroup[]): void {
    mutate((d) => {
      d.groups.push(
        ...groups.map((g, gi) => ({
          ...g,
          id: newId('g'),
          order: d.groups.length + gi + 1,
          links: g.links.map((l) => ({ ...l, id: newId('l') })),
        })),
      )
    })
  }

  /**
   * 拖拽结束后的持久化（SortableJS 已就地修改数组）：
   * 先按数组顺序重编号 order（避免 normalizeOrder 把拖拽还原），再提交快照。
   */
  function persistFromDrag(): void {
    const current = data.value
    if (!current) return
    const raw = toRaw(current)
    raw.groups.forEach((g, gi) => {
      g.order = gi + 1
      g.links.forEach((l, li) => {
        l.order = li + 1
      })
    })
    commit(structuredClone(raw))
  }

  /** 清除本地修改，恢复为仓库基线数据 */
  function resetToBase(): void {
    clearLocalData(NAV_DATA_KEY)
    localData.value = null
  }

  return {
    baseData,
    localData,
    data,
    hasLocalData,
    searchEngine,
    engines,
    siteName,
    saveStatus,
    loading,
    error,
    isEditing,
    load,
    saveNow,
    updateSiteName,
    addGroup,
    updateGroup,
    deleteGroup,
    addLink,
    updateLink,
    deleteLink,
    persistFromDrag,
    setSearchEngine,
    addEngine,
    updateEngine,
    removeEngine,
    importData,
    importGroups,
    resetToBase,
  }
})
