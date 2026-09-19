<script setup lang="ts">
import { computed, ref } from 'vue'
import { NIcon, NModal, useMessage } from 'naive-ui'
import { ChevronDown, CopyOutline, PrintOutline, RefreshOutline } from '@vicons/ionicons5'
import { useAssessmentStore } from '../stores/assessment'
import type { ConstitutionResult } from '../utils/scoring'
import SealMark from './SealMark.vue'
import ScoreRadar from './ScoreRadar.vue'

const store = useAssessmentStore()
const message = useMessage()

const result = computed(() => store.finish())

const ordered = computed<ConstitutionResult[]>(() => result.value?.results ?? [])
const dominant = computed<ConstitutionResult[]>(() => result.value?.dominant ?? [])
const headline = computed(() => result.value?.headline ?? '')

const sealText = computed(() => {
  const primary = dominant.value[0]
  return primary ? primary.constitution.name.slice(0, 2) : '辨体'
})

/**
 * 判定层级用「视觉分量」表达，而非多种颜色：
 * 是 = 实心主色，基本是 = 浅底，倾向是 = 描边，否 = 无徽标仅文字
 */
function verdictClass(r: ConstitutionResult): string {
  if (r.verdict === '否') return 'verdict--none'
  if (r.verdict === '倾向是') return 'verdict--lean'
  if (r.verdict === '基本是') return 'verdict--tint'
  return 'verdict--solid'
}

const showAllDetails = ref(false)
const others = computed(() => ordered.value.filter((r) => !dominant.value.includes(r)))

const assessedAt = computed(() =>
  new Date().toLocaleString('zh-CN', { dateStyle: 'long', timeStyle: 'short' }),
)

const resetOpen = ref(false)

function onRestart() {
  store.reset()
  resetOpen.value = false
}

function onPrint() {
  window.print()
}

async function onCopy() {
  if (!result.value) return
  const lines = [
    '中医体质辨识测评结果',
    `测评时间：${assessedAt.value}`,
    `结论：${headline.value}`,
    '',
    ...ordered.value.map(
      (r) => `${r.constitution.name} ${r.score}/${r.maxScore} 分（${r.verdict}）`,
    ),
  ]
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败，请检查浏览器剪贴板权限')
  }
}
</script>

<template>
  <div v-if="result" class="result">
    <div class="result-inner">
      <header class="result-hero">
        <SealMark :text="sealText" :size="72" />
        <h1 class="headline">{{ headline }}</h1>
        <p class="meta">{{ assessedAt }} · 依据《中医体质分类与判定》标准</p>
      </header>

      <!-- 主要体质解读 -->
      <section v-if="dominant.length" class="dominant-list">
        <article
          v-for="(r, i) in dominant"
          :key="r.constitution.id"
          class="constitution-card"
          :style="{ animationDelay: `${i * 80}ms` }"
        >
          <header class="card-head">
            <h2 class="card-title">
              {{ r.constitution.name }}
              <span class="verdict" :class="verdictClass(r)">{{ r.verdict }}</span>
            </h2>
            <span class="card-score">{{ r.score }}<em>/ {{ r.maxScore }}</em></span>
          </header>
          <p class="card-trait">{{ r.constitution.trait }}</p>

          <div class="card-columns">
            <div class="card-col">
              <h3>常见表现</h3>
              <ul class="sign-list">
                <li v-for="(s, j) in r.constitution.signs" :key="j">{{ s }}</li>
              </ul>
            </div>
            <div class="card-col">
              <h3>调养建议</h3>
              <dl class="advice-list">
                <dt>饮食</dt>
                <dd>{{ r.constitution.advice.diet }}</dd>
                <dt>起居</dt>
                <dd>{{ r.constitution.advice.lifestyle }}</dd>
                <dt>运动</dt>
                <dd>{{ r.constitution.advice.exercise }}</dd>
              </dl>
            </div>
          </div>
        </article>
      </section>

      <!-- 图谱 + 总览 -->
      <div class="overview-grid">
        <section class="panel">
          <h2 class="panel-title">九维图谱</h2>
          <ScoreRadar :results="ordered" />
        </section>

        <section class="panel">
          <h2 class="panel-title">判定总览</h2>
          <ul class="score-list">
            <li v-for="r in ordered" :key="r.constitution.id" class="score-row">
              <span class="score-name">{{ r.constitution.name }}</span>
              <span class="score-meter" aria-hidden="true">
                <i :style="{ width: `${(r.score / r.maxScore) * 100}%` }" />
              </span>
              <span class="score-value">{{ r.score }}</span>
              <span class="verdict verdict--sm" :class="verdictClass(r)">{{ r.verdict }}</span>
            </li>
          </ul>
        </section>
      </div>

      <!-- 其余体质（折叠） -->
      <section v-if="others.length" class="others no-print">
        <button type="button" class="others-toggle" @click="showAllDetails = !showAllDetails">
          {{ showAllDetails ? '收起其余体质' : `其余 ${others.length} 种体质` }}
          <NIcon :size="16" class="toggle-arrow" :class="{ open: showAllDetails }">
            <ChevronDown />
          </NIcon>
        </button>
        <Transition name="rise">
          <div v-if="showAllDetails" class="others-list">
            <article v-for="r in others" :key="r.constitution.id" class="other-card">
              <h3>{{ r.constitution.name }} <span class="other-verdict">{{ r.verdict }}</span></h3>
              <p>{{ r.constitution.trait }}</p>
            </article>
          </div>
        </Transition>
      </section>

      <footer class="actions no-print">
        <button type="button" class="btn btn-ghost" @click="onCopy">
          <NIcon :size="17"><CopyOutline /></NIcon>复制摘要
        </button>
        <button type="button" class="btn btn-ghost" @click="onPrint">
          <NIcon :size="17"><PrintOutline /></NIcon>打印报告
        </button>
        <button type="button" class="btn btn-primary" @click="resetOpen = true">
          <NIcon :size="17"><RefreshOutline /></NIcon>重新测评
        </button>
      </footer>

      <p class="disclaimer">本结果由标准量表自动生成，仅供养生参考，不能替代医师诊断。</p>
    </div>

    <NModal v-model:show="resetOpen" preset="dialog" :show-icon="false" title="重新测评"
      positive-text="清空并重测" negative-text="取消" @positive-click="onRestart">
      将清空本次作答与结果，重新开始一次新的测评。
    </NModal>
  </div>
