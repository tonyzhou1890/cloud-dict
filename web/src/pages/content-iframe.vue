<template>
  <div ref="contentEl" class="iframe-content" v-html="text">
  </div>
</template>

<script>
import { ref, onMounted } from "vue";

export default {
  setup() {
    const text = ref('')
    // 设置词典数据
    function setWordData(data) {
      text.value = data
    }
    // 从父级 window 获取数据
    function getWordData() {
      if (!window.parent._getWordData || !window._dict) {
        return
      }
      setWordData(window.parent._getWordData(window._dict.id))
    }

    const contentEl = ref(null)
    // 获取 iframe 需要的高度
    function getIframeHeight() {
      console.log(contentEl.value)
    }
    // 调用父窗口设置 iframe 大小
    function setIframeHeight() {
      if (window.parent._setIframeHeight && window._dict) {
        window.parent._setIframeHeight(window._dict.id, getIframeHeight())
      }
    }
    // 响应窗口大小或者 dom 状态改变
    const observer = new MutationObserver(setIframeHeight)

    onMounted(() => {
      getWordData()
      observer.observe(contentEl.value, {
        childList: true,
        attributes: true,
        subtree: true
      })
    })
    

    // 绑定事件
    // window.addEventListener('resize')

    window._setWordData = setWordData
    window._getWordData = getWordData
    window._getIframeHeight = getIframeHeight

    getWordData()

    return {
      text,
      contentEl
    };
  },
};
</script>

<style lang="less" scoped>
.iframe-content {
  width: 100%;
  overflow: hidden;
}
</style>