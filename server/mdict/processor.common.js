const { getAppendix } = require('../utils/util')


// /**
//  * 处理图片
//  * @param {*} entry 
//  * @param {*} ctx 
//  */
// function image(entry, ctx) {
//   // 图标
//   const reg = /<img.*?src="(.*?)".*?>/g
//   entry.definition = entry.definition.replace(reg, (str, img) => {
//     if (img) {
//       img = img.trim()
//       // \\033E5C32.png
//       // 部分图片找到的字符串前后存在 \x1E\x1F，要将这两个去掉
//       img = img.replace(/[\x1E\x1F]/g, '')
//       let appendix = getAppendix(img)
//       let result = ctx.mdd.lookup(`\\${img}`)
//       if (result.definition) {
//         // return `<img src="data:image/${appendix};base64,${result.definition}" >`
//         return str.replace(/src="(.*?)"/, (str2, img2) => {
//           return `src="data:image/${appendix};base64,${result.definition}"`
//         })
//       }
//     }

//     return ''
//   })
//   return entry
// }
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
      let imgTemp = img.trim()
      // \\033E5C32.png
      // 部分图片找到的字符串前后存在 \x1E\x1F，要将这两个去掉
      imgTemp = imgTemp.replace(/[\x1E\x1F'"]/g, '')
      imgTemp = imgTemp.replace('file://', '')
      console.log(img, imgTemp)
      let appendix = getAppendix(imgTemp)
      let result = ctx.mdd.lookup(`\\${imgTemp}`)
      if (result.definition) {
        // return `<img src="data:image/${appendix};base64,${result.definition}" >`
        return str.replace(img, (str2, img2) => {
          return `"data:image/${appendix};base64,${result.definition}"`
        })
      }
    }

    return ''
  })
  return entry
}

/**
 * 处理样式
 * @param {*} entry 
 * @param {*} ctx 
 */
function style(entry, ctx) {
  if (!ctx.mdd) return entry

  const reg = /<link.*?href="(.*?)".*?>/g
  entry.definition = entry.definition.replace(reg, (str, file) => {
    if (file) {
      let result = ctx.mdd.lookup(`\\${file}`)
      if (result.definition) {
        return str.replace(file, `data:text/css;base64,${result.definition}`)
      }
    }

    return ''
  })
  return entry
}

// /**
//  * 处理发音
//  * @param {*} entry 
//  * @param {*} ctx 
//  */
// function sound(entry, ctx) {
//   if (!ctx.mdd) return entry

//   const reg = /<a.*?href="(.*?)".*?>/g
//   entry.definition = entry.definition.replace(reg, (str, file) => {
//     if (file.startsWith('sound://')) {
//       let result = ctx.mdd.lookup(`\\${file.replace('sound://', '')}`)
//       let appendix = getAppendix(file)
//       if (result.definition) {
//         return str.replace(file, `data:audio/${appendix};base64,${result.definition}`)
//       }
//     }

//     return ''
//   })
//   return entry
// }
/**
 * 处理发音
 * @param {*} entry 
 * @param {*} ctx 
 */
function sound(entry, ctx) {
  if (!ctx.mdd) return entry

  const reg = /<a.*?href="(.*?)"(\s|>|\/>)/g
  entry.definition = entry.definition.replace(reg, (str, file) => {
    if (file.startsWith('sound://')) {
      let result = ctx.mdd.lookup(`\\${file.replace('sound://', '')}`)
      let appendix = getAppendix(file)
      if (result.definition) {
        return str.replace(file, `data:audio/${appendix};base64,${result.definition}`)
      }
    }

    return ''
  })
  return entry
}

module.exports = {
  image,
  style,
  sound
}