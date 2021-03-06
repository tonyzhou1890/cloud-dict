const { getSuffix } = require('../utils/util')

/**
 * 处理图片
 * @param {*} entry 词条
 * @param {*} ctx 词典
 */
function image(entry, ctx) {
  // 图标
  const reg = /<img.*?src=(.*?)(\s|>|\/>)/g
  entry.definition = entry.definition.replace(reg, (str, img) => {
    if (img) {
      let imgTemp = img.trim().replace(/\//g, '//').replace(/['"]/g, '')
      let suffix = getSuffix(imgTemp)
      let result = ctx.mdd.lookup(`${imgTemp}`)
      console.log(img, result)
      if (result.definition) {
        // return `<img src="data:image/${suffix};base64,${result.definition}" >`
        return str.replace(img, (str2, img2) => {
          return `data:image/${suffix};base64,${result.definition}`
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