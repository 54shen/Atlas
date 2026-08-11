import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { ThemeMode } from '@/types'
import { loadLocalData, saveLocalData } from '@/utils/storage'

const SETTINGS_KEY = 'nav:settings:v1'

export const useSettingsStore = defineStore('settings', () => {
  const saved = loadLocalData<{ theme: ThemeMode }>(SETTINGS_KEY)
  const theme = ref<ThemeMode>(saved?.theme ?? 'auto')
  const systemDark = ref(false)

  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = mq.matches
    mq.addEventListener('change', (e) => {
      systemDark.value = e.matches
    })
  }

  /** 生效主题：auto 时跟随系统 */
  const effectiveTheme = computed<'light' | 'dark'>(
    () => (theme.value === 'auto' ? (systemDark.value ? 'dark' : 'light') : theme.value),
  )

  watch(
    effectiveTheme,
    (t) => {
      document.documentElement.dataset.theme = t
    },
    { immediate: true },
  )

  /** 三态循环：auto → light → dark → auto */
  function cycleTheme(): void {
    const order: ThemeMode[] = ['auto', 'light', 'dark']
    theme.value = order[(order.indexOf(theme.value) + 1) % order.length]
    saveLocalData(SETTINGS_KEY, { theme: theme.value })
  }

  return { theme, effectiveTheme, cycleTheme }
})
