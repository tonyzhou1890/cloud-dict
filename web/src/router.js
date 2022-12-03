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
    component: () => import('./pages/search/index.vue')
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

router.beforeEach(async (to, from, next) => {
  // 获取字典列表
  if (store.dictList.length === 0) {
    const { data } = await dictList({ all: true })
    if (data.code === 0) {
      store.dictList = data.data
      const dictChecked = useLocalStorage('dictChecked', '')
      // 过滤后端不存在的字典
      if (dictChecked.value?.length) {
        const ids = store.dictList.map(v => v.id)
        dictChecked.value = dictChecked.value.split(',').filter(v => ids.includes(v)).join(',')
      }
      if (!dictChecked.value?.length) {
        // 没有选中字典就使用全部字典
        dictChecked.value = store.dictList.map(v => v.id).join(',')
      }
    }
  }
  next()
})

export default router