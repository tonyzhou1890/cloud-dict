const { getAppendix } = require('../utils/util')

/**
 * 处理图片
 * @param {*} entry 
 * @param {*} ctx 
 */
function image(entry, ctx) {
  // 图标
  const reg = /<img.*?src=(.*?)(\s|>|\/>)/g
  entry.definition = entry.definition.replace(reg, (str, img) => {
    if (img) {
      let imgTemp = img.trim().replace(/\//g, '//').replace(/['"]/g, '')
      let appendix = getAppendix(imgTemp)
      let result = ctx.mdd.lookup(`${imgTemp}`)
      console.log(img, result)
      if (result.definition) {
        // return `<img src="data:image/${appendix};base64,${result.definition}" >`
        return str.replace(img, (str2, img2) => {
          return `data:image/${appendix};base64,${result.definition}`
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