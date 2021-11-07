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
      <div class="file-wrapper">
        <el-upload
          v-if="!file"
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
        <div v-else class="preview">
          <p class="preview-title">preview:</p>
          <pre class="preview-content">{{ preview }}</pre>
        </div>
      </div>
      <!-- 操作 -->
      <div v-if="file" class="actions-wrapper">
        <el-select
          v-model="checkedDict"
          placeholder="please select a dict"
          class="select"
        >
          <el-option
            v-for="item in dictListData"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
          </el-option>
        </el-select>
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
import { dictList, queryBatchWS, queryBatch } from "../services/api";
import { getFile, format } from "../utils/index";
import makeEpub from "../utils/makeEpub";
import { exportConfig } from "../utils/config";

export default {
  setup() {
    const loading = ref(false);
    let ws = null;
    const dictListData = ref([]);
    const checkedDict = ref("");
    const file = ref(null);
    const uploadEl = ref(null);
    let wordList = [];
    const preview = ref("");
    const progress = ref(0);
    const max = ref(exportConfig.max);

    // 获取词典列表
    dictList()
      .then((res) => {
        if (res.data.code === 0) {
          dictListData.value = res.data.data;
          checkedDict.value = dictListData.value.length
            ? dictListData.value[0].id
            : "";
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
          if (wordList.length > exportConfig.max)
            wordList.length = exportConfig.max;
          file.value = res;
          // 处理预览
          let arr = [];
          for (let i = 0; i < wordList.length && i < 20; i++) {
            arr.push(wordList[i]);
          }
          preview.value = arr.join("\r\n");
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

            makeEpub(
              data,
              {
                title: dictListData.value.find(
                  (item) => item.id === checkedDict.value
                )?.name,
              },
              () => {
                if (notFoundWords) {
                  ElMessage({
                    message: `Those words have not found: ${notFoundWords}`,
                    type: "info",
                  });
                }
                loading.value = false;
              }
            );
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

    return {
      loading,
      dictListData,
      checkedDict,
      file,
      preview,
      max,
      handleChange,
      handleStart,
      handleCancel,
      handleStartPost,
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
  .upload {
    padding-top: 20px;
  }
  .actions-wrapper {
    text-align: center;
    .select {
      margin-right: 10px;
      margin-bottom: 10px;
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
</style>