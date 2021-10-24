<template>
  <router-view v-slot="{ Component }" class="router-view">
    <transition
      enter-active-class="animate__animated animate__bounceInRight animate__delay-1s"
      leave-active-class="animate__animated animate__bounceOutLeft"
    >
      <component :is="Component" />
    </transition>
  </router-view>
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
  height: 100%;
  background-color: #eceff1;
  overflow: auto;
  .router-view {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: auto;
  }
}
</style>
