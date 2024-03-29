<template>
  <div class="search-page" ref="wrapperEl">
    <div class="wrapper" :class="{ sidebar: showWords }">
      <!-- 侧栏 -->
      <div
        v-if="showWords"
        v-loading="wordListLoading"
        class="word-list-panel-wrapper"
        @click.self="hideSidebar"
      >
        <div class="sticky-container">
          <word-list-panel
            :word-list="wordList"
            :word="word"
            :wordbook-list="wordbook"
            :wordbook-checked="wordbookChecked"
            @search-word="pushQuery"
            @select-book="handleSelectBook"
          />
        </div>
      </div>
      <!-- 内容部分 -->
      <div class="content">
        <!-- 菜单 -->
        <div class="page-menu-wrapper">
          <page-menu @menu-command="handleMenuCommand" :menu-list="menuList" />
        </div>
        <!-- 搜索 -->
        <div class="search-wrapper">
          <div class="dict-dropdown">
            <!-- el-dropdown 添加 class 无效。因为没有生成 data-v -->
            <el-dropdown
              :hide-on-click="false"
              trigger="click"
              placement="bottom-start"
            >
              <el-icon :size="26" color="#333" class="cp"><notebook /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="(item, index) in computedDictList"
                    :key="index"
                    :command="item.id"
                  >
                    <el-checkbox
                      :checked="item.checked"
                      @change="(value) => handleChangeDict(value, item.id)"
                      >{{ item.name }}</el-checkbox
                    >
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <el-input
            class="search-input"
            v-model="word"
            placeholder="please type a word"
            clearable
            @keypress="handleKeypress"
          />
          <el-button
            class="search-btn"
            @click="handleSearchBtnClick"
            type="primary"
            :loading="loading"
            >search</el-button
          >
        </div>
        <!-- 结果 -->
        <div v-show="wordResultList.length" class="result">
          <section
            class="result-section"
            v-for="(item, index) in wordResultList"
            :key="index"
          >
            <div class="sect-header">
              <h1 class="dict-name cp" @click="showDictInfo(item)">
                {{ item.dictName }}
              </h1>
              <el-icon
                class="arrow-icon"
                :class="item.expand === false ? 'shrink' : ''"
                @click="handleExpand(index)"
              >
                <arrow-down-bold />
              </el-icon>
            </div>
            <div
              class="dict-content-wrapper"
              :class="item.expand === false ? 'shrink' : ''"
            >
              <dict-content
                :text="item.result.definition"
                @clickEntry="handleLink"
                @clickSound="(e) => handleSound(item.dictId, e)"
              ></dict-content>
            </div>
          </section>
        </div>

        <div v-if="tipList.length" class="tip-content">
          <p class="tip-text">you may want to search those words:</p>
          <div class="tip-list">
            <span
              class="tip-word"
              v-for="(item, index) in tipList"
              :key="index"
              @click="handleClickTipItem(item)"
            >
              {{ item }}
            </span>
          </div>
        </div>
        <!-- 无结果提示 -->
        <div v-if="(wordResultList.length === 0 && tipList.length === 0)" class="result-empty">暂无结果</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import "element-plus/es/components/message-box/style/index";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDownBold, Notebook } from "@element-plus/icons";
