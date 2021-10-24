import axios from "./axios";

export function searchWord(word) {
  return axios.get(`/search/${word}`)
}

// 模糊搜索
export function fuzzySearch(word) {
  return axios.get(`/fuzzySearch/?word=${word}`)
}