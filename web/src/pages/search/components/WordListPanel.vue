<template>
  <div class="word-list-panel full">
    <p class="title">{{ title }}</p>
    <el-input
      class="filter-input"
      v-model="inputValue"
      placeholder="过滤"
      size="small"
    />
    <div class="list">
      <virtual-List
        class="word-list full"
        :data-key="'word'"
        :data-sources="finalWordList"
        :estimate-size="40"
        :keeps="60"
      >
        <template #default="{ index, source }">
          <div
            class="word-item ellipsis cp"
            :class="{ check: source.check }"
            @click="handleSearchWord(source.word)"
          >
            <span class="order-num">{{ index + 1 }}.</span>
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

export default {
  name: "WordListPanel",
  props: {
    title: {
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
  emits: ["searchWord"],
  setup(props, ctx) {
    const { wordList, word } = toRefs(props);
    const inputValue = ref("");
    const finalWordList = computed(() => {
      const wordListFiltered = [];
      for (let i = 0; i < wordList.value.length; i++) {
        if (inputValue.value && !wordList.value[i].includes(inputValue.value)) {
          continue;
        }

        wordListFiltered.push({
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

    return {
      inputValue,
      finalWordList,
      handleSearchWord,
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
  .filter-input {
    width: 100%;
    box-sizing: border-box;
    padding: 0 10px;
  }
  .list {
    width: 100%;
    height: calc(100% - 70px);
    box-sizing: border-box;
    padding-top: 10px;
    .word-list {
      overflow-y: auto;
      .word-item {
        width: 100%;
        height: 40px;
        line-height: 40px;
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