const Joi = require('joi')

/**
 * 搜索单词
 */
const searchWordSchema = Joi.object({
  word: Joi.string().required(),
  dictIds: Joi.string()
})

/**
 * 模糊查找
 */
const fuzzySearchSchema = Joi.object({
  word: Joi.string().required(),
  fuzzySize: Joi.number().min(0).max(20),
  edGap: Joi.number().min(0).max(5),
  dictIds: Joi.string()
})

/**
 * 单词列表
 */
const wordListSchema = Joi.object({
  page: Joi.number().min(1),
  size: Joi.number().min(1),
  book: Joi.string()
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

/**
 * 字典词表
 */
const dictKeysSchema = Joi.object({
  dictId: Joi.string().required()
})

/**
 * 获取音频
 */
const getSoundSchema = Joi.object({
  dictId: Joi.string().required(),
  file: Joi.string().required()
})

/**
 * 判断单词是否存在
 */
const isExistSchema = Joi.object({
  dictId: Joi.string().allow('', null),
  words: Joi.string().required()
})

module.exports = {
  searchWordSchema,
  fuzzySearchSchema,
  wordListSchema,
  parseDefinationSchema,
  queryBatchSchema,
  dictKeysSchema,
  getSoundSchema,
  isExistSchema
}