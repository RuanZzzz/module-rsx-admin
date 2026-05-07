<script setup>
import { computed, ref, watchEffect } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import {
  BarChart3,
  Bell,
  Box,
  ClipboardList,
  Database,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  MonitorCog,
  Puzzle,
  Search,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
  Ruler
} from 'lucide-vue-next';
import { currentUser, logout } from './api/auth';
import { getToken } from './api/http';

const route = useRoute();
const router = useRouter();
const user = ref(null);
const isLoginPage = computed(() => route.path === '/login');
const pageTitle = computed(() => route.meta?.title || '工作台');

watchEffect(async () => {
  if (isLoginPage.value || !getToken()) {
    user.value = null;
    return;
  }

  try {
    user.value = await currentUser();
  } catch (error) {
    console.warn('[auth] load current user failed', error);
  }
});

async function handleLogout() {
  await logout();
  router.push('/login');
}
</script>

<template>
  <RouterView v-if="isLoginPage" />
  <div v-else class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-cube">
          <Box :size="22" />
        </span>
        <div>
          <strong>RSX Admin</strong>
          <small>教学管理平台</small>
        </div>
      </div>

      <nav class="nav-list">
        <RouterLink to="/" class="nav-item">
          <Home :size="18" />
          <span>工作台</span>
        </RouterLink>
        <RouterLink to="/modules" class="nav-item">
          <Puzzle :size="18" />
          <span>模块管理</span>
        </RouterLink>
        <RouterLink to="/tools" class="nav-item">
          <Wrench :size="18" />
          <span>教学工具</span>
        </RouterLink>
        <RouterLink to="/articles" class="nav-item">
          <FileText :size="18" />
          <span>文章管理</span>
        </RouterLink>
        <RouterLink to="/orders" class="nav-item">
          <ClipboardList :size="18" />
          <span>订单管理</span>
        </RouterLink>
        <RouterLink to="/window-glass" class="nav-item">
          <Ruler :size="18" />
          <span>玻璃计算</span>
        </RouterLink>

        <div class="nav-group-title">系统管理</div>
        <span class="nav-item ghost"><Users :size="18" /><span>用户管理</span></span>
        <span class="nav-item ghost"><UserCog :size="18" /><span>角色管理</span></span>
        <span class="nav-item ghost"><ShieldCheck :size="18" /><span>权限管理</span></span>

        <div class="nav-group-title">运营中心</div>
        <span class="nav-item ghost"><ClipboardList :size="18" /><span>业务统计</span></span>
        <span class="nav-item ghost"><BarChart3 :size="18" /><span>数据分析</span></span>
        <span class="nav-item ghost"><MessageSquare :size="18" /><span>消息管理</span></span>
        <span class="nav-item ghost"><MonitorCog :size="18" /><span>系统监控</span></span>
      </nav>

      <div class="sidebar-foot">
        <span class="sidebar-cube"><Database :size="32" /></span>
        <span>本地容器环境</span>
        <strong>Docker Compose</strong>
      </div>
    </aside>

    <main class="workspace">
      <header class="topbar">
        <div class="topbar-left">
          <button class="icon-button muted" type="button" title="菜单">
            <Menu :size="18" />
          </button>
          <div>
            <strong>{{ pageTitle }}</strong>
            <span>module-rsx / {{ pageTitle }}</span>
          </div>
        </div>

        <div class="topbar-right">
          <label class="topbar-search">
            <Search :size="16" />
            <input placeholder="搜索模块、工具或文章" />
          </label>
          <button class="icon-button muted" type="button" title="通知">
            <Bell :size="18" />
            <span class="notice-dot">2</span>
          </button>
          <button class="icon-button muted" type="button" title="设置">
            <Settings :size="18" />
          </button>
          <div class="user-chip">
            <span class="user-avatar">{{ (user?.nickname || '系统管理员').slice(0, 1) }}</span>
            <div>
              <strong>{{ user?.nickname || '系统管理员' }}</strong>
              <span>{{ user?.username || 'admin' }}</span>
            </div>
          </div>
          <button class="icon-button" type="button" @click="handleLogout" title="退出登录">
            <LogOut :size="18" />
          </button>
        </div>
      </header>
      <RouterView />
    </main>
  </div>
</template>
