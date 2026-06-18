import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: () => import('./views/Dashboard.vue') },
  { path: '/cards', component: () => import('./views/Cards.vue') },
  { path: '/pools', component: () => import('./views/Pools.vue') },
  { path: '/merge-rules', component: () => import('./views/MergeRules.vue') },
  { path: '/configs', component: () => import('./views/Configs.vue') },
  { path: '/users', component: () => import('./views/Users.vue') },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