import PageMenu from "@/components/PageMenu";
import WordListPanel from "./components/WordListPanel";
import {
  searchWord,
  fuzzySearch,
  getWordList,
  getWordbook,
  getSound,
} from "../../services/api";
import { phoneticFormat, base64ToImg } from "../../utils";
import { store } from "../../store";
import { useLocalStorage } from "@vueuse/core";

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const word = ref(route.query.word || "");
    const wordResultList = ref([]);
    const wrapperEl = ref(null);
    const loading = ref(false);
    const tipList = ref([]);
    // 词典列表
    const dictList = ref(store.dictList);
    const dictChecked = ref(useLocalStorage("dictChecked"));
    const computedDictList = computed(() => {
      return dictList.value.map((item) => {
        return {
          ...item,
          checked:
            !dictChecked.value ||
            dictChecked.value?.split(",")?.includes(item.id),
        };
      });
    });

    // 添加路由
    function pushQuery(word) {
      router
        .push({
          path: "/search",
          query: {
            word,
          },
        })
        .catch(() => {});
    }

    // 回车
    function handleKeypress(e) {
      if (e.key.toLowerCase() !== "enter") return;
      if (word.value.trim() === route.query.word) {
        handleSearch();
      } else {
        pushQuery(word.value.trim());
      }
    }

    // 点击搜索按钮
    function handleSearchBtnClick() {
      if (word.value.trim() === route.query.word) {
        handleSearch();
      } else {
        pushQuery(word.value.trim());
      }
    }

    // 搜索
    function handleSearch(wordStr) {
      if (wordStr) {
        word.value = wordStr;
        if (store.isMobile) {
          hideSidebar();
        }
      }
      const str = word.value.trim();
      if (!str) {
        ElMessage({
          message: "please type a word",
          type: "info",
          customClass: "message-info",
        });
        return;
      }

      if (!dictChecked.value) {
        ElMessage({
          message: "please check a dict",
          type: "info",
          customClass: "message-info",
        });
        return;
      }

      loading.value = true;

      searchWord({
        word: str,
        dictIds: dictChecked.value,
      })
        .then((res) => {
          if (res.data.code === 0) {
            // 找到了就显示
            if (res.data.data.length) {
              wordResultList.value = res.data.data.map((item) => {
                if (item.result?.definition) {
                  // 音标替换
                  item.result.definition = phoneticFormat(
                    item.result.definition
                  );
                  // 图片处理
                  item.result = base64ToImg(item.result);
                }

                return {
                  ...item,
                  expand: true,
                };
              });
              tipList.value = [];
            } else {
              // 否则尝试建议单词
              fuzzySearch({
                word: str,
                dictIds: dictChecked.value,
              })
                .then(({ data }) => {
                  if (data.data.length) {
                    let arr = [];
                    data.data.map((dict) => {
                      arr.push(...dict.result);
                    });
                    arr = arr
                      .sort((a, b) => a.ed - b.ed)
                      .map((entry) => entry.key);
                    arr = [...new Set(arr)];
                    tipList.value = arr;
                  } else {
                    tipList.value = [];
                    wordResultList.value = [];
                  }
                })
                .catch((e) => {
                  ElMessage({
                    message: e.message ?? "error",
                    type: "error",
                  });
                })
                .finally(() => {
                  wordResultList.value = [];
                });
            }
          } else {
            throw new Error(res.data);
          }
        })
        .catch((e) => {
          ElMessage({
            message: e.message ?? "error",
            type: "error",
          });
        })
        .finally(() => {
          loading.value = false;
          nextTick(() => {
            // console.log(wrapperEl);
            // wrapperEl.value.scrollTop = 0;
            document.scrollingElement.scrollTop = 0;
          });
        });
    }

    // url 单词改变的时候触发查询
    watch(
      () => route.query.word,
      (newVal) => {
        console.log(newVal);
        if (newVal) {
          handleSearch(newVal);
        }
      }
    );

    // 处理链接
    function handleLink(e) {
      // word.value = e.detail.entry;
      pushQuery(e.detail.entry);
      // handleSearch();
    }

    // 处理音频
    // function handleSound(e) {
    //   const audio = new Audio(e.detail.sound);
    //   audio.autoplay = true;
    // }
    // 音频变量
    const audio = new Audio()
    audio.autoplay = true
    function handleSound(dictId, e) {
      getSound({
        dictId,
        file: e.detail.sound,
      })
        .then(({ data }) => {
          if (data?.data) {
            audio.src = data.data
          } else {
            throw new Error("没有音频");
          }
        })
        .catch((e) => {
          ElMessage.error(e);
        });
    }

    // 处理显隐
    function handleExpand(index) {
      console.log(index);
      wordResultList.value[index].expand = !wordResultList.value[index].expand;
    }

    // 点击建议词
    function handleClickTipItem(str) {
      // word.value = str;
      // handleSearch();
      pushQuery(str);
    }

    // 改变词典勾选
    function handleChangeDict(value, dictId) {
      const dictCheckedArr = dictChecked.value?.split(",") ?? [];
      if (dictCheckedArr.includes(dictId) && !value) {
        dictChecked.value = dictCheckedArr
          .filter((v) => v !== dictId)
          .join(",");
      } else if (!dictCheckedArr.includes(dictId) && value) {
        dictCheckedArr.push(dictId);
        dictChecked.value = dictCheckedArr.join(",");
      }
    }

    // 显示词典信息
    function showDictInfo(item) {
      const dict = dictList.value.find((v) => v.id === item.dictId);
      if (dict) {
        ElMessageBox.alert(
          `名称：${item.dictName}<br>词条数：${dict.info?.keyHeader?.entriesNum}`,
          "词典信息",
          {
            dangerouslyUseHTMLString: true,
          }
        ).catch(() => {});
      }
    }

    // 菜单
    const menuList = [{ key: "words", text: "单词表" }];
    const showWords = ref(false);
    const wordbook = ref([]);
    const wordbookChecked = ref(null);
    const wordList = ref([]);
    const wordListLoading = ref(false);

    // 点击菜单
    function handleMenuCommand(key) {
      if (key === "words") {
        showWords.value = !showWords.value;
        if (showWords.value && wordList.value.length === 0) {
          getWordListFunc(wordbookChecked.value);
        }
      }
    }

    // 获取词书
    function getWordbookList() {
      getWordbook()
        .then(({ data }) => {
          if (data.code === 0) {
            wordbook.value = data.data;
            if (wordbook.value.length) {
              wordbookChecked.value = wordbook.value[0];
            }
          } else {
            throw new Error(data);
          }
        })
        .catch((e) => {
          ElMessage({
            message: e.message ?? "error",
            type: "error",
          });
        });
    }

    // 切换词书
    function handleSelectBook(book) {
      wordbookChecked.value = book;
      getWordListFunc(book);
    }

    // 获取单词
    function getWordListFunc(book = "") {
      wordListLoading.value = true;

      getWordList({
        page: 1,
        size: 40000,
        book,
      })
        .then((res) => {
          if (res.data.code === 0) {
            wordList.value = res.data.data.list;
          } else {
            throw new Error(res.data);
          }
        })
        .catch((e) => {
          ElMessage({
            message: e.message ?? "error",
            type: "error",
          });
        })
        .finally(() => {
          wordListLoading.value = false;
        });
    }

    // 隐藏侧栏
    function hideSidebar() {
      showWords.value = false;
    }

    // 挂载
    onMounted(() => {
      if (word.value) {
        handleSearch();
      }
      getWordbookList();
    });

    return {
      word,
      wordResultList,
      wrapperEl,
      loading,
      tipList,
      handleKeypress,
      handleSearchBtnClick,
      pushQuery,
      handleSearch,
      handleLink,
      handleSound,
      handleExpand,
      handleClickTipItem,
      // 词典
      dictList,
      dictChecked,
      computedDictList,
      handleChangeDict,
      showDictInfo,
      // 菜单和单词表
      handleMenuCommand,
      menuList,
      wordbook,
      wordbookChecked,
      showWords,
      wordList,
      wordListLoading,
      handleSelectBook,
      hideSidebar,
    };
  },
  components: {
    ArrowDownBold,
    Notebook,
    PageMenu,
    WordListPanel,
  },
};
</script>

