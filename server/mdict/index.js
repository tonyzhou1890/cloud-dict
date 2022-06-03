const Mdict = require('mdict-js').default
const { v1: uuidV1 } = require('uuid')
const dictConfig = require('./config')
const processor = require('./processor')
const util = require('../utils/util')
const { getSuffix } = require('../utils/util')

class Dict {
  constructor(dictList) {
    // 任务 map
    this.task = new Map()

    // console.log(dictList)
    this.dict = dictList.map(item => {
      const d = {
        ...item,
        mdx: item.mdx ? new Mdict(`${item.path}${item.mdx}`, item.disabled ? {} : {
          mode: 'mixed'
        }) : null,
        mdd: item.mdd ? new Mdict(`${item.path}${item.mdd}`) : null
      }
      // 挂载缓存
      if (d.mdx && (item.mdxCache || item.cache)) {
        d.mdx.cache = item.mdxCache || item.cache
      }
      if (d.mdd && (item.mddCache || item.cache)) {
        d.mdd.cache = item.mddCache || item.cache
      }
      // 代理词典查询操作，因为有时查不到词会报错。代理函数也可以统一操作缓存
      util.proxyFunc(d.mdx, 'lookup', (word) => (item.disabled ? { keyText: word, definition: null } : []))
      util.proxyFunc(d.mdx, 'fuzzy_search', [])
      if (d.mdd) {
        util.proxyFunc(d.mdd, 'lookup', (word) => ({ keyText: word, definition: null }))
      }
      return d
    }).filter(item => {
      // if (item.mdx._version < 2) {
      //   console.log(`${item.name}文件版本为${item.mdx._version}，不符合最低版本 2 的要求`)
      //   return false
      // }
      return true
    })
    util.consoleMem()
    // console.log(this.dict.map(item => item.mdx))
  }

  /**
   * 对词典列表操作
   * @param {*} func function 操作
   */
  actionInList(func) {
    return this.dict.map(item => {
      return func(item)
    })
  }

  /**
   * 获取词典列表
   * @returns 
   */
  getDictList() {
    return this.dict.map(item => {
      return {
        name: item.name,
        id: item.dictId,
        disabled: item.disabled,
        info: {
          header: item.mdx.header,
          keyHeader: item.mdx.keyHeader,
          recordHeader: item.mdx.recordHeader
        }
      }
    })
  }

  /**
   * 开始指定任务
   * @param {*} name 
   * @param  {...any} rest 
   * @returns uuid
   */
  startTask(name, ...rest) {
    const uuid = uuidV1()
    if (name && typeof this[name] === 'function') {
      this.task.set(uuid, true)
      setTimeout(() => {
        this[name](...rest)
      }, 0)
      return uuid
    }
    return false
  }

  /**
   * 结束任务
   * @param {*} uuid 
   * @returns 
   */
  abortTask(uuid) {
    if (uuid) {
      this.task.delete(uuid)
      return true
    }
    return false
  }

  /**
   * 查询--不准确
   * @param word string 单词
   */
  lookup(word, dictIds) {
    return this.actionInList((item) => {
      if (!Array.isArray(dictIds) || dictIds.includes(item.dictId)) {
        const data = this.lookupWithCtx(word, item, {
          replace: true,
          soundIgnore: true
        })
        // delete data.result.resource
        return data
      } else {
        return false
      }
    }).filter(v => v)
  }

  /**
   * 指定字典查词
   * @param {*} word 
   * @param {*} ctx 
   * @param {*} config
   * @returns 
   * ```
   * {
   *    dictName: '',
   *    dictId: '',
   *    result: {
   *      key: '',
   *      definition: '',
   *      resource: {}
   *    }
   * }
   * ```
   */
  lookupWithCtx(word, ctx, config = {}) {
    const data = {
      dictName: ctx.name,
      dictId: ctx.dictId
    }

    // 非 mixed 模式
    if (ctx.disabled) {
      // 最多三次查找
      // 1. 原词，2. 如果首字母小写，转首字母大写尝试，还不行就全部大写，3. 如果首字母大写，全部转小写尝试
      data.result = ctx.mdx.lookup(word)
      if (!data.result.definition) {
        // 首字母小写
        if (util.isLowerCase(word[0])) {
          // console.log(word)
          data.result = ctx.mdx.lookup(
            `${word[0].toUpperCase()}${word.substr(1)}`
          )
          if (!data.result.definition) {
            data.result = ctx.mdx.lookup(word.toUpperCase())
          }
        } else if (util.isUpperCase(word[0])) {
          // 小写
          data.result = ctx.mdx.lookup(word.toLowerCase())
        }
      }
    } else {
      const res = ctx.mdx.lookup(word)
      // mixed 模式下，mdx 返回的是数组
      if (!res.length) {
        data.result = {
          keyText: word,
          definition: null
        }
      } else {
        // 完全匹配
        if (res[0].keyText === word) {
          data.result = res[0]
        } else if (util.isLowerCase(word[0])) {
          // 首字母小写，选用第一个结果
          data.result = res[0]
        } else {
          // 首字母大写，没有就是没有，不使用近似结果
          data.result = {
            keyText: word,
            definition: null
          }
        }
      }
    }

    // 加入原词
    data.result.word = word
    // 如果有释义，则对词条进行处理
    if (data.result.definition) {
      data.result = this._processData(data.result, ctx, config)
    }
    return data
  }

