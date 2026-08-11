<script setup lang="ts">
import { defineAsyncComponent, onMounted, onUnmounted, watch } from 'vue'
import TopBar from '@/components/TopBar.vue'
import NavGroup from '@/components/NavGroup.vue'
import EditModal from '@/components/EditModal.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import { useNavStore } from '@/stores/nav'
import { useSearchStore } from '@/stores/search'
import { useSettingsStore } from '@/stores/settings'
import { openEdit, setDragActive } from '@/composables/ui'

// 拖拽库懒加载：编辑模式才加载
const Draggable = defineAsyncComponent(() => import('vuedraggable'))

const nav = useNavStore()
const search = useSearchStore()
useSettingsStore() // 初始化主题

/** 分组拖拽结束：恢复文字可选 + 持久化 */
function onGroupDragEnd() {
  setDragActive(false)
  nav.persistFromDrag()
}

/** 站点名变化时同步浏览器标签页标题 */
watch(
  () => nav.siteName,
  (name) => {
    document.title = `${name} · 我的导航`
  },
  { immediate: true },
)

/** 全局快捷键：非输入场景下按 / 聚焦搜索框 */
function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const tag = target?.tagName
  if (
    e.key === '/' &&
    tag !== 'INPUT' &&
    tag !== 'TEXTAREA' &&
    !target?.isContentEditable
  ) {
    e.preventDefault()
    document.getElementById('global-search')?.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  nav.load()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="page">
    <TopBar />
    <div v-if="nav.isEditing" class="edit-banner">
      ✏️ 编辑模式：改动会自动保存到服务器（全设备生效）
      <span v-if="nav.saveStatus !== 'idle'" class="save-status" :class="nav.saveStatus">
        {{ nav.saveStatus === 'saving' ? '保存中…' : nav.saveStatus === 'saved' ? '✅ 已保存' : '⚠️ 保存失败（纯静态托管无保存接口）' }}
      </span>
      <button class="banner-btn primary" @click="openEdit({ mode: 'group', groupId: null, linkId: null })">
        ➕ 新增分组
      </button>
      <button class="banner-btn" @click="nav.isEditing = false">退出编辑</button>
    </div>
    <main class="content">
      <div v-if="nav.loading" class="state-hint">加载中…</div>
      <div v-else-if="nav.error" class="state-hint error">数据加载失败：{{ nav.error }}</div>
      <template v-else>
        <div v-if="search.isEmptyResult" class="state-hint">
          没有找到与「{{ search.query }}」匹配的站点
        </div>
        <!-- 编辑模式：分组可拖拽排序（拖动分组标题）；普通/搜索模式：静态渲染 -->
        <Draggable
          v-if="nav.isEditing && !search.query"
          :list="nav.data?.groups ?? []"
          item-key="id"
          handle=".group-head"
          ghost-class="drag-ghost"
          fallback-class="drag-fallback"
          :animation="150"
          :force-fallback="true"
          :fallback-on-body="true"
          @start="setDragActive(true)"
          @end="onGroupDragEnd"
        >
          <template #item="{ element }">
            <NavGroup :group="element" />
          </template>
        </Draggable>
        <template v-else>
          <NavGroup v-for="group in search.visibleGroups" :key="group.id" :group="group" />
        </template>
        <div v-if="nav.isEditing && !search.query" class="add-group-zone">
          <button
            class="add-group-btn"
            @click="openEdit({ mode: 'group', groupId: null, linkId: null })"
          >
            ＋ 添加分组
          </button>
        </div>
        <footer class="footer">数据来自 links.json · 编辑后导出并同步到仓库即可全站更新</footer>
      </template>
    </main>
    <EditModal />
    <SettingsPanel />
  </div>
</template>
