module.exports = {
  /**
  * 获取文件名后缀
  */
  getSuffix(str) {
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
  },

  /**
   * 劫持操作，防止报错
   */
  proxyFunc(obj, key, fakeRes) {
    if (typeof obj[key] === 'function') {
      const old = obj[key].bind(obj)
      obj[key] = function (...rest) {
        try {
          const res = old(...rest)
          return res
        } catch (e) {
          console.log('error')
          if (typeof fakeRes === 'function') {
            return fakeRes(...rest)
          }
          return fakeRes || false
        }
      }
    }
  }
}