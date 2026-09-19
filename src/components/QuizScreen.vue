<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NIcon, NInputNumber, NModal } from 'naive-ui'
import { ChevronBack } from '@vicons/ionicons5'
import { useAssessmentStore } from '../stores/assessment'
import { optionsOf, QUESTIONS, TOTAL_QUESTIONS } from '../data/questions'

const store = useAssessmentStore()

/** 翻页方向：forward / backward，驱动方向感知过渡 */
const direction = ref<'forward' | 'backward'>('forward')
const transitionName = computed(() => `q-${direction.value}`)

const question = computed(() => QUESTIONS[store.currentIndex])
const options = computed(() => optionsOf(question.value))
const selected = computed(() => store.answers[question.value.id] ?? null)
const isLast = computed(() => store.currentIndex >= TOTAL_QUESTIONS - 1)

/** 悬停 / 聚焦的选项值：驱动动态说明行（专属选项的判定依据也在此呈现）
 *  已作答时选中优先 —— 说明行永远解释高亮的那一级，避免与选中态矛盾 */
const hovered = ref<number | null>(null)
const caption = computed(() => {
  const v = selected.value ?? hovered.value
  return options.value.find((o) => o.value === v)?.sub ?? ''
})

/** 刚选中后的短暂停留（自动前进） */
const advancing = ref(false)
let advanceTimer: ReturnType<typeof setTimeout> | null = null

function select(value: number) {
  if (advancing.value) return
  const isNew = selected.value !== value
  store.answer(question.value.id, value)
  if (!isNew) return
  advancing.value = true
  advanceTimer = setTimeout(() => {
    advancing.value = false
    if (!isLast.value) {
      goNext()
    }
  }, 300)
}

function goNext() {
  direction.value = 'forward'
  store.next()
}

function goPrev() {
  direction.value = 'backward'
  store.prev()
}

const finishOpen = ref(false)
const missingCount = computed(() => TOTAL_QUESTIONS - store.answeredCount)

function onSubmit() {
  if (store.isComplete) {
    store.stage = 'result'
  } else {
    finishOpen.value = true
  }
}

function jumpToMissing() {
  finishOpen.value = false
  store.jumpToFirstUnanswered()
}

// ---------- 第 9 题 BMI 辅助计算 ----------
const heightCm = ref<number | null>(null)
const weightKg = ref<number | null>(null)
const bmi = computed(() => {
  if (!heightCm.value || !weightKg.value) return null
  const m = heightCm.value / 100
  return weightKg.value / (m * m)
})
const bmiValue = computed(() => {
  const v = bmi.value
  if (v == null) return null
  return v < 24 ? 1 : v < 25 ? 2 : v < 26 ? 3 : v < 28 ? 4 : 5
})
const bmiLabel = computed(() => options.value.find((o) => o.value === bmiValue.value)?.label ?? '')

// 输入即预填（不触发自动跳题），用户仍可按主观感受改选
watch(bmiValue, (v) => {
  if (v != null && question.value.id === 9) store.answer(9, v)
})

// ---------- 键盘作答 ----------
function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

  if (e.key >= '1' && e.key <= '5') {
    select(Number(e.key))
  } else if (e.key === 'ArrowLeft') {
    goPrev()
  } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
    if (isLast.value) onSubmit()
    else goNext()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (advanceTimer) clearTimeout(advanceTimer)
})

// 手动跳题时同步方向观感，并重置悬停
watch(
  () => store.currentIndex,
  (n, o) => {
    direction.value = n >= o ? 'forward' : 'backward'
    hovered.value = null
  },
)
</script>

