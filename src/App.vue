<script setup>
import { computed, ref, watchEffect } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { FileText, Home, LogOut, Puzzle, Wrench } from 'lucide-vue-next';
import { currentUser, logout } from './api/auth';
import { getToken } from './api/http';

const route = useRoute();
const router = useRouter();
const user = ref(null);
const isLoginPage = computed(() => route.path === '/login');

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
          <strong>管理端</strong>
          <small>module-rsx</small>
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
    </aside>

    <main class="workspace">
      <header class="topbar">
        <div>
          <strong>{{ user?.nickname || '系统管理员' }}</strong>
          <span>{{ user?.username || 'admin' }}</span>
        </div>
        <button class="icon-button" type="button" @click="handleLogout" title="退出登录">
          <LogOut :size="18" />
        </button>
      </header>
      <RouterView />
    </main>
  </div>
</template>
