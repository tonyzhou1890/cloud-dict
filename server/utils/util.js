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
   * 劫持操作
   *   1. 防止报错
   *   2. 添加缓存
   */
  proxyFunc(obj, key, fakeRes = false) {
    if (typeof obj[key] === 'function') {
      const old = obj[key].bind(obj)
      obj[key] = function (...rest) {
        let res = null
        // 尝试缓存
        if (obj.cache && obj.cache.has(rest[0])) {
          res = obj.cache.get(rest[0])
          if (typeof res === 'object' && res !== null) {
            return { ...res }
          } else {
            return res
          }
        } else {
          try {
            res = old(...rest)
          } catch (e) {
            console.log('error')
            if (typeof fakeRes === 'function') {
              res = fakeRes(...rest)
            } else {
              res = fakeRes
            }
          }
          // 设置缓存
          if (obj.cache) {
            if (typeof res === 'object' && res !== null) {
              obj.cache.set(rest[0], { ...res })
            } else {
              obj.cache.set(rest[0], res)
            }
          }
          return res
        }
      }
    }
  }
}