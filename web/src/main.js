import { createApp } from 'vue'
// import ElementPlus from 'element-plus'
// import 'element-plus/dist/index.css'
import "element-plus/es/components/message/style/index";
import App from './App.vue'
import router from './router'
import './styles/animate.clip.css'
import './styles/index.less'
import './webComponents'
// import 'xy-ui'

const app = createApp(App)

// // 自定义 web components
// app.config.compilerOptions.isCustomElement = tag => tag === 'dict-content'
app.use(router)
// app.use(ElementPlus)
app.mount('#app')
