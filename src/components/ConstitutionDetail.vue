<script setup lang="ts">
import { computed } from 'vue'
import type { Constitution } from '../data/constitutions'

/**
 * grid —— 结果页用的两列网格版式；
 * leaflet —— 处方版式：1～5 编号小节，与《九种体质辨识的健教处方》传单同构。
 */
const props = withDefaults(
  defineProps<{ constitution: Constitution; layout?: 'grid' | 'leaflet' }>(),
  { layout: 'grid' },
)

const leaflet = computed(() => props.layout === 'leaflet')

const sections = computed(() => {
  const a = props.constitution.advice
  return [
    { n: 1, title: '情志调摄', body: a.emotion, recipes: undefined },
    { n: 2, title: '饮食调养', body: a.diet, recipes: a.recipes },
    { n: 3, title: '起居调摄', body: a.lifestyle, recipes: undefined },
    { n: 4, title: '运动保健', body: a.exercise, recipes: undefined },
    { n: 5, title: '穴位保健', body: a.acupoints, recipes: undefined },
  ]
})
</script>

<template>
  <!-- 处方版式：与传单同构的编号小节 -->
  <ol v-if="leaflet" class="leaflet-sections">
    <li v-for="s in sections" :key="s.n">
      <h4 class="leaflet-h">{{ s.n }}.{{ s.title }}</h4>
      <p class="leaflet-body">{{ s.body }}</p>
      <p v-if="s.recipes?.length" class="leaflet-recipes">
        <span class="leaflet-recipes-label">参考食疗方：</span>
        <span v-for="(r, j) in s.recipes" :key="j" class="leaflet-recipe">（{{ j + 1 }}）{{ r }}</span>
      </p>
    </li>
  </ol>

  <!-- 网格版式：结果页 -->
  <div v-else class="detail">
    <section class="block">
      <h3>常见表现</h3>
      <ul class="sign-list">
        <li v-for="(s, j) in constitution.signs" :key="j">{{ s }}</li>
      </ul>
    </section>
    <section class="block">
      <h3>调养建议</h3>
      <dl class="advice-grid">
        <div class="advice-item">
          <dt>情志</dt>
          <dd>{{ constitution.advice.emotion }}</dd>
        </div>
        <div class="advice-item">
          <dt>饮食</dt>
          <dd>{{ constitution.advice.diet }}</dd>
        </div>
        <div v-if="constitution.advice.recipes?.length" class="advice-item">
          <dt>食疗方</dt>
          <dd>
            <ul class="recipe-list">
              <li v-for="(recipe, j) in constitution.advice.recipes" :key="j">
                {{ recipe }}
              </li>
            </ul>
          </dd>
        </div>
        <div class="advice-item">
          <dt>起居</dt>
          <dd>{{ constitution.advice.lifestyle }}</dd>
        </div>
        <div class="advice-item">
          <dt>运动</dt>
          <dd>{{ constitution.advice.exercise }}</dd>
        </div>
        <div class="advice-item">
          <dt>穴位</dt>
          <dd>{{ constitution.advice.acupoints }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<style scoped>
/* ---------- 网格版式 ---------- */
.detail {
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.block h3 {
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
  columns: 2;
  column-gap: 32px;
}

.sign-list li {
  break-inside: avoid;
}

.sign-list li + li {
  margin-top: 4px;
}

.advice-grid {
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 32px;
  font-size: 14.5px;
}

.advice-item dt {
  font-weight: 600;
  color: var(--accent-deep);
}

.advice-item dd {
  margin: 3px 0 0;
  color: var(--ink-soft);
}

.recipe-list {
  margin: 0;
  padding-left: 18px;
}

.recipe-list li + li {
  margin-top: 6px;
}

/* ---------- 处方版式 ---------- */
.leaflet-sections {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.leaflet-h {
  margin: 0 0 6px;
  font-family: var(--font-seal);
  font-size: 16.5px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.04em;
}

.leaflet-body {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.85;
  color: var(--ink-soft);
  text-align: justify;
}

.leaflet-recipes {
  margin: 8px 0 0;
}

.leaflet-recipes-label {
  display: block;
  font-weight: 600;
  font-size: 14px;
  color: var(--ink);
}

.leaflet-recipe {
  display: block;
  font-size: 14.5px;
  line-height: 1.85;
  color: var(--ink-soft);
  text-align: justify;
}

@media (max-width: 760px) {
  .advice-grid {
    grid-template-columns: 1fr;
  }

  .sign-list {
    columns: 1;
  }
}
</style>