<template>
  <div class="quiz">
    <!-- 顶部发丝线即进度条：随作答变绿 -->
    <div class="progress-track" role="progressbar"
      :aria-valuenow="store.answeredCount" :aria-valuemax="TOTAL_QUESTIONS">
      <i class="progress-fill" :style="{ width: `${(store.currentIndex / TOTAL_QUESTIONS) * 100}%` }" />
    </div>

    <header class="quiz-header">
      <button class="back-link" type="button" aria-label="返回首页" @click="store.stage = 'intro'">
        <NIcon :size="20"><ChevronBack /></NIcon>
      </button>
      <span class="counter">{{ store.currentIndex + 1 }}<em>/ {{ TOTAL_QUESTIONS }}</em></span>
      <span class="header-spacer" aria-hidden="true" />
    </header>

    <div class="quiz-body">
      <Transition :name="transitionName" mode="out-in">
        <section :key="question.id" class="q-card">
          <h2 class="q-text">{{ question.text }}</h2>
          <p v-if="question.hint" class="q-hint">{{ question.hint }}</p>

          <!-- 第 9 题：BMI 辅助面板，输入即预填对应选项 -->
          <div v-if="question.id === 9" class="bmi-panel">
            <div class="bmi-fields">
              <label class="bmi-field">
                <span class="bmi-field-label">身高</span>
                <NInputNumber
                  v-model:value="heightCm"
                  placeholder="170"
                  :min="80"
                  :max="250"
                  :show-button="false"
                  class="bmi-input"
                />
                <span class="bmi-unit">cm</span>
              </label>
              <label class="bmi-field">
                <span class="bmi-field-label">体重</span>
                <NInputNumber
                  v-model:value="weightKg"
                  placeholder="65"
                  :min="20"
                  :max="300"
                  :show-button="false"
                  class="bmi-input"
                />
                <span class="bmi-unit">kg</span>
              </label>
            </div>
            <div class="bmi-out" :class="{ 'is-ready': bmi != null }">
              <template v-if="bmi != null">
                <span class="bmi-value">BMI {{ bmi.toFixed(1) }}</span>
                <span class="bmi-note">已预填「{{ bmiLabel }}」，可按实际感受改选</span>
              </template>
              <span v-else class="bmi-note">输入身高体重，自动换算 BMI 并预填选项</span>
            </div>
          </div>

          <!-- 五段量表：全题统一，圆点渐大即程度递进 -->
          <div class="scale" role="radiogroup" :aria-label="`第 ${question.id} 题选项`">
            <button
              v-for="opt in options"
              :key="opt.value"
              type="button"
              class="segment"
              :class="{ 'is-selected': selected === opt.value }"
              role="radio"
              :aria-checked="selected === opt.value"
              :aria-label="`${opt.label}，${opt.sub}`"
              @click="select(opt.value)"
              @mouseenter="hovered = opt.value"
              @mouseleave="hovered = null"
              @focus="hovered = opt.value"
              @blur="hovered = null"
            >
              <span class="gauge-dot gauge-dot--lg" :class="`dot-${opt.value}`" aria-hidden="true" />
              <span class="segment-label">{{ opt.label }}</span>
              <span class="segment-sub">{{ opt.sub }}</span>
            </button>
          </div>
          <!-- 动态说明行：只解释当前指向 / 选中的那一级（判定依据在此呈现） -->
          <p class="scale-caption" :class="{ 'is-active': caption }" aria-live="polite">
            {{ caption || '请选择最接近您近一年状态的一项' }}
          </p>
        </section>
      </Transition>
    </div>

    <footer class="quiz-footer">
      <button type="button" class="btn btn-ghost" :disabled="store.currentIndex === 0" @click="goPrev">
        上一题
      </button>
      <button v-if="!isLast" type="button" class="btn btn-primary" @click="goNext">
        下一题
      </button>
      <button v-else type="button" class="btn btn-primary" @click="onSubmit">
        {{ store.isComplete ? '查看结果' : `查看结果（还差 ${missingCount} 题）` }}
      </button>
    </footer>

    <NModal v-model:show="finishOpen" preset="dialog" :show-icon="false" title="还有题目未作答"
      positive-text="去补答" negative-text="继续作答"
      @positive-click="jumpToMissing" @negative-click="finishOpen = false">
      您还有 {{ missingCount }} 道题未作答，全部完成后才能生成体质判定结果。
    </NModal>
  </div>
</template>

<style scoped>
.quiz {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.progress-track {
  height: 2px;
  background: var(--line);
}

.progress-fill {
  display: block;
  height: 100%;
  background: var(--accent);
  transition: width 0.4s var(--ease-out);
}

.quiz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 18px 20px 0;
}

