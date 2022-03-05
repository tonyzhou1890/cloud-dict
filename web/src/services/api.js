import axios from "./axios";

export function searchWord(params) {
  return axios.get(`/search`, {
    params
  })
}

// 模糊搜索
export function fuzzySearch(params) {
  return axios.get(`/fuzzySearch`, {
    params
  })
}

// 词典列表
export function dictList(params) {
  return axios.get(`/dict/list`, {
    params
  })
}

// 批量查询
export function queryBatch(data) {
  return axios.post('/query-batch', data)
}

// 导出
export const queryBatchWS = (() => {
  const env = process.env.NODE_ENV
  if (env === 'development') return 'ws://localhost:8500/query-batch'
  if (env === 'production') return `${location.protocol === 'https:' ? 'wss:' : 'ws:'}${location.hostname}/api/query-batch`
})()

// 单词列表
export function getWordList(params) {
  return axios.get('/word/list', {
    params
  })
}

// 词书列表
export function getWordbook() {
  return axios.get('/wordbook/list')
}

// 获取音频
export function getSound(params) {
  return axios.get('/dict/sound', {
    params
  })
}