<template>
  <div class="export-page page" ref="wrapperEl">
    <div class="wrapper">
      <h1 class="tac title">Export</h1>
      <p class="small-font">(Experimental)</p>
      <p class="explain">
        You can upload a text file contain words--one word one line, this app
        will search all words and download.
      </p>
      <p class="explain">
        Tip: the number of words must be less then {{ max }}.
      </p>
      <!-- 文件 -->
      <div v-show="!preview" class="file-wrapper">
        <!-- file -->
        <el-upload
          class="upload"
          drag
          action="/"
          accept="text/plain"
          ref="uploadEl"
          :on-change="handleChange"
          :auto-upload="false"
        >
          <el-icon class="el-icon--upload">
            <upload-filled />
          </el-icon>
          <div class="el-upload__text">
            Drop file here or <em>click to upload</em>
          </div>
        </el-upload>
        <p>Or choose a chapter</p>

        <!-- chapter list -->
        <el-select
          v-model="checkedChapter"
          placeholder="please select a chapter"
          class="select"
          popper-class="popper-class"
          filterable
          @change="handleSelectChapter"
        >
          <el-option
            v-for="item in chapterList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          ></el-option>
        </el-select>
      </div>
      <div v-if="preview" class="preview">
        <p class="preview-title">preview:</p>
        <pre class="preview-content">{{ preview }}</pre>
      </div>
      <!-- 操作 -->
      <div v-if="preview" class="actions-wrapper">
        <el-select
          v-model="checkedDict"
          placeholder="please select a dict"
          class="select"
          @change="changeDict"
        >
          <el-option
            v-for="item in dictListData"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
          </el-option>
        </el-select>
        <el-input
          class="custom-name"
          v-model="customName"
          placeholder="file name"
        ></el-input>
        <div class="btns-wrapper">
          <el-button v-if="!loading" type="primary" @click="handleStartPost"
            >Start</el-button
          >
          <el-button v-if="!loading" @click="handleCancel">Cancel</el-button>
          <el-button v-if="loading">Waiting……</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import { UploadFilled } from "@element-plus/icons";
import {
  dictList,
  queryBatchWS,
  queryBatch,
  getWordList,
} from "../services/api";
import { getFile, format } from "../utils/index";
import makeEpub from "../utils/makeEpub";
import { exportConfig } from "../utils/config";

