<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { LogIn } from 'lucide-vue-next';
import { login } from '../api/auth';

const router = useRouter();
const form = ref({
  username: 'admin',
  password: '123456'
});
const loading = ref(false);
const errorMessage = ref('');

async function handleLogin() {
  loading.value = true;
  errorMessage.value = '';
  try {
    await login(form.value);
    router.push('/');
  } catch (error) {
    console.warn('[login] failed', error);
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-visual">
      <span class="brand-mark large">RSX</span>
      <h1>Module RSX</h1>
      <p>教学工具、内容文章和基础模块的统一管理入口</p>
      <div class="login-metrics">
        <span>Docker</span>
        <span>Redis</span>
        <span>MySQL</span>
      </div>
    </section>

    <section class="login-panel">
      <div class="login-title">
        <span class="brand-mark">RSX</span>
        <div>
          <h1>登录管理端</h1>
          <p>使用管理员账号进入系统</p>
        </div>
      </div>

      <form class="form-grid" @submit.prevent="handleLogin">
        <label>
          <span>用户名</span>
          <input v-model="form.username" autocomplete="username" />
        </label>
        <label>
          <span>密码</span>
          <input v-model="form.password" type="password" autocomplete="current-password" />
        </label>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <button class="primary-button" type="submit" :disabled="loading">
          <LogIn :size="18" />
          <span>{{ loading ? '登录中' : '登录' }}</span>
        </button>
      </form>
    </section>
  </main>
</template>