.back-link {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: none;
  color: var(--ink-faint);
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}

.back-link:hover {
  background: var(--sunken);
  color: var(--ink);
}

.counter {
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.counter em {
  font-style: normal;
  font-weight: 400;
  color: var(--ink-faint);
  margin-left: 2px;
}

.header-spacer {
  width: 36px;
}

.quiz-body {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 64px 20px 32px;
}

.q-card {
  width: 100%;
  max-width: 720px;
}

.q-text {
  margin: 0;
  font-size: clamp(24px, 3.6vw, 32px);
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0.01em;
}

.q-hint {
  margin: 10px 0 0;
  color: var(--ink-faint);
  font-size: 14px;
}

/* ---------- BMI 辅助面板 ---------- */
.bmi-panel {
  margin-top: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px 24px;
  padding: 16px 20px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
}

.bmi-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
}

.bmi-field {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.bmi-field-label,
.bmi-unit {
  font-size: 13.5px;
  color: var(--ink-faint);
}

.bmi-input {
  width: 92px;
}

/* 扁平化 Naive 输入框：去聚焦光晕，发丝边框 */
.bmi-input :deep(.n-input__state-border) {
  box-shadow: none !important;
}

.bmi-input :deep(.n-input:hover .n-input__state-border) {
  border-color: var(--ink-faint);
}

.bmi-input :deep(.n-input.n-input--focus .n-input__state-border) {
  border-color: var(--accent);
}

.bmi-input :deep(.n-input__input-el) {
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.bmi-out {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.bmi-value {
  font-size: 17px;
  font-weight: 700;
  color: var(--accent-deep);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.bmi-note {
  font-size: 13px;
  color: var(--ink-faint);
}

.bmi-out.is-ready .bmi-note {
  color: var(--accent-deep);
}

/* ---------- 分段量表 ---------- */
.scale {
  margin-top: 44px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.segment {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  padding: 28px 8px 22px;
  min-height: 118px;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.18s var(--ease-out);
}

.segment + .segment {
  border-left: 1px solid var(--line);
}

.segment:hover {
  background: var(--sunken);
}

.segment:active {
  transform: translateY(1px);
}

.segment.is-selected {
  background: var(--accent);
}

.segment-label {
  font-size: 16px;
  font-weight: 500;
  color: var(--ink-soft);
  transition: color 0.18s;
}

.segment.is-selected .segment-label {
  color: #fff;
}

.segment.is-selected .gauge-dot {
  background: #fff;
  opacity: 1;
}

/* 依据小字：桌面端由说明行承载，仅窄屏行内显示 */
.segment-sub {
  display: none;
}

.scale-caption {
  margin: 16px 0 0;
  min-height: 22px;
  text-align: center;
  font-size: 13.5px;
  color: var(--ink-faint);
  transition: color 0.2s;
}

.scale-caption.is-active {
  color: var(--accent-deep);
}

/* ---------- 底部 ---------- */
.quiz-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 0 20px 32px;
}

.quiz-footer .btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

@media (max-width: 560px) {
  .quiz-body {
    padding-top: 40px;
  }

  .bmi-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .bmi-fields {
    justify-content: space-between;
  }

  .bmi-input {
    width: 84px;
  }

  /* 窄屏：量表转为纵向整行，触达更从容；依据小字行内显示 */
  .scale {
    grid-template-columns: 1fr;
    margin-top: 36px;
  }

  .segment {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 18px;
    min-height: 0;
    padding: 17px 20px;
  }

  .segment + .segment {
    border-left: none;
    border-top: 1px solid var(--line);
  }

  .segment .gauge-dot {
    transform: scale(0.85);
  }

  .segment-label {
    font-size: 15.5px;
  }

  .segment-sub {
    display: block;
    margin-left: auto;
    font-size: 12.5px;
    color: var(--ink-faint);
    text-align: right;
  }

  .segment.is-selected .segment-sub {
    color: rgba(255, 255, 255, 0.78);
  }
}
</style>
