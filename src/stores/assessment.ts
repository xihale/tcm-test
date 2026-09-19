import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { TOTAL_QUESTIONS } from '../data/questions'
import { evaluate, unansweredOf, type AnswerMap, type AssessmentResult } from '../utils/scoring'

const STORAGE_KEY = 'tcm-constitution-assessment/v1'

export type Stage = 'intro' | 'quiz' | 'result' | 'guide'

interface PersistedState {
  answers: AnswerMap
  currentIndex: number
  stage: Stage
  updatedAt: number
}

function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    if (typeof parsed !== 'object' || parsed == null || typeof parsed.answers !== 'object') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export const useAssessmentStore = defineStore('assessment', () => {
  const persisted = loadPersisted()

  const answers = ref<AnswerMap>({ ...(persisted?.answers ?? {}) })
  const currentIndex = ref(persisted?.currentIndex ?? 0)
  // 刷新 / 重开页面时恢复到中断时的阶段（首页 / 答题 / 结果）
  const stage = ref<Stage>(persisted?.stage ?? 'intro')
  const updatedAt = ref(persisted?.updatedAt ?? 0)

  const answeredCount = computed(
    () => Object.values(answers.value).filter((v) => v != null).length,
  )
  /** 首页是否展示「继续上次测评」卡片：存在已保存的作答即可 */
  const resumable = computed(() => stage.value === 'intro' && answeredCount.value > 0)
  const isComplete = computed(() => answeredCount.value >= TOTAL_QUESTIONS)
  const progress = computed(() => answeredCount.value / TOTAL_QUESTIONS)

  function answer(qid: number, value: number) {
    answers.value[qid] = value
  }

  function start() {
    stage.value = 'quiz'
    const missing = unansweredOf(answers.value, TOTAL_QUESTIONS)
    if (missing.length > 0) {
      currentIndex.value = Math.min(currentIndex.value, TOTAL_QUESTIONS - 1)
    }
  }

  function resume() {
    stage.value = 'quiz'
  }

  /** 体质图鉴：测评前浏览九种体质的介绍与调养建议 */
  function openGuide() {
    stage.value = 'guide'
  }

  function exitGuide() {
    stage.value = 'intro'
  }

  function goTo(index: number) {
    currentIndex.value = Math.max(0, Math.min(TOTAL_QUESTIONS - 1, index))
  }

  function next() {
    goTo(currentIndex.value + 1)
  }

  function prev() {
    goTo(currentIndex.value - 1)
  }

  function jumpToFirstUnanswered(): number | null {
    const missing = unansweredOf(answers.value, TOTAL_QUESTIONS)
    if (missing.length === 0) return null
    goTo(missing[0] - 1)
    return missing[0]
  }

  function finish(): AssessmentResult | null {
    if (!isComplete.value) return null
    return evaluate(answers.value)
  }

  function reset() {
    answers.value = {}
    currentIndex.value = 0
    stage.value = 'intro'
    updatedAt.value = Date.now()
  }

  // 自动保存：任何作答 / 进度变化都会写入 localStorage（去抖）
  let timer: ReturnType<typeof setTimeout> | null = null
  watch(
    [answers, currentIndex, stage],
    () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const payload: PersistedState = {
          answers: answers.value,
          currentIndex: currentIndex.value,
          stage: stage.value,
          updatedAt: Date.now(),
        }
        updatedAt.value = payload.updatedAt
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
        } catch {
          // 存储不可用（隐私模式等）时静默降级，测评过程不受影响
        }
      }, 200)
    },
    { deep: true },
  )

  return {
    answers,
    currentIndex,
    stage,
    resumable,
    updatedAt,
    answeredCount,
    isComplete,
    progress,
    answer,
    start,
    resume,
    openGuide,
    exitGuide,
    goTo,
    next,
    prev,
    jumpToFirstUnanswered,
    finish,
    reset,
  }
})
