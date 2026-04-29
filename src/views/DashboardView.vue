<script setup>
import { computed, onMounted, ref } from 'vue';
import {
  BarChart3,
  Box,
  CalendarDays,
  ClipboardList,
  Database,
  FileText,
  Megaphone,
  PencilLine,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Wrench
} from 'lucide-vue-next';
import { articleApi, moduleApi, toolApi } from '../api/resources';

const stats = ref([
  { label: '模块总数', value: '-', change: '运行中', icon: Box, tone: 'blue' },
  { label: '工具总数', value: '-', change: '可预览', icon: Wrench, tone: 'green' },
  { label: '文章总数', value: '-', change: '内容库', icon: FileText, tone: 'orange' },
  { label: '访问入口', value: '8085', change: 'nginx', icon: BarChart3, tone: 'purple' }
]);
const errorMessage = ref('');
const enabledModules = ref([]);

const quickActions = computed(() => [
  { label: '模块管理', icon: Box, tone: 'blue' },
  { label: '教学工具', icon: Wrench, tone: 'green' },
  { label: '内容发布', icon: PencilLine, tone: 'orange' },
  { label: '权限预留', icon: ShieldCheck, tone: 'purple' },
  { label: '用户管理', icon: Users, tone: 'blue' },
  { label: '运行配置', icon: Settings, tone: 'orange' },
  { label: '数据服务', icon: Database, tone: 'green' },
  { label: '操作日志', icon: ClipboardList, tone: 'purple' }
]);

const activities = [
  { icon: UserRound, text: '管理员登录了管理端', time: '刚刚' },
  { icon: Wrench, text: 'HTML 教学工具已接入预览', time: '今日' },
  { icon: FileText, text: '文章管理接口验证通过', time: '今日' },
  { icon: Database, text: 'MySQL 与 Redis 容器运行正常', time: '今日' }
];

const notices = [
  { type: '重要', text: '前端 nginx 已接入 Compose，统一转发 /api', time: '2026-04-29' },
  { type: '通知', text: '教学工具支持站内 HTML iframe 预览', time: '2026-04-29' },
  { type: '公告', text: '后端双实例通过 Redis 共享登录态', time: '2026-04-29' }
];

onMounted(async () => {
  try {
    const [modules, tools, articles] = await Promise.all([
      moduleApi.list(),
      toolApi.list(),
      articleApi.list()
    ]);
    stats.value = [
      { label: '模块总数', value: modules.length, change: '较昨日 +12.5%', icon: Box, tone: 'blue' },
      { label: '工具总数', value: tools.length, change: '较昨日 +8.2%', icon: Wrench, tone: 'green' },
      { label: '文章总数', value: articles.length, change: '较昨日 +15.3%', icon: FileText, tone: 'orange' },
      { label: '访问入口', value: '8085', change: 'nginx 正常', icon: BarChart3, tone: 'purple' }
    ];
    enabledModules.value = modules.filter((item) => item.status === 'enabled').slice(0, 4);
  } catch (error) {
    console.warn('[dashboard] load stats failed', error);
    errorMessage.value = error.message;
  }
});
</script>

