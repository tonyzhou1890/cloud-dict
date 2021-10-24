const { getAppendix } = require('../utils/util')

/**
 * 处理图片
 * @param {*} entry 
 * @param {*} ctx 
 */
function image(entry, ctx) {
  // 图标
  const reg = /<img.*?src="(.*?)".*?>/g
  entry.definition = entry.definition.replace(reg, (str, img) => {
    if (img) {
      img = img.trim()
      let appendix = getAppendix(img)
      let result = ctx.mdd.lookup(`${img}`)
      console.log(img, result)
      if (result.definition) {
        // return `<img src="data:image/${appendix};base64,${result.definition}" >`
        return str.replace(/src="(.*?)"/, (str2, img2) => {
          return `src="data:image/${appendix};base64,${result.definition}"`
        })
      }
    }
    
    return ''
  })
  return entry
}

module.exports = {
  image,
}