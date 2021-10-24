import axios from 'axios'
console.log(process.env.VUE_APP_BASIC_API)
const service = axios.create({
  baseURL: process.env.VUE_APP_BASIC_API
})

export default service