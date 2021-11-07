/**
 * 剑桥词典词条处理
 */
const commonProcessor = require('./processor.common')
const { getSuffix } = require('../utils/util')

/**
 * 处理图片
 * @param {*} entry 
 * @param {*} ctx 
 */
function image(entry, ctx) {
  entry = commonProcessor.image(entry, ctx)
  // file 协议图片，剑桥的图片没引号
  const reg = /<img.*?src=(.*?)>/g
  entry.definition = entry.definition.replace(reg, (str, img) => {
    // 有引号的不处理
    if (img.startsWith('"')) return str

    img = img.trim()
    img = img.replace('file://', '')
    let suffix = getSuffix(img)
    let result = ctx.mdd.lookup(`\\${img}`)
    if (result.definition) {
      return `<img src="data:image/${suffix};base64,${result.definition}" >`
    }

    return ''
  })
  return entry
}


module.exports = {
  image
}