<template>
  <router-view v-slot="{ Component }" class="router-view">
    <!-- 部分浏览器，比如 via，动画会导致页面出现大面积可滚动空白 -->
    <!-- <transition
      enter-active-class="animate__animated animate__slideInRight"
      leave-active-class="animate__animated animate__slideOutLeft"
    > -->
      <component :is="Component" />
    <!-- </transition> -->
  </router-view>
  <el-backtop :right="50" :bottom="50" />
</template>

<script>
import { ref } from "vue";

export default {
  name: "App",
  setup() {
    const status = ref(0);

    return status;
  },
};
</script>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center; */
  color: #2c3e50;
  width: 100%;
  background-color: #eceff1;
  .router-view {
    position: absolute;
    width: 100%;
    min-height: 100vh;
  }
}
</style>
