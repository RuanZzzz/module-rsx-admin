<script setup>
import { onMounted, ref } from 'vue';
import { articleApi, moduleApi, toolApi } from '../api/resources';

const stats = ref([
  { label: '模块', value: '-' },
  { label: '工具', value: '-' },
  { label: '文章', value: '-' }
]);
const errorMessage = ref('');

onMounted(async () => {
  try {
    const [modules, tools, articles] = await Promise.all([
      moduleApi.list(),
      toolApi.list(),
      articleApi.list()
    ]);
    stats.value = [
      { label: '模块', value: modules.length },
      { label: '工具', value: tools.length },
      { label: '文章', value: articles.length }
    ];
  } catch (error) {
    console.warn('[dashboard] load stats failed', error);
    errorMessage.value = error.message;
  }
});
</script>

<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>工作台</h1>
        <p>基础模块运行概览</p>
      </div>
    </div>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <div class="stats-grid">
      <article v-for="item in stats" :key="item.label" class="stat-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </article>
    </div>
  </section>
</template>
