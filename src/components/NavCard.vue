<script setup lang="ts">
import { computed, ref } from 'vue'
import type { NavLink } from '@/types'
import { fallbackLetter, resolveIcon } from '@/utils/favicon'

const props = defineProps<{
  link: NavLink
  isEditing?: boolean
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()

const iconFailed = ref(false)
const iconUrl = computed(() =>
  iconFailed.value ? '' : resolveIcon(props.link.icon, props.link.url),
)

/** 操作按钮：阻止跳转与事件冒泡 */
function onAction(e: MouseEvent, fn: () => void) {
  e.preventDefault()
  e.stopPropagation()
  fn()
}
</script>

<template>
  <div class="card-wrap" :class="{ 'is-editing': isEditing }">
    <a
      class="nav-card"
      :href="link.url"
      target="_blank"
      rel="noopener noreferrer"
      :title="link.desc ?? link.url"
    >
      <span class="card-icon">
        <img
          v-if="iconUrl"
          :src="iconUrl"
          alt=""
          loading="lazy"
          draggable="false"
          @error="iconFailed = true"
        />
        <span v-else class="card-icon-fallback">{{ fallbackLetter(link.name) }}</span>
      </span>
      <span class="card-body">
        <span class="card-name">{{ link.name }}</span>
        <span v-if="link.desc" class="card-desc">{{ link.desc }}</span>
      </span>
    </a>
    <div v-if="isEditing" class="card-actions">
      <span class="card-grip" title="拖动卡片排序/移动分组">⠿</span>
      <button class="mini-btn" title="编辑" aria-label="编辑" @click="onAction($event, () => emit('edit'))">
        ✏️
      </button>
      <button
        class="mini-btn danger"
        title="删除"
        aria-label="删除"
        @click="onAction($event, () => emit('delete'))"
      >
        🗑️
      </button>
    </div>
  </div>
</template>

<style scoped>
.card-wrap {
  position: relative;
}

.card-wrap.is-editing {
  user-select: none; /* 编辑模式拖拽卡片时禁止选中文字 */
}

.card-wrap.is-editing .nav-card {
  cursor: grab;
}

.card-wrap.is-editing .nav-card:active {
  cursor: grabbing;
}

.nav-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.nav-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.nav-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.card-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--icon-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.card-icon-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--accent);
}

.card-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.card-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-desc {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.card-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 2;
}

.card-grip {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 0 2px;
  cursor: grab;
  user-select: none;
}
</style>