</template>

<style scoped>
.result {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 64px 20px 80px;
}

.result-inner {
  width: 100%;
  max-width: 960px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.result-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
}

.headline {
  margin: 0;
  font-size: clamp(26px, 4.2vw, 36px);
  font-weight: 700;
  line-height: 1.4;
  max-width: 720px;
}

.meta {
  margin: 0;
  font-size: 13px;
  color: var(--ink-faint);
}

.dominant-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.constitution-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  padding: 28px 30px;
  animation: card-in 0.45s var(--ease-out) both;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
}

.card-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-score {
  font-size: 26px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.card-score em {
  font-style: normal;
  font-size: 14px;
  font-weight: 400;
  color: var(--ink-faint);
  margin-left: 2px;
}

.card-trait {
  margin: 10px 0 0;
  color: var(--ink-soft);
}

.card-columns {
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  border-top: 1px solid var(--line);
  padding-top: 20px;
}

.card-col h3 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-faint);
}

.sign-list {
  margin: 0;
  padding-left: 18px;
  color: var(--ink-soft);
  font-size: 14.5px;
}

.sign-list li + li {
  margin-top: 4px;
}

.advice-list {
  margin: 0;
  font-size: 14.5px;
}

.advice-list dt {
  font-weight: 600;
  color: var(--accent-deep);
  margin-top: 8px;
}

.advice-list dt:first-child {
  margin-top: 0;
}

.advice-list dd {
  margin: 2px 0 0;
  color: var(--ink-soft);
}

/* 判定徽标：用语义层级而非多种颜色 */
.verdict {
  flex: none;
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
}

.verdict--sm {
  padding: 1px 9px;
  font-size: 11px;
  justify-self: end;
}

.verdict--solid {
  background: var(--accent);
  color: #fff;
}

.verdict--tint {
  background: var(--accent-tint);
  color: var(--accent-deep);
}

.verdict--lean {
  border-color: var(--accent);
  color: var(--accent-deep);
  background: transparent;
}

.verdict--none {
  color: var(--ink-faint);
  font-weight: 400;
  padding: 0;
}

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  padding: 24px 26px;
}

.panel-title {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
}

.score-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.score-row {
  display: grid;
  grid-template-columns: 60px 1fr 26px auto;
  align-items: center;
  gap: 14px;
  font-size: 14px;
}

.score-name {
  font-weight: 500;
}

.score-meter {
  height: 2px;
}

.score-meter i {
  display: block;
  height: 100%;
  background: var(--accent);
  transition: width 0.6s var(--ease-out);
}

.score-value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.others-toggle {
  width: 100%;
  background: none;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  padding: 13px;
  font-size: 14px;
  color: var(--ink-soft);
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;
}

.others-toggle:hover {
  border-color: var(--line-strong);
  color: var(--ink);
}

.toggle-arrow {
  margin-left: 6px;
  vertical-align: -3px;
  transition: transform 0.25s var(--ease-out);
}

.toggle-arrow.open {
  transform: rotate(180deg);
}

.others-list {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.other-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  padding: 16px 18px;
  background: var(--surface);
}

.other-card h3 {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
}

.other-verdict {
  font-size: 12px;
  color: var(--ink-faint);
  font-weight: 400;
  margin-left: 6px;
}

.other-card p {
  margin: 0;
  font-size: 13px;
  color: var(--ink-soft);
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.disclaimer {
  text-align: center;
  font-size: 12px;
  color: var(--ink-faint);
}

@media (max-width: 760px) {
  .card-columns,
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
