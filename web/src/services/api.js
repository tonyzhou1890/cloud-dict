import axios from "./axios";

export function searchWord(word) {
  return axios.get(`/search/${word}`)
}

// 模糊搜索
export function fuzzySearch(word) {
  return axios.get(`/fuzzySearch/?word=${word}`)
}

// 词典列表
export function dictList() {
  return axios.get(`/dict/list`)
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