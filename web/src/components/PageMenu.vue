<template>
  <div class="page-menu">
    <el-dropdown
      trigger="click"
      @command="handleClickMenu"
      placement="bottom-start"
    >
      <span class="page-menu-icon cp">
        <el-icon :size="26">
          <!-- 这里大写，否则会出现 Menu 组件注册但未使用的提示 -->
          <Menu />
        </el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="item in finalMenuList"
            :key="item.key"
            :command="item.key"
            class="menu-item"
          >
            {{ item.text }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
import { computed, toRefs } from "vue";
import { useRouter } from "vue-router";
import { Menu } from "@element-plus/icons";

export default {
  name: "PageMenu",
  props: {
    menuList: {
      type: Array,
      default: () => [],
    },
  },
  components: {
    Menu,
  },
  emits: ["menuCommand"],
  setup(props, ctx) {
    const { menuList } = toRefs(props);
    const finalMenuList = computed(() => {
      return [{ key: "home", text: "首页" }, ...menuList.value];
    });
    console.log(props, finalMenuList);

    const router = useRouter();

    // 点击菜单
    function handleClickMenu(key) {
      console.log(key);
      if (key === "home") {
        router.push("/");
      } else {
        ctx.emit("menuCommand", key);
      }
    }

    return {
      finalMenuList,
      handleClickMenu,
    };
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less" scoped>
.page-menu {
  opacity: 0.3;
  position: relative;
  font-size: 16px;
  width: 50px;
  height: 50px;
  box-sizing: border-box;
  padding: 5px 0 0 5px;
  &:hover {
    opacity: 1;
  }
  .page-menu-icon {
    color: var(--themeColor);
  }
}
</style>
