var express = require('express');
var router = express.Router();
const fs = require('fs')
const { Dict, dictConfig } = require('../mdict')
const { searchWordSchema, fuzzySearchSchema, wordListSchema, queryBatchSchema, dictKeysSchema, getSoundSchema } = require('../schema')
const { responseCode, batchConfig, wordbook } = require('../utils/config')
const { consoleMem } = require('../utils/util')

// 加载字典
const dictStore = new Dict(dictConfig)
// console.log(dictStore)

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Cloud dict' });
});

/** 单词查询 */
router.get('/search', function (req, res, next) {
  let response = {}
  const vali = searchWordSchema.validate(req.query, { allowUnknown: true })
  if (vali.error) {
    response = {
      code: responseCode.error,
      message: vali.error.details[0].message
    }
  } else {
    // 处理词典 id 列表
    let dictIds = req.query.dictIds
    if (typeof dictIds === 'string' && dictIds) {
      dictIds = dictIds.split(',')
    } else {
      dictIds = null
    }

    console.log('dictIds', dictIds)

    let data = dictStore.lookup(req.query.word, dictIds)
    data = data.filter(item => item.result.definition)
    response = {
      code: responseCode.success,
      data
    }
  }
  return res.send(response)
})

/** 模糊查询 */
router.get('/fuzzySearch', function (req, res, next) {
  let response = {}
  // console.log(req.params)
  const vali = fuzzySearchSchema.validate(req.query, { allowUnknown: true })
  if (vali.error) {
    response = {
      code: responseCode.error,
      message: vali.error.details[0].message
    }
  } else {
    // 处理词典 id 列表
    let dictIds = req.query.dictIds
    if (typeof dictIds === 'string' && dictIds) {
      dictIds = dictIds.split(',')
    } else {
      dictIds = null
    }

    let data = dictStore.fuzzySearch(req.query.word, undefined, undefined, dictIds)
    data = data.filter(item => item.result.length)
    response = {
      code: responseCode.success,
      data
    }
  }
  return res.send(response)
})

/** 字典列表 */
router.get('/dict/list', function (req, res, next) {
  let response = {}
  let data = []
  if (req.query.all) {
    data = dictStore.getDictList()
  } else {
    data = dictStore.getDictList().filter(item => !item.disabled)
  }
  response = {
    code: responseCode.success,
    data
  }
  return res.send(response)
})

/** 获取音频 */
router.get('/dict/sound', function (req, res, next) {
  let response = {}
  const vali = getSoundSchema.validate(req.query, { allowUnknown: true })
  if (vali.error) {
    response = {
      code: responseCode.error,
      message: vali.error.details[0].message
    }
  } else {
    const data = dictStore.getSound(req.query.dictId, req.query.file)

    response = {
      code: responseCode.success,
      data
    }
  }
  return res.send(response)
})

/**
 * 词书列表
 */
router.get('/wordbook/list', function (req, res, next) {
  const response = {
    code: responseCode.success,
    data: wordbook.map(v => v.name)
  }
  return res.send(response)
})

/**
 * 单词列表
 */
router.get('/word/list', function (req, res, next) {
  let response = {}
  const vali = wordListSchema.validate(req.query, { allowUnknown: true })
  if (vali.error) {
    response = {
      code: responseCode.error,
      message: vali.error.details[0].message
    }
  } else {
    // 条目范围
    const page = Number(req.query.page) || 1
    const size = Number(req.query.size) || 1
    const start = (page - 1) * size
    const end = start + size
    // 指定词书
    const bookName = req.query.book
    let book = wordbook.find(v => v.name === bookName)
    // 没找到就默认coca60000
    if (!book) {
      book = wordbook.find(v => v.name === 'coca60000')
    }
    let wordList = ''
    try {
      wordList = fs.readFileSync(book.path, 'utf-8')
      if (typeof book.func === 'function') {
        wordList = book.func(wordList, req)
        console.log(wordList)
      } else {
        wordList = (wordList || '').split(/[\r\n]/g).filter(v => v)
      }
    } catch (e) {
      console.log(e)
      wordList = []
    }
    const list = []
    for (let i = start; i < wordList.length && i < end; i++) {
      list.push(wordList[i])
    }
    response = {
      code: responseCode.success,
      data: {
        page,
        size,
        list,
        total: wordList.length
      }
    }
  }
  return res.send(response)
})

