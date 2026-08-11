<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()

const icon = computed(() => {
  switch (settings.theme) {
    case 'light':
      return '☀️'
    case 'dark':
      return '🌙'
    default:
      return '🖥️'
  }
})

const title = computed(() => {
  const label =
    settings.theme === 'auto' ? '跟随系统' : settings.theme === 'light' ? '亮色' : '暗色'
  return `主题：${label}（点击切换）`
})
</script>

<template>
  <button class="theme-switch" :title="title" :aria-label="title" @click="settings.cycleTheme()">
    {{ icon }}
  </button>
</template>

<style scoped>
.theme-switch {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--card-bg);
  cursor: pointer;
  font-size: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s;
}

.theme-switch:hover {
  transform: scale(1.08);
}
</style>
