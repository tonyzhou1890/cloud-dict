import { reactive } from 'vue'

export const store = reactive({
  dictList: [],
  isMobile: window.innerWidth <= 550, // 是否移动端
})

export default {
  store
}

window.addEventListener('resize', () => {
  store.isMobile = window.innerWidth <= 550
})