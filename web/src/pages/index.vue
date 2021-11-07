<template>
  <div class="wrapper">
    <!-- 头部 -->
    <div class="header">
      <div class="logo-wrapper">
        <img class="logo" src="../assets/logo.png" />
      </div>
      <div class="menu-wrapper">
        <el-dropdown :hide-on-click="false" @command="handleDropMenu">
          <span class="menu">
            <el-icon :size="26" color="white">
              <!-- 这里大写，否则会出现 Menu 组件注册但未使用的提示 -->
              <Menu />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="(item, index) in menuList"
                :key="index"
                :command="item.key"
                class="menu-item"
              >
                {{ item.text }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <!-- 内容 -->
    <section class="content">
      <!-- 标题、标语 -->
      <div class="brand">
        <h1 class="title">Cloud Dict</h1>
        <p class="content-text">You can search</p>
        <p class="content-text">and you can make your own dictionary</p>
      </div>
      <!-- 搜索框 -->
      <div class="search-wrapper">
        <input
          class="search-input"
          type="search"
          v-model="word"
          @keypress="handleSearch"
          placeholder="Please input a word"
        />
        <el-icon class="search-icon" :size="26" color="#333">
          <search />
        </el-icon>
      </div>
    </section>
    <!-- 底部 -->
    <div class="footer">
      <p class="footer-text">
        Powered by
        <a target="_blank" href="https://github.com/terasum/js-mdict"
          >js-mdict</a
        >
        |
        <a target="_blank" href="https://github.com/bbottema/js-epub-maker"
          >js-epub-maker</a
        >
        | <a target="_blank" href="https://vuejs.org/">Vue</a> |
        <a target="_blank" href="https://element-plus.gitee.io/zh-CN/"
          >Element-Plus</a
        >
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Menu, Search } from "@element-plus/icons";

export default {
  setup() {
    const word = ref(undefined);
    const router = useRouter();
    // 搜索
    function handleSearch(e) {
      if (e.key.toLowerCase() !== "enter") return;
      let str = word.value?.trim();
      if (!str) {
        console.log("enpty");
      } else {
        router.push({
          path: "/search",
          query: {
            word: str,
          },
        });
      }
    }

    // 菜单
    const menuList = ref([
      {
        text: "Export",
        key: "export",
      },
      // {
      //   text: "关于",
      //   key: "about",
      // },
    ]);

    // 点击菜单
    function handleDropMenu(key) {
      if (key === "export") {
        router.push("/export");
      }
    }

    return {
      word,
      handleSearch,
      menuList,
      handleDropMenu,
    };
  },
  components: {
    Menu,
    Search,
  },
};
</script>

<style lang="less" scoped>
.wrapper {
  width: 100%;
  height: 100%;
  background: var(--themeColor);
  background-image: radial-gradient(var(--secondary), var(--themeColor));
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  line-height: 1.5;
  .header {
    width: 100%;
    box-sizing: border-box;
    height: 100px;
    padding: 0 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .logo-wrapper {
      display: flex;
      .logo {
        width: 60px;
        height: 60px;
      }
    }
    .menu-wrapper {
      .menu {
        cursor: pointer;
      }
      .menu-list {
        .menu-item {
          padding: 5px 10px;
          cursor: pointer;
          &:hover {
            background-color: var(--secondary);
            color: white;
          }
        }
      }
    }
  }
  .content {
    color: white;
    text-align: center;
    flex: 1;
    width: 100%;
    max-width: 1200px;
    box-sizing: border-box;
    padding: 0 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    // justify-content: space-between;
    .brand {
      .title {
        font-size: 30px;
        .content-text {
          font-size: 16px;
        }
      }
    }
    .search-wrapper {
      width: 100%;
      margin-top: 100px;
      height: 50px;
      display: flex;
      align-items: center;
      position: relative;
      .search-input {
        flex: 1;
        height: 100%;
        background-color: white;
        border-radius: 25px;
        border: none;
        outline: none;
        padding: 0 20px;
        text-align: center;
        &:focus {
          border: none;
          box-shadow: 0 0 0px 2px lightblue;
        }
      }
      .search-icon {
        position: absolute;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
      }
    }
  }
  .footer {
    color: white;
    a {
      color: white;
    }
  }
}

@media screen and (max-width: 500px) {
  .wrapper {
    .header {
      padding: 0 15px;
    }
    .content {
      .search-wrapper {
        margin-top: 50px;
      }
    }
  }
}
</style>