<template>
  <div class="word-list-panel full">
    <el-select
      :model-value="wordbookChecked"
      @change="handleChangeBook"
      size="small"
      class="book-select"
    >
      <el-option
        v-for="item in wordbookList"
        :key="item"
        :value="item"
        placeholder="选择词书"
        >{{ item }}</el-option
      >
    </el-select>
    <el-input
      class="filter-input"
      v-model="inputValue"
      placeholder="单词/区间：[100-200]"
      size="small"
      clearable
    />
    <div class="list">
      <virtual-List
        class="word-list full"
        :data-key="'word'"
        :data-sources="finalWordList"
        :estimate-size="40"
        :keeps="60"
      >
        <template #default="{ source }">
          <div
            class="word-item ellipsis cp"
            :class="{ check: source.check }"
            @click="handleSearchWord(source.word)"
          >
            <span class="order-num">{{ source.index }}.</span>
            <span> {{ source.word }}</span>
          </div>
        </template>
      </virtual-List>
      <!-- <word-item v-for="item in finalWordList" :key="item.word" :word="item" /> -->
    </div>
  </div>
</template>

<script>
import { toRefs, ref, computed } from "vue";
import { orderRegexp } from "@/utils/config";

export default {
  name: "WordListPanel",
  props: {
    wordbookList: {
      type: Array,
      default: () => [],
    },
    wordbookChecked: {
      type: String,
      default: "",
    },
    wordList: {
      type: Array,
      default: () => [],
    },
    word: {
      type: String,
      default: "",
    },
  },
  emits: ["searchWord", "selectBook"],
  setup(props, ctx) {
    const { wordList, word } = toRefs(props);
    const inputValue = ref("");
    const finalWordList = computed(() => {
      const wordListFiltered = [];
      // 序号区间
      let start = null;
      let end = null;
      if (orderRegexp.test(inputValue.value)) {
        const result = inputValue.value.match(orderRegexp);
        start = result[1] ? Number(result[1]) : 0;
        end = result[2] ? Number(result[2]) : wordList.value.length;
      }

      for (let i = 0; i < wordList.value.length; i++) {
        // 区间
        if (start !== null && (i + 1 < start || i >= end)) {
          continue;
        }
        // 值匹配
        if (
          start === null &&
          inputValue.value &&
          !wordList.value[i].startsWith(inputValue.value)
        ) {
          continue;
        }

        wordListFiltered.push({
          index: i + 1,
          word: wordList.value[i],
          check: word.value === wordList.value[i],
        });
      }
      return wordListFiltered;
    });

    // 点击单词，搜索
    function handleSearchWord(word) {
      ctx.emit("searchWord", word);
    }

    // 切换词书
    function handleChangeBook(value) {
      ctx.emit("selectBook", value);
    }

    return {
      inputValue,
      finalWordList,
      handleSearchWord,
      handleChangeBook,
    };
  },
};
</script>

<style lang="less" scoped>
.word-list-panel {
  .title {
    text-align: center;
    font-size: 18px;
    line-height: 1;
    font-weight: bold;
    margin: 0;
    padding: 10px;
  }
  .book-select,
  .filter-input {
    width: calc(100% - 20px);
    box-sizing: border-box;
    margin: 10px 10px 0;
  }
  .list {
    width: 100%;
    height: calc(100% - 84px);
    box-sizing: border-box;
    padding-top: 10px;
    .word-list {
      overflow-y: auto;
      .word-item {
        width: 100%;
        height: 30px;
        line-height: 30px;
        box-sizing: border-box;
        padding: 0 10px;
        .order-num {
          margin-right: 5px;
        }
        &.check {
          font-weight: bold;
          background-color: var(--secondary);
          color: white;
        }
        &:hover {
          background-color: var(--secondary);
          color: white;
        }
      }
    }
  }
}
</style>