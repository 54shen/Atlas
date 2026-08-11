import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { NavGroup, NavLink } from '@/types'
import { filterGroups } from '@/utils/search'
import { useNavStore } from './nav'

export const useSearchStore = defineStore('search', () => {
  const nav = useNavStore()
  const query = ref('')

  /** 站内过滤后的分组列表（空关键词返回全部分组） */
  const visibleGroups = computed<NavGroup[]>(() =>
    filterGroups(nav.data?.groups ?? [], query.value),
  )

  /** 是否有输入且无匹配结果 */
  const isEmptyResult = computed(
    () => query.value.trim() !== '' && visibleGroups.value.length === 0,
  )

  /** 第一个匹配站点（回车打开用） */
  const firstMatch = computed<NavLink | null>(() => visibleGroups.value[0]?.links[0] ?? null)

  return { query, visibleGroups, isEmptyResult, firstMatch }
})
