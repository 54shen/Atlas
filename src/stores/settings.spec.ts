import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettingsStore } from './settings'

function stubMatchMedia(dark: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: dark,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.unstubAllGlobals()
  delete (window as { matchMedia?: unknown }).matchMedia
})

describe('settings store', () => {
  it('默认 auto 主题，无 matchMedia 时按亮色渲染', () => {
    const settings = useSettingsStore()
    expect(settings.theme).toBe('auto')
    expect(settings.effectiveTheme).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('系统为暗色时 auto 主题生效为暗色', () => {
    stubMatchMedia(true)
    const settings = useSettingsStore()
    expect(settings.effectiveTheme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('三态循环：auto → light → dark → auto，并持久化', () => {
    const settings = useSettingsStore()
    settings.cycleTheme()
    expect(settings.theme).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(JSON.parse(localStorage.getItem('nav:settings:v1')!)).toEqual({ theme: 'light' })

    settings.cycleTheme()
    expect(settings.theme).toBe('dark')
    settings.cycleTheme()
    expect(settings.theme).toBe('auto')
  })

  it('重启后从 localStorage 恢复主题', () => {
    const first = useSettingsStore()
    first.cycleTheme() // auto → light
    setActivePinia(createPinia()) // 模拟刷新
    const second = useSettingsStore()
    expect(second.theme).toBe('light')
    expect(second.effectiveTheme).toBe('light')
  })
})
