<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { NIcon, NModal } from 'naive-ui'
import { ArrowBackOutline, CloseOutline, PlayOutline } from '@vicons/ionicons5'
import { useAssessmentStore } from '../stores/assessment'
import { CONSTITUTIONS, type Constitution, type ConstitutionId } from '../data/constitutions'
import ConstitutionDetail from './ConstitutionDetail.vue'
import SealMark from './SealMark.vue'

const store = useAssessmentStore()

const selected = ref<Constitution | null>(null)

/** 各体质对应的处方单页纸色（取自系列传单） */
const TINTS: Record<ConstitutionId, string> = {
  pinghe: '#eef0da',
  qixu: '#e9ede3',
  yangxu: '#f5e7e3',
  yinxu: '#e3f0e4',
  tanshi: '#f3f0e5',
  shire: '#f2ecd6',
  xueyu: '#f5f4f0',
  qiyu: '#e2efec',
  tebing: '#e3ebf3',
}

/** 传单页眉的四句健康要诀 */
const MOTTOS = ['合理膳食', '适量运动', '戒烟限酒', '心理平衡']

function backToHome() {
  window.scrollTo({ top: 0 })
  store.exitGuide()
}

function startQuiz() {
  window.scrollTo({ top: 0 })
  store.start()
}

/**
 * 详情页接入 history 栈：手机返回手势 / 浏览器后退即可关闭。
 * 打开时压入一条历史记录，所有主动关闭途径再将其弹回。
 */
function openDetail(c: Constitution) {
  selected.value = c
  history.pushState({ tcmGuideDetail: true }, '')
}

function requestClose() {
  const had = selected.value != null
  selected.value = null
  if (had && history.state?.tcmGuideDetail) history.back()
}

function onPopState() {
  selected.value = null
}

onMounted(() => window.addEventListener('popstate', onPopState))
onBeforeUnmount(() => {
  window.removeEventListener('popstate', onPopState)
  // 罕见路径：详情开着时组件被卸载，弹回压入的历史记录
  if (selected.value && history.state?.tcmGuideDetail) history.back()
})
</script>

<template>
  <div class="guide">
    <div class="guide-inner">
      <button type="button" class="back-link" @click="backToHome">
        <NIcon :size="15"><ArrowBackOutline /></NIcon>返回首页
      </button>

      <header class="guide-hero">
        <SealMark text="图鉴" :size="56" />
        <h1 class="title">体质图鉴</h1>
        <p class="lede">九种体质的识别要点与调养建议，先了解，再测评。</p>
        <p class="source">依据 南山区中医药治未病宣传系列《九种体质辨识的健教处方》整理</p>
      </header>

      <div class="mottos" aria-hidden="true">
        <span v-for="m in MOTTOS" :key="m">{{ m }}</span>
      </div>

      <div class="card-grid">
        <button
          v-for="(c, i) in CONSTITUTIONS"
          :key="c.id"
          type="button"
          class="constitution-card"
          :style="{ background: TINTS[c.id], '--i': i }"
          @click="openDetail(c)"
        >
          <span class="card-head">
            <span class="card-name">【{{ c.name }}】</span>
            <span v-if="c.isPinghe" class="ideal-tag">理想体质</span>
          </span>
          <span class="card-trait">{{ c.trait }}</span>
          <span class="card-signs">{{ c.signs.slice(0, 2).join(' · ') }}</span>
          <span class="card-more">查看详细介绍</span>
        </button>
      </div>

      <footer class="actions">
        <button type="button" class="btn btn-ghost" @click="backToHome">
          <NIcon :size="17"><ArrowBackOutline /></NIcon>返回首页
        </button>
        <button type="button" class="btn btn-primary" @click="startQuiz">
          <NIcon :size="17"><PlayOutline /></NIcon>开始测评
        </button>
      </footer>
    </div>

    <NModal
      :show="selected != null"
      :mask-closable="true"
      :close-on-esc="true"
      :auto-focus="false"
      @update:show="(v: boolean) => { if (!v) requestClose() }"
    >
      <div
        v-if="selected"
        class="leaflet"
        role="dialog"
        aria-modal="true"
        :aria-label="`${selected.name}调养处方`"
        :style="{ background: TINTS[selected.id] }"
      >
        <button type="button" class="leaflet-back" aria-label="返回" @click="requestClose">
          <NIcon :size="16"><ArrowBackOutline /></NIcon>返回
        </button>
        <button type="button" class="leaflet-close" aria-label="关闭" @click="requestClose">
          <NIcon :size="18"><CloseOutline /></NIcon>
        </button>

        <p class="leaflet-kicker">南山区中医药治未病宣传系列</p>
        <h2 class="leaflet-banner">九种体质辨识的健教处方</h2>
        <p class="leaflet-title">【{{ selected.name }}】</p>

        <div class="leaflet-mottos" aria-hidden="true">
          <span v-for="m in MOTTOS" :key="m">{{ m }}</span>
        </div>

        <ConstitutionDetail :constitution="selected" layout="leaflet" />

        <footer class="leaflet-foot">
          <SealMark text="处方" :size="46" />
          <p>南山区卫生健康局 · 南山区医疗集团总部</p>
        </footer>
      </div>
    </NModal>
  </div>