export default {
  setup() {
    const loading = ref(false);
    let ws = null;
    const dictListData = ref([]);
    const checkedDict = ref("");
    const customName = ref("");
    const file = ref(null);
    const uploadEl = ref(null);
    let wordList = [];
    const preview = ref("");
    const progress = ref(0);
    const max = ref(exportConfig.max);
    // 章节列表，每个章节 200 单词
    const chapterList = ref(
      new Array(200).fill(1).map((item, index) => {
        return {
          id: item + index,
          name: `Chapter ${item + index}`,
        };
      })
    );
    const checkedChapter = ref("");

    // 获取词典列表
    dictList()
      .then((res) => {
        if (res.data.code === 0) {
          dictListData.value = res.data.data;
          if (dictListData.value.length) {
            checkedDict.value = dictListData.value[0].id;
            customName.value = dictListData.value[0].name;
          } else {
            checkedDict.value = "";
            customName.value = "";
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
      });

    // 更换字典
    function changeDict(id) {
      console.log("change dict: ", id);
      checkedDict.value = id;
      customName.value = dictListData.value.find((item) => item.id === id).name;
    }

    // 上传文件
    function handleChange(e) {
      if (e.raw.type !== "text/plain") {
        ElMessage({
          message: "wrong file type",
          type: "error",
        });
        uploadEl.value.clearFiles();
        return;
      }
      getFile(e.raw)
        .then((res) => {
          // 将文本处理成单词数组
          wordList = res.split(/[\r\n]/).filter((v) => v && v.length < 50);
          if (wordList.length > exportConfig.max) {
            wordList.length = exportConfig.max;
          }
          if (wordList.length === 0) {
            ElMessage({
              message: "No Content",
              type: "info",
            });
            return;
          }
          file.value = res;
          // 处理预览
          preview.value = wordList.join("\r\n");
        })
        .catch((e) => {
          console.log(e);
        });
    }

    // 开始处理
    function handleStart() {
      if (!checkedDict.value) {
        ElMessage({
          message: "please choose a dict",
          type: "info",
        });
        return;
      }
      loading.value = true;
      try {
        ws = new WebSocket(queryBatchWS);
        ws.onopen = wsOpen;
        ws.onmessage = wsMessage;
        ws.onerror = () => {
          ElMessage({
            message: "There is something wrong",
            type: "error",
          });
          wsClose();
        };
        ws.onclose = () => {
          loading.value = false;
          ws = null;
        };
      } catch (e) {
        ElMessage({
          message: "Websocket error",
          type: "error",
        });
        loading.value = false;
      }
    }

    // 取消
    function handleCancel() {
      loading.value = false;
      file.value = null;
      wordList = [];
      preview.value = "";
      progress.value = 0;
      checkedChapter.value = "";
    }

    // ws open
    function wsOpen() {
      ws.send(
        JSON.stringify({
          type: "query",
          data: {
            words: wordList.join(","),
            dictId: checkedDict.value,
          },
        })
      );
    }

    // ws message
    function wsMessage(ev) {
      const data = JSON.parse(ev.data);
      if (data.code !== 0) {
        ElMessage({
          message: data.message ?? "network error",
          type: "error",
        });
        return;
      }

      if (data.type === "notify" && data.subType === "progress") {
        progress.value = data.data;
      }

      if (data.type === "notify" && data.subType === "abort") {
        progress.value = 0;
        loading.value = false;
        wsClose();
      }

      if (data.type === "done") {
        console.log(data.data);
        progress.value = 1;
        loading.value = false;
      }
    }

    // ws close
    function wsClose() {
      if (ws) {
        ws.close();
        ws = null;
      }
    }

    onBeforeUnmount(() => {
      // wsClose();
    });

    // websocket 无法 gzip 压缩，所以还是使用 post 请求
    function handleStartPost() {
      if (!checkedDict.value) {
        ElMessage({
          message: "please choose a dict",
          type: "info",
        });
        return;
      }
      loading.value = true;
      queryBatch({
        words: wordList.join(","),
        dictId: checkedDict.value,
      })
        .then((res) => {
          if (res.data.code === 0) {
            console.log(res.data.data);
            let data = res.data.data;
            const notFoundWords = data.list
              .filter((item) => !item.definition)
              .map((item) => item.word)
              .join();
            data.list = data.list.filter((item) => item.definition);

            format(data);

            makeEpub(data, {
              title:
                customName.value ||
                dictListData.value.find((item) => item.id === checkedDict.value)
                  ?.name,
            })
              .then(() => {
                if (notFoundWords) {
                  ElMessage({
                    message: `Those words have not found: ${notFoundWords}`,
                    type: "info",
                  });
                }
                setTimeout(() => {
                  // 下载有点慢，延迟修改状态
                  loading.value = false;
                }, 2000);
              })
              .catch((e) => {
                throw new Error(e);
              });
          } else {
            throw new Error(res.data.message ?? "query failed");
          }
        })
        .catch((e) => {
          console.log(e);
          ElMessage({
            message: e.message ?? "error",
            type: "error",
          });
        })
        .finally(() => {
          loading.value = false;
        });
    }

    // 选择章节
    function handleSelectChapter(id) {
      getWordList(id)
        .then((res) => {
          console.log(res);
          if (res.data.code === 0) {
            wordList = res.data.data.map((item) => item.word);
            // 处理预览
            preview.value = wordList.join("\r\n");
          } else {
            throw new Error(res.data);
          }
        })
        .catch((e) => {
          ElMessage({
            message: e.message ?? e.errorMsg ?? "error",
            type: "error",
          });
        });
    }

    return {
      loading,
      dictListData,
      checkedDict,
      customName,
      file,
      preview,
      max,
      chapterList,
      checkedChapter,
      handleChange,
      changeDict,
      handleStart,
      handleCancel,
      handleStartPost,
      handleSelectChapter,
    };
  },
  components: {
    UploadFilled,
  },
};
</script>

<style lang="less" scoped>
.page {
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
  .small-font {
    font-size: 0.6em;
  }
  .explain {
    text-align: center;
  }
  .file-wrapper {
    text-align: center;
    .select {
      width: 300px;
    }
  }
  .preview {
    width: 100%;
    text-align: center;
    .preview-content {
      max-height: 400px;
      overflow: auto;
    }
  }
  .upload {
    padding-top: 20px;
  }
  .actions-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    .select,
    .custom-name {
      margin-bottom: 10px;
      width: 300px;
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

<style lang="less">
.wrapper {
  .upload {
    .el-upload-dragger {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .el-icon--upload {
      font-size: 40px;
    }
  }
}
.popper-class {
  width: 300px !important;
  min-width: 300px !important;
}
.el-message {
  max-width: 90%;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>