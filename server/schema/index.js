const Joi = require('joi')

/**
 * 搜索单词
 */
const searchWordSchema = Joi.object({
  word: Joi.string().required()
})

/**
 * 模糊查找
 */
const fuzzySearchSchema = Joi.object({
  word: Joi.string().required(),
  fuzzySize: Joi.number().min(0).max(20),
  edGap: Joi.number().min(0).max(5)
})

/**
 * 单词列表
 */
const wordListSchema = Joi.object({
  page: Joi.number().min(1),
  size: Joi.number().min(1)
})

/**
 * 批量查询
 */
const queryBatchSchema = Joi.object({
  words: Joi.string().required(),
  dictId: Joi.string().required()
})

/**
 * 定位查找单词
 */
const parseDefinationSchema = Joi.object({
  word: Joi.string().required(),
  offset: Joi.number().min(0).required()
})

module.exports = {
  searchWordSchema,
  fuzzySearchSchema,
  wordListSchema,
  parseDefinationSchema,
  queryBatchSchema
}