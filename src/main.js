import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';
import ModulesView from './views/ModulesView.vue';
import ToolsView from './views/ToolsView.vue';
import ArticlesView from './views/ArticlesView.vue';
import './styles.css';

const routes = [
  { path: '/login', component: LoginView, meta: { title: '登录' } },
  { path: '/', component: DashboardView, meta: { title: '工作台' } },
  { path: '/modules', component: ModulesView, meta: { title: '模块管理' } },
  { path: '/tools', component: ToolsView, meta: { title: '教学工具' } },
  { path: '/articles', component: ArticlesView, meta: { title: '文章管理' } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const token = localStorage.getItem('module-rsx-token');
  if (to.path !== '/login' && !token) {
    return '/login';
  }
  if (to.path === '/login' && token) {
    return '/';
  }
});

createApp(App).use(router).mount('#app');
