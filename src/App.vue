<script setup>
import { computed, ref, watchEffect } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { Bell, FileText, Home, LogOut, Menu, Puzzle, Search, Wrench } from 'lucide-vue-next';
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
        <span class="brand-mark">RSX</span>
        <div>
          <strong>Module RSX</strong>
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
      </nav>

      <div class="sidebar-foot">
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
