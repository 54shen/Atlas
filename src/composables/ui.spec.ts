import { beforeEach, describe, expect, it } from 'vitest'
import { editTarget, openEdit, showSettings } from './ui'

beforeEach(() => {
  openEdit(null)
  showSettings.value = false
})

describe('ui composable', () => {
  it('showSettings 初始为关闭', () => {
    expect(showSettings.value).toBe(false)
  })

  it('openEdit 打开编辑目标', () => {
    openEdit({ mode: 'group', groupId: null, linkId: null })
    expect(editTarget.value).toEqual({ mode: 'group', groupId: null, linkId: null })
  })

  it('openEdit(null) 关闭编辑目标', () => {
    openEdit({ mode: 'link', groupId: 'g1', linkId: 'l1' })
    openEdit(null)
    expect(editTarget.value).toBeNull()
  })

  it('openEdit 携带初始表单值', () => {
    openEdit({ mode: 'link', groupId: 'g1', linkId: 'l1', initial: { name: 'GitHub' } })
    expect(editTarget.value?.initial?.name).toBe('GitHub')
  })
})
