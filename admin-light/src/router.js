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

// Auth guard: allow access even without token (card_server.py has no auth)
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token');
  if (!to.meta.noAuth && !token) {
    // Auto-set a demo token so the admin works with card_server.py
    localStorage.setItem('admin_token', 'dev-token');
    localStorage.setItem('admin_user', JSON.stringify({ display_name: 'Admin', username: 'admin' }));
  }
  next();
});

export default router;
