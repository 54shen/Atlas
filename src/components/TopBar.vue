<script setup lang="ts">
import SearchBar from './SearchBar.vue'
import ThemeSwitch from './ThemeSwitch.vue'
import { useNavStore } from '@/stores/nav'
import { showSettings } from '@/composables/ui'

const nav = useNavStore()

function openSettings() {
  showSettings.value = true
}

function toggleEdit() {
  nav.isEditing = !nav.isEditing
}
</script>

<template>
  <header class="topbar">
    <a class="logo" href="/" title="回到首页">
      <span class="logo-icon">🧭</span>
      <span class="logo-text">{{ nav.siteName }}</span>
    </a>
    <div class="topbar-actions">
      <button
        class="icon-btn"
        :class="{ active: nav.isEditing }"
        :title="nav.isEditing ? '退出编辑模式' : '编辑模式'"
        :aria-label="nav.isEditing ? '退出编辑模式' : '进入编辑模式'"
        @click="toggleEdit"
      >
        ✏️
      </button>
      <button
        class="icon-btn"
        title="设置（站点名 / 导入导出 / 搜索引擎）"
        aria-label="设置"
        @click="openSettings"
      >
        ⚙️
      </button>
      <ThemeSwitch />
    </div>
    <SearchBar class="topbar-search" />
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  background: var(--topbar-bg);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}

/* 搜索框页面水平居中（absolute 相对 .topbar） */
.topbar-search {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: min(560px, calc(100vw - 220px));
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.logo-icon {
  font-size: 22px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .topbar {
    padding: 0 14px;
    gap: 10px;
  }

  .logo-text {
    display: none;
  }

  .topbar-actions {
    gap: 6px;
  }
}
</style>
