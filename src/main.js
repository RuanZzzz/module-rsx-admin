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
  { path: '/login', component: LoginView },
  { path: '/', component: DashboardView },
  { path: '/modules', component: ModulesView },
  { path: '/tools', component: ToolsView },
  { path: '/articles', component: ArticlesView }
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