  /**
   * 批量查询--只能查询某一个字典
   * @param {array} words
   * @param {string} dictId
   * @param {function} callback 每查完一个单词就调用一次，参数为单词索引、单词、结果、当前所有结果
   * @param {string} taskUuid 是否有任务 uuid，如果有，需要据此判断是否结束循环
   * @returns array
   */
  lookupBatch(words, dictId, callback, taskUuid) {
    // console.log(words)
    if (!dictId) {
      return false
    }
    const ctx = this.dict.find(v => v.dictId === dictId)
    if (!ctx) {
      return false
    }

    const config = {
      replace: false,
      soundRemove: true
    }
    const res = {
      resource: {},
      list: []
    }
    let temp = null
    for (let i = 0; i < words.length; i++) {
      if (taskUuid && !this.task.get(taskUuid)) break

      temp = this.lookupWithCtx(words[i], ctx, config)

      Object.assign(res.resource, temp.result.resource)
      delete temp.result.resource
      res.list.push(temp.result)

      if (typeof callback === 'function') {
        callback(i, words[i], temp, res)
      }
    }

    // 如果在任务中，需要标记任务结束
    if (taskUuid) {
      this.task.set(taskUuid, false)
    }
    return res
  }

  /**
   * 模糊搜索
   * @param word string 单词
   * @param fuzzySize number 最多纪录数
   * @param edGap number 编辑距离
   */
  fuzzySearch(word, fuzzySize = 20, edGap = 5, dictIds) {
    return this.actionInList((item) => {
      if (!Array.isArray(dictIds) || dictIds.includes(item.dictId)) {
        return {
          dictName: item.name,
          dictId: item.dictId,
          result: item.mdx.fuzzy_search(word, fuzzySize, edGap)
        }
      } else {
        return false
      }
    }).filter(v => v)
  }

  /**
   * 定位搜索单词
   */
  parseDefination(word, offset, dict) {
    const targetDict = this.dict.find(item => item.name === dict)
    if (!targetDict) return null

    const data = {
      dict,
    }

    data.result = targetDict.mdx.parse_defination(word, offset)
    // 如果有释义，则对词条进行处理
    if (data.result.definition) {
      data.result = this._processData(data.result, targetDict)
    }

    return data
  }

  /**
   * 词典单词表
   * @param {*} dictId 
   */
  keys(dictId) {
    if (!dictId) {
      return []
    }
    const targetDict = this.dict.find(v => v.dictId === dictId)
    // 没有字典或者非 mixed 都返回空数组
    if (!targetDict || targetDict.disabled) {
      return []
    }
    return targetDict.mdx.keys()
  }

  /**
   * 获取音频
   * @param {*} dictId 
   * @param {*} file 
   * @returns 
   */
  getSound(dictId, file) {
    const targetDict = this.dict.find(v => v.dictId === dictId)
    if (!targetDict || targetDict.disabled || !targetDict.mdd) {
      return ''
    } else {
      const suffix = getSuffix(file)
      // 查询
      const result = targetDict.mdd.lookup(`\\${file.replace('sound://', '')}`)

      if (result.definition) {
        return `data:audio/${suffix};base64,${result.definition}`
      } else {
        return ''
      }
    }
  }

  /**
   * 判断单词是否存在
   * @param {string} [dictId] 
   * @param {string} words 
   * @returns 
   * ```
   * {
   *   isExist: [],
   *   notExist: []
   * }
   * ```
   */
  isExist(dictId, words) {
    let dicts = []
    if (dictId) {
      dicts = [this.dict.find(v => v.dictId === dictId)].filter(v => v && !v.disabled)
    } else {
      dicts = this.dict.filter(v => !v.disabled)
    }
    words = words.split(',').filter(v => v)
    const isExist = []
    const notExist = []
    for (let i = 0, len = words.length; i < len; i++) {
      let bool = false
      for (let j = 0, dLen = dicts.length; j < dLen; j++) {
        if (dicts[j].mdx.isExist(words[i])) {
          bool = true
          break
        }
      }
      if (bool) {
        isExist.push(words[i])
      } else {
        notExist.push(words[i])
      }
    }
    return {
      isExist,
      notExist
    }
  }

  /**
   * 处理结果的图片、样式等
   */
  _processData(entry, ctx, config = {}) {
    // 设置
    let defaultConfig = {
      replace: true, // 资源替换为 base64
      imageReplace: false, // 默认不替换图片资源。因为词条解释很多时，前面的图片会多次重复
    }
    config = Object.assign({}, defaultConfig, config)
    // 资源 map
    entry.resource = {}
    // entry.rawDefinition = entry.definition
    Object.keys(processor.common).map(key => {
      let handler = processor.common[key]
      if (ctx.processor && typeof ctx.processor[key] === 'function') {
        handler = ctx.processor[key]
      }
      entry = handler(entry, ctx, config)
    })
    return entry
  }
}

module.exports = {
  dictConfig,
  Dict
}