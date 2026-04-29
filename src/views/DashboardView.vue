<script setup>
import { computed, onMounted, ref } from 'vue';
import { Database, FileText, Layers3, Server, Wrench } from 'lucide-vue-next';
import { articleApi, moduleApi, toolApi } from '../api/resources';

const stats = ref([
  { label: '系统模块', value: '-', icon: Layers3, tone: 'blue' },
  { label: '教学工具', value: '-', icon: Wrench, tone: 'green' },
  { label: '内容文章', value: '-', icon: FileText, tone: 'orange' }
]);
const errorMessage = ref('');
const enabledModules = ref([]);
const quickStatus = computed(() => [
  { label: '前端入口', value: 'nginx :8085', icon: Server },
  { label: '后端实例', value: 'server x 2', icon: Layers3 },
  { label: '数据服务', value: 'MySQL + Redis', icon: Database }
]);

onMounted(async () => {
  try {
    const [modules, tools, articles] = await Promise.all([
      moduleApi.list(),
      toolApi.list(),
      articleApi.list()
    ]);
    stats.value = [
      { label: '系统模块', value: modules.length, icon: Layers3, tone: 'blue' },
      { label: '教学工具', value: tools.length, icon: Wrench, tone: 'green' },
      { label: '内容文章', value: articles.length, icon: FileText, tone: 'orange' }
    ];
    enabledModules.value = modules.filter((item) => item.status === 'enabled').slice(0, 4);
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
      <article v-for="item in stats" :key="item.label" class="stat-card" :class="item.tone">
        <span class="stat-icon">
          <component :is="item.icon" :size="22" />
        </span>
        <div>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </article>
    </div>

    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-header">
          <strong>运行环境</strong>
          <span>Compose</span>
        </div>
        <div class="status-list">
          <article v-for="item in quickStatus" :key="item.label" class="status-item">
            <span class="status-icon"><component :is="item.icon" :size="18" /></span>
            <div>
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <strong>已启用模块</strong>
          <span>{{ enabledModules.length }} 项</span>
        </div>
        <div class="module-tags">
          <span v-for="item in enabledModules" :key="item.code">{{ item.name }}</span>
        </div>
      </section>
    </div>
  </section>
</template>
