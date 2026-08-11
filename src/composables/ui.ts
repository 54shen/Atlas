import { ref } from 'vue'
import type { NavLink } from '@/types'

/** 编辑弹窗目标：mode=group 编辑分组，mode=link 编辑站点；groupId/linkId 为 null 表示新增 */
export interface EditTarget {
  mode: 'group' | 'link'
  groupId: string | null
  linkId: string | null
  /** 编辑时的初始表单值 */
  initial?: Partial<Pick<NavLink, 'name' | 'url' | 'desc' | 'icon'>>
}

/** 设置面板开关（模块级单例，避免跨组件 prop 传递） */
export const showSettings = ref(false)

/** 编辑弹窗目标（null 表示关闭） */
export const editTarget = ref<EditTarget | null>(null)

export function openEdit(target: EditTarget | null): void {
  editTarget.value = target
}

/** 拖拽期间给 body 加/移临时 class，禁止拖拽时选中页面文字 */
export function setDragActive(active: boolean): void {
  document.body.classList.toggle('drag-active', active)
}
