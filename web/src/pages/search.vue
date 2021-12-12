<template>
  <div class="search-page" ref="wrapperEl">
    <div class="wrapper">
      <div class="search-wrapper">
        <div class="dict-dropdown">
          <!-- el-dropdown 添加 class 无效。因为没有生成 data-v -->
          <el-dropdown :hide-on-click="false" placement="bottom-start">
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
          @keypress="handleKeypress"
        />
        <el-button
          class="search-btn"
          @click="handleSearch"
          type="primary"
          :loading="loading"
          >search</el-button
        >
      </div>

      <div v-show="wordResultList.length" class="result">
        <section
          class="result-section"
          v-for="(item, index) in wordResultList"
          :key="index"
        >
          <div class="sect-header">
            <h1 class="dict-name">{{ item.dictName }}</h1>
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
              @clickSound="handleSound"
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
    </div>
  </div>
</template>

<script>
import { ref, nextTick, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowDownBold, Notebook } from "@element-plus/icons";
import { searchWord, fuzzySearch } from "../services/api";
import { phoneticFormat } from "../utils";
import { store } from "../store";
import { useLocalStorage } from "@vueuse/core";

export default {
  setup() {
    const route = useRoute();
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

    // 回车
    function handleKeypress(e) {
      if (e.key.toLowerCase() !== "enter") return;
      handleSearch();
    }

    // 搜索
    function handleSearch() {
      const str = word.value.trim();
      if (!str) {
        ElMessage({
          message: "please type a word",
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
                // 音标替换
                if (item.result?.definition) {
                  item.result.definition = phoneticFormat(
                    item.result.definition
                  );
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
            console.log(wrapperEl);
            wrapperEl.value.scrollTop = 0;
          });
        });
    }

    // 处理链接
    function handleLink(e) {
      word.value = e.detail.entry;
      handleSearch();
    }

    // 处理音频
    function handleSound(e) {
      const audio = new Audio(e.detail.sound);
      audio.autoplay = true;
    }

    // 处理显隐
    function handleExpand(index) {
      console.log(index);
      wordResultList.value[index].expand = !wordResultList.value[index].expand;
    }

    // 点击建议词
    function handleClickTipItem(str) {
      word.value = str;
      handleSearch();
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

    // 挂载
    onMounted(() => {
      if (word.value) {
        handleSearch();
      }
    });

    return {
      word,
      wordResultList,
      wrapperEl,
      loading,
      tipList,
      handleKeypress,
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
    };
  },
  components: {
    ArrowDownBold,
    Notebook,
  },
};
</script>

<style lang="less" scoped>
.search-page {
  background-color: var(--themeColor);
}

.wrapper {
  width: 100%;
  max-width: 1000px;
  min-height: calc(100% - 20px);
  left: 0;
  right: 0;
  margin: 10px auto;
  border-radius: 3px;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  padding: 50px 30px;
  line-height: 1.5;
  .search-wrapper {
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    position: relative;
    .search-input {
      flex: 1;
      height: 100%;
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
}

@media screen and (max-width: 1000px) {
  .wrapper {
    min-height: 100%;
    margin: 0;
    padding: 30px 12px;
  }
}
</style>