<style lang="less" scoped>
.search-page {
  background-color: var(--themeColor);
}

.wrapper {
  position: relative;
  width: 100%;
  max-width: 1000px;
  min-height: calc(100vh - 20px);
  left: 0;
  right: 0;
  margin: 10px auto;
  background-color: white;
  display: flex;
  box-sizing: border-box;
  padding: 50px 30px;
  line-height: 1.5;
  word-break: break-word;
  .content {
    width: 100%;
    flex: 1;
  }
  .search-wrapper {
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    position: relative;
    .search-input {
      flex: 1;
      height: 100%;
      font-size: 18px;
      line-height: 1;
      :deep(.el-input__inner) {
        height: 100%;
        border-radius: 25px;
        box-shadow: 2px 1px 1px rgb(233, 232, 232);
        transition: all 0.5;
        padding: 0 85px 0 55px;
        &:focus {
          box-shadow: 2px 5px 5px rgb(233, 232, 232);
        }
      }
      :deep(.el-input__suffix) {
        margin-right: 90px;
        display: inline-flex;
        align-items: center;
        .el-input__clear {
          font-size: 28px;
          width: auto;
        }
      }
    }
    .dict-dropdown {
      position: absolute;
      left: 0;
      height: 100%;
      z-index: 1;
      width: 50px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 25px;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    .search-btn {
      position: absolute;
      right: 0;
      width: 80px;
      min-width: 80px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 25px;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }
  .result {
    width: 100%;
    max-width: 1200px;
    padding: 50px 10px 0;
    box-sizing: border-box;
    height: calc(100% - 50px);
    overflow: auto;
    .result-section {
      padding-bottom: 30px;
      overflow: hidden;
      .sect-header {
        border-top: 1px solid var(--themeColor);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: white;
        position: relative;
        z-index: 1;
        .dict-name {
          margin: 0;
          padding: 0 5px;
          font-size: 16px;
          background-color: var(--themeColor);
          color: white;
          &::selection {
            color: var(--themeColor);
            background-color: white;
          }
        }
        .arrow-icon {
          cursor: pointer;
          padding: 5px;
          transform: rotate(0deg);
          transition: all 0.3s;
          &:hover {
            background-color: #eee;
            border-radius: 50%;
          }
          &.shrink {
            transform: rotate(-90deg);
          }
        }
      }
      .dict-content-wrapper {
        transition: all 0.3s;
        height: auto;
        overflow: hidden;
        &.shrink {
          height: 0;
        }
      }
    }
  }
  .tip-content {
    width: 100%;
    text-align-last: left;
    .tip-word {
      display: inline-block;
      padding: 3px 6px;
      margin-right: 10px;
      margin-bottom: 10px;
      border-radius: 10px;
      font-size: 14px;
      background-color: var(--secondary);
      color: white;
      cursor: pointer;
    }
  }
  .word-list-panel-wrapper {
    width: 200px;
    min-width: 200px;
    height: 100%;
    position: absolute;
    top: 0;
    left: -210px;
    z-index: 2;
    .sticky-container {
      width: 200px;
      height: calc(100vh - 20px);
      position: sticky;
      top: 10px;
      background-color: white;
    }
  }
}

// 当宽度小于 1460 的时候，就需要把侧栏单词移到内容区
@media screen and (max-width: 1460px) {
  .wrapper.sidebar {
    padding-left: 210px;
    .word-list-panel-wrapper {
      left: 0;
    }
    .page-menu-wrapper {
      left: 200px;
    }
  }
}

@media screen and (max-width: 1000px) {
  .wrapper {
    min-height: 100vh;
    margin: 0;
    padding: 30px 12px;
    border-radius: 0;
  }
}

// 当宽度小于 600 时，侧栏浮层显示
@media screen and (max-width: 550px) {
  .wrapper.sidebar {
    padding-left: 12px;
    .word-list-panel-wrapper {
      left: 0;
      width: 100%;
      background-color: rgba(0, 0, 0, 0.2);
      .sticky-container {
        height: 100vh;
        top: 0;
      }
    }
    .page-menu-wrapper {
      left: 10px;
    }
  }
}
</style>