/** 批量查询 */
router.post('/query-batch', function (req, res, next) {
  let response = {}
  // console.log(req.body)
  const vali = queryBatchSchema.validate(req.body, { allowUnknown: true })
  if (vali.error) {
    response = {
      code: responseCode.error,
      message: vali.error.details[0].message
    }
  } else {
    const words = req.body.words.split(',')
    // post 批量查询最大查询数
    if (words.length > batchConfig.max) {
      words.length = batchConfig.max
    }
    // 词典可用性检查
    let dictList = dictStore.getDictList().filter(item => !item.disabled)
    // console.log(dictList)
    if (dictList.find(v => v.id === req.body.dictId)) {
      let data = dictStore.lookupBatch(words, req.body.dictId)

      response = {
        code: responseCode.success,
        data
      }
    } else {
      response = {
        code: responseCode.error,
        message: '词典不可用'
      }
    }

    consoleMem()
  }
  return res.send(response)
})

/** 字典词表 */
router.get('/dict/keys', function (req, res, next) {
  let response = {}
  // console.log(req.query)
  const vali = dictKeysSchema.validate(req.query, { allowUnknown: true })
  if (vali.error) {
    response = {
      code: responseCode.error,
      message: vali.error.details[0].message
    }
  } else {
    // 词典可用性检查
    let dictList = dictStore.getDictList().filter(item => !item.disabled)
    // console.log(dictList)
    if (dictList.find(v => v.id === req.query.dictId)) {
      let data = dictStore.keys(req.query.dictId)

      response = {
        code: responseCode.success,
        data
      }
    } else {
      response = {
        code: responseCode.error,
        message: '词典不可用'
      }
    }

    consoleMem()
  }
  return res.send(response)
})

/**
 * websocket 批量查询
 */
router.ws('/query-batch', function (ws, req) {
  let running = false
  let progress = 0
  let lastTime = Date.now() // 上一个单词结果时间
  let uuid = '' // 任务 uuid
  ws.on('message', function (msg) {
    // 是否为 json
    try {
      msg = JSON.parse(msg)
    } catch (e) {
      ws.send(JSON.stringify({
        code: responseCode.error,
        message: 'message must be JSON'
      }))
      return
    }

    // 查询
    if (msg.type === 'query') {
      // 校验
      const vali = queryBatchSchema.validate(msg.data, { allowUnknown: true })
      if (vali.error) {
        ws.send(JSON.stringify({
          code: responseCode.error,
          message: vali.details[0].message
        }))
      } else {
        const words = msg.data.words.split(',')
        if (words.length > batchConfig.max) {
          words.length = batchConfig.max
        }
        startTask(words, msg.data.dictId)
      }
    } else if (msg.type === 'abort') {
      // 取消任务
      abortTask()
      ws.send(JSON.stringify({
        code: responseCode.success,
        type: 'notify',
        subType: 'abort'
      }))
    }
  })

  ws.on('close', function (code, reason) {
    abortTask()
  })

  // 开始任务
  function startTask(words, dictId) {
    uuid = dictStore.startTask('lookupBatch', words, dictId, (index, word, result, res) => {
      progress = (index + 1) / words.length
      // 完成
      if (progress === 1) {
        ws.send(JSON.stringify({
          code: responseCode.success,
          type: 'done',
          data: res
        }))
        abortTask()
      } else if (Date.now() - lastTime > 300) {
        // 每 300 ms 发送进度通知
        lastTime = Date.now()
        ws.send(JSON.stringify({
          code: responseCode.success,
          type: 'notify',
          subType: 'progress',
          data: progress
        }))
      }
    })
    running = true
    progress = 0
  }

  // 结束任务
  function abortTask() {
    dictStore.abortTask(uuid)
    running = false
    progress = 0
    uuid = ''
  }
})

module.exports = router;
