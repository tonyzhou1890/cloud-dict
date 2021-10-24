import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('./pages/index')
  },
  {
    path: '/search',
    component: () => import('./pages/search')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router