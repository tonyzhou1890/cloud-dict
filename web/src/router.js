import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('./pages/index')
  },
  {
    path: '/search',
    component: () => import('./pages/search')
  },
  {
    path: '/export',
    component: () => import('./pages/export')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router