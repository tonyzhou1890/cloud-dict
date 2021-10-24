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
 * 定位查找单词
 */
const parseDefinationSchema = Joi.object({
  word: Joi.string().required(),
  offset: Joi.number().min(0).required()
})

module.exports = {
  searchWordSchema,
  fuzzySearchSchema,
  parseDefinationSchema
}