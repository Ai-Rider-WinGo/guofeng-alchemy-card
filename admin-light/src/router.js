import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/login', component: () => import('./views/Login.vue'), meta: { noAuth: true } },
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: () => import('./views/Dashboard.vue') },
  { path: '/cards', component: () => import('./views/Cards.vue') },
  { path: '/pools', component: () => import('./views/Pools.vue') },
  { path: '/merge-rules', component: () => import('./views/MergeRules.vue') },
  { path: '/prompt-rules', component: () => import('./views/PromptRules.vue') },
  { path: '/configs', component: () => import('./views/Configs.vue') },
  { path: '/users', component: () => import('./views/Users.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token');
  if (!to.meta.noAuth && !token) {
    next('/login');
  } else if (to.path === '/login' && token) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
