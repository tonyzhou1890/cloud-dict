const Mdict = require('js-mdict').default
const dictConfig = require('./config')
const processor = require('./processor')
const util = require('../utils/util')

class Dict {
  constructor(dictList) {
    // console.log(dictList)
    this.dict = dictList.map(item => {
      return {
        ...item,
        mdx: item.mdx ? new Mdict(`${item.path}${item.mdx}`, {
          keyCaseSensitive: false
        }) : null,
        mdd: item.mdd ? new Mdict(`${item.path}${item.mdd}`) : null
      }
    }).filter(item => {
      // if (item.mdx._version < 2) {
      //   console.log(`${item.name}文件版本为${item.mdx._version}，不符合最低版本 2 的要求`)
      //   return false
      // }
      return true
    })
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
   * 查询--不准确
   * @param word string 单词
   */
  lookup(word) {
    return this.actionInList((item) => {
      const data = this.lookupWithCtx(word, item, { replace: true })
      // delete data.result.resource
      return data
    })
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
    // 查找缓存
    if (ctx.cache && ctx.cache.has(word)) {
      data.result = ctx.cache.get(word)
    }
    // 最多三次查找
    // 1. 原词，2. 如果首字母小写，转首字母大写尝试，还不行就全部大写，3. 如果首字母大写，全部转小写尝试
    else {
      data.result = ctx.mdx.lookup(word)
      if (!data.result.definition) {
        // 首字母小写
        if (util.isLowerCase(word[0])) {
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
      // 存到缓存
      if (ctx.cache) {
        ctx.cache.set(word, {
          keyText: data.result.keyText,
          definition: data.result.definition
        })
      }
    }
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
   * @param {function} callback 每查完一个单词就调用一次，参数为单词索引、单词、结果
   * @returns array
   */
  lookupBatch(words, dictId, callback) {
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
      source: {},
      list: []
    }
    let temp = null
    for (let i = 0; i < words.length; i++) {
      temp = this.lookupWithCtx(words[i], ctx, config)

      if (typeof callback === 'function') {
        callback(i, words[i], temp)
      }

      Object.assign(res.source, temp.result.resource)
      delete temp.result.resource
      res.list.push(temp.result)
    }

    return res
  }

  /**
   * 查询--也不准确，因为 fuzzy_search 和 lookup 内部调用的搜索方法是一样的
   * @param word string 单词
   */
  // lookupExact(word) {
  //   let result = this.fuzzySearch(word, 10, 0)
  //   result = result.filter(item => item.result.length)
  //   console.log(JSON.stringify(result))
  //   result = result.map(item => {
  //     let temp = item.result[0]
  //     return this.parseDefination(temp.key, temp.rofset, item.dict)
  //   })
  //   console.log(result)
  //   return result
  // }

  /**
   * 模糊搜索
   * @param word string 单词
   * @param fuzzySize number 最多纪录数
   * @param edGap number 编辑距离
   */
  fuzzySearch(word, fuzzySize = 20, edGap = 5) {
    return this.actionInList((item) => {
      return {
        dictName: item.name,
        dictId: item.dictId,
        result: item.mdx.fuzzy_search(word, fuzzySize, edGap)
      }
    })
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
   * 处理结果的图片、样式等
   */
  _processData(entry, ctx, config = {}) {
    // 设置
    let defaultConfig = {
      replace: true, // 资源替换为 base64
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