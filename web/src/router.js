import { createRouter, createWebHistory } from 'vue-router'
import { store } from './store'
import { dictList } from './services/api'
import { useLocalStorage } from '@vueuse/core'

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

router.beforeEach((to, from, next) => {
  // 获取字典列表
  if (store.dictList.length === 0) {
    dictList({ all: true })
      .then(({ data }) => {
        if (data.code === 0) {
          store.dictList = data.data
          const dictChecked = useLocalStorage('dictChecked', '')
          if (!dictChecked.value?.length) {
            dictChecked.value = store.dictList.map(v => v.id).join(',')
          }
        }
      })
  }
  next()
})

export default router