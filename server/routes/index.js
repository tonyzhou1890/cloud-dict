var express = require('express');
var router = express.Router();
const { Dict, dictConfig } = require('../mdict')
const { searchWordSchema, fuzzySearchSchema, queryPatchSchema } = require('../schema')
const { responseCode } = require('../utils/config')

// 加载字典
const dictStore = new Dict(dictConfig)
// console.log(dictStore)

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Cloud dict' });
});

/** 单词查询 */
router.get('/search/:word', function (req, res, next) {
  let response = {}
  const vali = searchWordSchema.validate(req.params, { allowUnknown: true })
  if (vali.error) {
    response = {
      code: responseCode.error,
      message: vali.error.details[0].message
    }
  } else {
    let data = dictStore.lookup(req.params.word)
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
  console.log(req.params)
  const vali = fuzzySearchSchema.validate(req.query, { allowUnknown: true })
  if (vali.error) {
    response = {
      code: responseCode.error,
      message: vali.error.details[0].message
    }
  } else {
    let data = dictStore.fuzzySearch(req.query.word)
    data = data.filter(item => item.result.length)
    response = {
      code: responseCode.success,
      data
    }
  }
  return res.send(response)
})

/** 批量查询 */
router.post('/query-patch', function (req, res, next) {
  let response = {}
  console.log(req.body)
  const vali = queryPatchSchema.validate(req.body, { allowUnknown: true })
  if (vali.error) {
    response = {
      code: responseCode.error,
      message: vali.error.details[0].message
    }
  } else {
    const words = req.body.words.split(',')
    let data = dictStore.lookupBatch(words, req.body.dictId)

    response = {
      code: responseCode.success,
      data
    }
  }
  return res.send(response)
})

module.exports = router;
