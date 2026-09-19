<script setup lang="ts">
import { computed, ref } from 'vue'
import { NModal } from 'naive-ui'
import { useAssessmentStore } from '../stores/assessment'
import { DEFAULT_OPTIONS, TOTAL_QUESTIONS } from '../data/questions'
import SealMark from './SealMark.vue'

const store = useAssessmentStore()
const resetOpen = ref(false)

function onStart() {
  store.start()
}

function onResume() {
  store.resume()
}

function onRestart() {
  store.reset()
  resetOpen.value = false
  store.start()
}

const resumedAt = computed(() =>
  store.updatedAt ? new Date(store.updatedAt).toLocaleString('zh-CN') : '',
)
</script>

<template>
  <div class="intro">
    <div class="intro-inner">
      <SealMark text="辨体" :size="56" />

      <h1 class="title">中医体质辨识</h1>
      <p class="lede">33 题，约 5 分钟，读懂自己的身体倾向。</p>

      <!-- 量表：用视觉而非文字说明 -->
      <div class="scale" aria-label="作答量表：从没有到总是共五级">
        <div v-for="opt in DEFAULT_OPTIONS" :key="opt.value" class="scale-item">
          <span class="gauge-dot" :class="`dot-${opt.value}`" aria-hidden="true" />
          <span class="scale-label">{{ opt.label }}</span>
        </div>
      </div>

      <div class="cta">
        <button v-if="!store.resumable" type="button" class="btn btn-primary" @click="onStart">
          开始测评
        </button>
        <template v-else>
          <button type="button" class="btn btn-primary" @click="onResume">
            继续作答 · {{ store.answeredCount }}/{{ TOTAL_QUESTIONS }}
          </button>
          <button type="button" class="restart-link" @click="resetOpen = true">
            重新开始
          </button>
          <p class="resume-meta">上次保存于 {{ resumedAt }}</p>
        </template>
        <button type="button" class="guide-link" @click="store.openGuide()">
          先浏览九种体质介绍
        </button>
      </div>

      <footer class="foot">结果仅供养生参考，不能替代医师诊断。数据仅保存在本机。</footer>
    </div>

    <NModal v-model:show="resetOpen" preset="dialog" :show-icon="false" title="重新开始测评"
      positive-text="清空并重测" negative-text="取消" @positive-click="onRestart">
      将清空已保存的 {{ store.answeredCount }} 题作答记录，且无法恢复。
    </NModal>
  </div>
</template>

<style scoped>
.intro {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100dvh;
  padding: 48px 20px;
}

.intro-inner {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.title {
  margin: 28px 0 0;
  font-size: clamp(30px, 5vw, 40px);
  font-weight: 700;
  letter-spacing: 0.06em;
}

.lede {
  margin: 12px 0 0;
  color: var(--ink-soft);
}

/* 量表：五个渐大的圆点传达「程度递增」，无需解释文字 */
.scale {
  margin-top: 56px;
  display: flex;
  align-items: flex-end;
  gap: 34px;
}

.scale-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.scale-label {
  font-size: 13px;
  color: var(--ink-soft);
}

.cta {
  margin-top: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.cta .btn {
  min-width: 240px;
  height: 54px;
  font-size: 16px;
}

.restart-link {
  background: none;
  border: none;
  padding: 4px;
  font-size: 13px;
  color: var(--ink-faint);
  cursor: pointer;
  transition: color 0.2s;
}

.restart-link:hover {
  color: var(--ink);
}

.resume-meta {
  margin: 0;
  font-size: 12px;
  color: var(--ink-faint);
}

.guide-link {
  margin-top: 18px;
  background: none;
  border: none;
  padding: 4px;
  font-size: 13.5px;
  color: var(--ink-soft);
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-color: var(--line-strong);
  cursor: pointer;
  transition: color 0.2s;
}

.guide-link:hover {
  color: var(--accent-deep);
}

.foot {
  margin-top: 72px;
  font-size: 12px;
  color: var(--ink-faint);
}

@media (max-width: 480px) {
  .scale {
    gap: 20px;
  }
}
</style>