<template>
  <section class="dashboard-page">
    <div class="dashboard-hero">
      <div>
        <h1>工作台</h1>
        <p>欢迎回来，管理员，祝你开发顺利。</p>
      </div>
      <button class="date-button" type="button">
        <CalendarDays :size="16" />
        <span>2026-04-29</span>
      </button>
    </div>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <div class="admin-stats-grid">
      <article v-for="item in stats" :key="item.label" class="admin-stat-card">
        <span class="admin-stat-icon" :class="item.tone">
          <component :is="item.icon" :size="24" />
        </span>
        <div>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.change }}</small>
        </div>
      </article>
    </div>

    <div class="dashboard-main-grid">
      <section class="admin-card trend-card">
        <div class="admin-card-header">
          <strong>趋势分析</strong>
          <button class="mini-select" type="button">近30天</button>
        </div>
        <div class="chart-legend">
          <span><i class="blue-dot"></i>模块访问</span>
          <span><i class="green-dot"></i>工具使用</span>
        </div>
        <svg class="line-chart" viewBox="0 0 760 260" role="img" aria-label="趋势分析">
          <defs>
            <linearGradient id="blueArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.22" />
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="greenArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#34d399" stop-opacity="0.2" />
              <stop offset="100%" stop-color="#34d399" stop-opacity="0" />
            </linearGradient>
          </defs>
          <g class="chart-grid">
            <line x1="48" y1="40" x2="720" y2="40" />
            <line x1="48" y1="92" x2="720" y2="92" />
            <line x1="48" y1="144" x2="720" y2="144" />
            <line x1="48" y1="196" x2="720" y2="196" />
          </g>
          <path class="area blue" d="M48 184 L116 156 L184 164 L252 148 L320 132 L388 88 L456 126 L524 142 L592 130 L660 148 L720 120 L720 220 L48 220 Z" />
          <path class="area green" d="M48 206 L116 186 L184 190 L252 176 L320 158 L388 134 L456 168 L524 158 L592 164 L660 150 L720 142 L720 220 L48 220 Z" />
          <polyline class="line blue" points="48,184 116,156 184,164 252,148 320,132 388,88 456,126 524,142 592,130 660,148 720,120" />
          <polyline class="line green" points="48,206 116,186 184,190 252,176 320,158 388,134 456,168 524,158 592,164 660,150 720,142" />
          <g class="chart-labels">
            <text x="48" y="248">04-01</text>
            <text x="230" y="248">04-10</text>
            <text x="412" y="248">04-18</text>
            <text x="594" y="248">04-25</text>
          </g>
        </svg>
      </section>

      <section class="admin-card quick-card">
        <div class="admin-card-header">
          <strong>快捷操作</strong>
        </div>
        <div class="quick-grid">
          <button v-for="item in quickActions" :key="item.label" type="button" class="quick-action">
            <span class="admin-stat-icon small" :class="item.tone">
              <component :is="item.icon" :size="20" />
            </span>
            <strong>{{ item.label }}</strong>
          </button>
        </div>
      </section>
    </div>

    <div class="dashboard-bottom-grid">
      <section class="admin-card">
        <div class="admin-card-header">
          <strong>最新动态</strong>
        </div>
        <div class="activity-list">
          <article v-for="item in activities" :key="item.text">
            <span class="activity-icon"><component :is="item.icon" :size="16" /></span>
            <p>{{ item.text }}</p>
            <small>{{ item.time }}</small>
          </article>
        </div>
      </section>

      <section class="admin-card">
        <div class="admin-card-header">
          <strong>系统公告</strong>
          <span>更多</span>
        </div>
        <div class="notice-list">
          <article v-for="item in notices" :key="item.text">
            <span>{{ item.type }}</span>
            <div>
              <p>{{ item.text }}</p>
              <small>{{ item.time }}</small>
            </div>
          </article>
        </div>
      </section>

      <section class="admin-card overview-card">
        <div class="admin-card-header">
          <strong>系统概览</strong>
          <button class="mini-select" type="button">访问来源</button>
        </div>
        <div class="donut-layout">
          <div class="donut-chart">
            <span>总访问量</span>
            <strong>98,765</strong>
          </div>
          <div class="donut-legend">
            <span><i class="blue-dot"></i>直接访问 35.6%</span>
            <span><i class="green-dot"></i>工具预览 28.4%</span>
            <span><i class="orange-dot"></i>内容访问 20.1%</span>
            <span><i class="purple-dot"></i>其他 15.9%</span>
          </div>
        </div>
      </section>
    </div>

    <div class="module-strip">
      <span v-for="item in enabledModules" :key="item.code">{{ item.name }}</span>
    </div>
  </section>
</template>