</template>

<style scoped>
.guide {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 48px 20px 80px;
}

.guide-inner {
  width: 100%;
  max-width: 960px;
  display: flex;
  flex-direction: column;
}

.back-link {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 4px;
  font-size: 13px;
  color: var(--ink-faint);
  cursor: pointer;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--ink);
}

.guide-hero {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 18px;
}

.title {
  margin: 0;
  font-size: clamp(28px, 4.6vw, 36px);
  font-weight: 700;
  letter-spacing: 0.06em;
}

.lede {
  margin: 0;
  color: var(--ink-soft);
}

.source {
  margin: 0;
  font-size: 12px;
  color: var(--ink-faint);
}

/* 传单页眉的四句要诀 */
.mottos {
  margin-top: 36px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px 34px;
  padding: 11px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  font-family: var(--font-seal);
  font-size: 14.5px;
  letter-spacing: 0.32em;
  color: var(--ink-soft);
}

.card-grid {
  margin-top: 36px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.constitution-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  border: 1px solid rgba(28, 25, 23, 0.14);
  border-radius: var(--radius-card);
  padding: 20px 22px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition: border-color 0.2s, transform 0.2s var(--ease-out);
  animation: card-in 0.45s var(--ease-out) both;
  animation-delay: calc(var(--i, 0) * 60ms);
}

.constitution-card:hover {
  border-color: rgba(28, 25, 23, 0.32);
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
}

.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-name {
  font-family: var(--font-seal);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.ideal-tag {
  flex: none;
  display: inline-flex;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.72);
  color: var(--accent-deep);
}

.card-trait {
  color: var(--ink-soft);
  font-size: 13.5px;
  line-height: 1.6;
}

.card-signs {
  color: var(--ink-faint);
  font-size: 12.5px;
  line-height: 1.6;
}

.card-more {
  margin-top: 4px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--accent-deep);
}

.actions {
  margin-top: 44px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ---------- 处方弹窗（模拟传单单页） ---------- */
.leaflet {
  position: relative;
  width: min(680px, calc(100vw - 40px));
  max-height: min(86vh, 960px);
  overflow-y: auto;
  border: 1px solid rgba(28, 25, 23, 0.22);
  border-radius: 4px;
  padding: 30px 34px 26px;
  /* 内衬细线框，对应传单的回纹边饰 */
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.leaflet::before {
  content: '';
  position: absolute;
  inset: 7px;
  border: 1px solid rgba(28, 25, 23, 0.16);
  border-radius: 2px;
  pointer-events: none;
}

.leaflet > * {
  position: relative;
}

.leaflet-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  color: var(--ink-soft);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.leaflet-close:hover {
  background: rgba(255, 255, 255, 0.9);
  color: var(--ink);
}

.leaflet-kicker {
  margin: 4px 0 0;
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.28em;
  color: var(--ink-soft);
}

.leaflet-banner {
  margin: 8px 0 0;
  text-align: center;
  font-family: var(--font-seal);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--ink);
}

.leaflet-title {
  margin: 16px 0 0;
  text-align: center;
  font-family: var(--font-seal);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink);
}

.leaflet-mottos {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 26px;
  margin: 16px 0 20px;
  padding: 8px 0;
  border-top: 1px solid rgba(28, 25, 23, 0.16);
  border-bottom: 1px solid rgba(28, 25, 23, 0.16);
  font-family: var(--font-seal);
  font-size: 13px;
  letter-spacing: 0.3em;
  color: var(--ink-soft);
}

.leaflet-foot {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.leaflet-foot p {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.12em;
  color: var(--ink-soft);
}

/* 手机端：详情铺满整页，返回手势 / 浏览器后退 / 返回按钮均可关闭 */
.leaflet-back {
  display: none;
}

@media (max-width: 760px) {
  .card-grid {
    grid-template-columns: 1fr;
  }

  .leaflet {
    width: 100vw;
    height: 100dvh;
    max-height: none;
    border: none;
    border-radius: 0;
    padding: calc(20px + env(safe-area-inset-top)) 22px 30px;
  }

  .leaflet-close {
    display: none;
  }

  .leaflet-back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    position: absolute;
    z-index: 1;
    top: calc(14px + env(safe-area-inset-top));
    left: 14px;
    height: 30px;
    padding: 0 12px 0 9px;
    border: none;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.65);
    color: var(--ink-soft);
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
  }

  .leaflet-back:hover {
    background: rgba(255, 255, 255, 0.95);
    color: var(--ink);
  }

  .leaflet-title {
    font-size: 25px;
  }
}
</style>
