<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { NConfigProvider, NMessageProvider, type GlobalThemeOverrides } from 'naive-ui'
import { useAssessmentStore } from './stores/assessment'
import IntroScreen from './components/IntroScreen.vue'
import QuizScreen from './components/QuizScreen.vue'

// 结果页（含 ECharts）与体质图鉴按需加载，首屏更轻
const ResultScreen = defineAsyncComponent(() => import('./components/ResultScreen.vue'))
const ConstitutionGuide = defineAsyncComponent(() => import('./components/ConstitutionGuide.vue'))

const store = useAssessmentStore()
const stage = computed(() => store.stage)

/** Naive UI 全局主题微调：对齐深绿主色（仅弹窗 / 输入框 / 消息使用 Naive） */
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#1e5f4c',
    primaryColorHover: '#164a3b',
    primaryColorPressed: '#164a3b',
    primaryColorSuppl: '#1e5f4c',
    borderRadius: '10px',
    fontFamily:
      "system-ui, -apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif",
  },
}
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides">
    <NMessageProvider>
      <main class="app-shell">
        <Transition name="stage-fade" mode="out-in">
          <IntroScreen v-if="stage === 'intro'" key="intro" />
          <QuizScreen v-else-if="stage === 'quiz'" key="quiz" />
          <ConstitutionGuide v-else-if="stage === 'guide'" key="guide" />
          <ResultScreen v-else key="result" />
        </Transition>
      </main>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style scoped>
.app-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
