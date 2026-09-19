<script setup lang="ts">
/**
 * 扁平朱砂印章，全应用唯一的品牌标记。
 * 白文刻字 + 内框印边；字序遵传统印章：
 * 二字竖排，三字右二左一，四字先右列后左列。
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    text: string
    size?: number
  }>(),
  { size: 72 },
)

const chars = computed(() => props.text.split('').slice(0, 4))

interface Glyph {
  ch: string
  x: number
  y: number
  fontSize: number
}

const glyphs = computed<Glyph[]>(() => {
  const c = chars.value
  switch (c.length) {
    case 1:
      return [{ ch: c[0], x: 50, y: 51, fontSize: 54 }]
    case 2:
      return [
        { ch: c[0], x: 50, y: 31, fontSize: 38 },
        { ch: c[1], x: 50, y: 69, fontSize: 38 },
      ]
    case 3:
      return [
        { ch: c[0], x: 69, y: 31, fontSize: 36 },
        { ch: c[1], x: 69, y: 69, fontSize: 36 },
        { ch: c[2], x: 30, y: 51, fontSize: 42 },
      ]
    default:
      return [
        { ch: c[0], x: 69, y: 31, fontSize: 35 },
        { ch: c[1], x: 69, y: 69, fontSize: 35 },
        { ch: c[2], x: 30, y: 31, fontSize: 35 },
        { ch: c[3], x: 30, y: 69, fontSize: 35 },
      ]
  }
})

const size = computed(() => props.size)
</script>

<template>
  <svg
    class="seal"
    :width="size"
    :height="size"
    viewBox="0 0 100 100"
    role="img"
    :aria-label="`印章：${text}`"
  >
    <rect x="1" y="1" width="98" height="98" rx="9" fill="#b23a2e" />
    <rect
      x="8.5"
      y="8.5"
      width="83"
      height="83"
      rx="5"
      fill="none"
      stroke="#fff"
      stroke-width="2.4"
      opacity="0.92"
    />
    <text
      v-for="(g, i) in glyphs"
      :key="i"
      :x="g.x"
      :y="g.y"
      :font-size="g.fontSize"
      text-anchor="middle"
      dominant-baseline="central"
    >
      {{ g.ch }}
    </text>
  </svg>
</template>

<style scoped>
.seal {
  display: inline-block;
  transform: rotate(-2deg);
  user-select: none;
  flex: none;
}

.seal text {
  fill: #fff;
  font-family: var(--font-seal);
  font-weight: 700;
}
</style>
