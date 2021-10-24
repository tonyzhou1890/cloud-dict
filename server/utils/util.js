module.exports = {
  /**
  * 获取文件名后缀
  */
  getAppendix(str) {
    let arr = str.split('.')
    if (arr.length === 0) return ''
    return arr[arr.length - 1]
  },

  /**
   * 字符是否是大写
   */
  isUpperCase(str) {
    return /[A-Z]/.test(str[0])
  },

  /**
   * 字符是否是小写
   */
  isLowerCase(str) {
    return /[a-z]/.test(str[0])
  }
}