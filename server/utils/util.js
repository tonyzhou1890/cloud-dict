const fs = require('fs')
const path = require('path')
const crypto = require('crypto');

// 深拷贝
function cloneDeep(data) {
  return JSON.parse(JSON.stringify(data))
}

/**
 * md5 加密
 * @param {string} str 
 * @returns 
 */
function cryptMd5Str(str) {
  var md5 = crypto.createHash('md5');
  return md5.update(str).digest('hex');
}

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
        if (obj.cache && rest.length === 1 && obj.cache.has(rest[0])) {
          res = obj.cache.get(rest[0])
          return cloneDeep(res)
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
          if (obj.cache && rest.length === 1) {
            obj.cache.set(rest[0], cloneDeep(res))
          }
          return res
        }
      }
    }
  },

  /**
   * 打印内存占用
   */
  consoleMem() {
    const used = process.memoryUsage();
    for (let key in used) {
      console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }
  },

  /**
   * 获取指定文件夹下的词典
   * 目前只支持两层。（文件夹/词典文件夹/词典文件）
   * @param {string} pathname
   * @returns Array
   * @example
   * ```
   * [
   *   {
   *     dir: '',
   *     name: '',
   *     mdx: '',
   *     mdd: '',
   *     js: '',
   *     css: '',
   *     sort: number,
   *     mdxOptions: {
   *       keyCaseSensitive: bool,
   *       stripKey: bool
   *     },
   *     mddOptions: {
   *       keyCaseSensitive: bool,
   *       stripKey: bool
   *     }
   *   }
   * ]
   * ```
   */
  getDictFile(pathname) {
    const dicts = []
    // 读取目录下的词典目录
    const dirs = fs.readdirSync(pathname)
    console.log(dirs)
    dirs.map(d => {
      const dpath = path.join(pathname, d)
      const stat = fs.statSync(dpath)
      // 如果是目录，则继续
      if (stat.isDirectory()) {
        // 词典配置
        const dictConfig = {
          path: dpath,
          dir: d,
          name: '',
          dictId: '',
          mdx: [],
          mdxConfig: {},
          mdd: [],
          mddConfig: {},
          js: [],
          css: [],
          sort: Infinity
        }
        // 读取词典文件名
        const dictFiles = fs.readdirSync(dpath)
        // 文件归类
        dictFiles.map(f => {
          if (f.endsWith('.mdx')) {
            dictConfig.mdx.push(f)
            // mdx 文件默认 stripkey 为 false，因为很多字典的 stripekey 不准确
            dictConfig.mdxConfig.stripKey = false
          } else if (f.endsWith('.mdd')) {
            dictConfig.mdd.push(f)
            } else if (f.endsWith('.js')) {
              dictConfig.js.push(f)
          } else if (f.endsWith('.css')) {
            dictConfig.css.push(f)
          }
        })
        // mdd 和 mdx 多文件检测
        if (dictConfig.mdx.length > 1 || dictConfig.mdd.length > 1) {
          console.warn('暂不支持多词典文件')
          return
        }
        if (dictConfig.mdx.length === 0) return

        dictConfig.mdx = path.join(dpath, dictConfig.mdx[0])
        if (dictConfig.mdd[0]) {
          dictConfig.mdd = path.join(dpath, dictConfig.mdd[0])
        } else {
          dictConfig.mdd = null
        }

        // 词典目录名称、排序解析
        const reg = /\[[^\[\]]*\]/g
        dictConfig.name = dictConfig.dir.replace(reg, '').trim()
        dictConfig.dictId = cryptMd5Str(dictConfig.name)
        const conf = dictConfig.dir.match(reg)
        if (Array.isArray(conf) && Array.length) {
          conf.map(item => {
            item = item.replace(/[\[\]]/g, '').trim().toLowerCase()
            // 排序
            if (/^\d*$/.test(item)) {
              dictConfig.sort = Number(item)
            }
            // 忽略
            if (['disabled', 'disable', 'ignore'].includes(item)) {
              dictConfig.disabled = true
            }
          })
        }
        if (dictConfig.disabled) return
          // 词典配置解析
          ;['mdx', 'mdd'].map(key => {
            const keyPath = dictConfig[key]
            if (keyPath) {
              const basename = path.basename(keyPath, `.${key}`)
              const conf = basename.match(reg)
              if (Array.isArray(conf) && Array.length) {
                conf.map(item => {
                  item = item.replace(/[\[\]]/g, '').trim().toLowerCase()
                  // 配置项可能是 a=b 这种形式
                  const itemPair = item.split('=').filter(v => v)
                  // 大小写是否敏感
                  if (itemPair[0] === 'keycasesensitive') {
                    dictConfig[`${key}Config`].keyCaseSensitive = itemPair[1] === 'false' ? false : true
                  } else if (itemPair[0] === 'stripkey') {
                    dictConfig[`${key}Config`].stripKey = itemPair[1] === 'false' ? false : true
                  }
                })
              }
            }
          })
        // css 和 js 文件读取
        dictConfig.css.map((key, index) => {
          const file = fs.readFileSync(path.join(dpath, key)).toString('utf-8').replace(/[\r\n]/g, '')
          dictConfig.css[index] = {
            key,
            definition: Buffer.from(file).toString('base64'),
            text: file
          }
        })
        dictConfig.js.map((key, index) => {
          const file = fs.readFileSync(path.join(dpath, key)).toString('utf-8')
          dictConfig.js[index] = {
            key,
            definition: Buffer.from(file).toString('base64'),
            text: file
          }
        })
        dicts.push(dictConfig)
      }
    })
    dicts.sort((a, b) => {
      return a.sort - b.sort
    })
    return dicts
  }
}