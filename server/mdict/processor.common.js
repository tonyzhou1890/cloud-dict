const { getSuffix } = require('../utils/util')

/**
 * 处理图片
 * @param {*} entry 词条
 * @param {*} ctx 词典
 * @param {object} config
 */
function image(entry, ctx, config = {}) {
  if (!ctx.mdd) return entry

  // 图标
  const reg = /<img.*?src=(.*?)(\s|>|\/>)/g
  entry.definition = entry.definition.replace(reg, (str, img) => {
    if (img) {
      let imgTemp = img.trim()
      // \\033E5C32.png
      // 部分图片找到的字符串前后存在 \x1E\x1F，要将这两个去掉
      imgTemp = imgTemp.replace(/[\x1E\x1F'"]/g, '')
      imgTemp = imgTemp.replace('file://', '')

      let suffix = getSuffix(imgTemp)

      // 查询
      let result = ctx.mdd.lookup(`\\${imgTemp}`)

      if (result.definition) {
        entry.resource[imgTemp] = {
          type: 'image',
          suffix,
          definition: result.definition
        }
        return str.replace(img, (str2, img2) => {
          // 替换为 base64
          if (config.imageReplace !== false) {
            return `"data:image/${suffix};base64,${result.definition}"`
          } else {
            // 或者仅仅规范化原字符串
            return `"${imgTemp}"`
          }
        })
      }
    }

    return str
  })
  return entry
}

/**
 * 处理样式
 * @param {*} entry 
 * @param {*} ctx 
 * @param {object} config
 */
function style(entry, ctx, config) {
  if (!ctx.mdd) return entry

  const reg = /<link.*?href="(.*?)".*?>/g
  entry.definition = entry.definition.replace(reg, (str, file) => {
    if (file) {
      // 查询
      let result = ctx.mdd.lookup(`\\${file}`)

      if (result.definition) {
        entry.resource[file] = {
          type: 'style',
          suffix: 'css',
          definition: result.definition
        }
        return str.replace(file, (str2, img2) => {
          // 替换为 base64
          if (config.replace !== false) {
            return `data:text/css;base64,${result.definition}`
          } else {
            // 或者仅仅规范化原字符串
            return `${file}`
          }
        })
      }
    }

    return str
  })
  return entry
}

/**
 * 处理发音
 * @param {*} entry 
 * @param {*} ctx 
 * @param {object} config
 */
function sound(entry, ctx, config) {
  if (!ctx.mdd) return entry

  const reg = /<a.*?href="(.*?)"(\s|>|\/>)/g
  entry.definition = entry.definition.replace(reg, (str, file) => {
    if (file.startsWith('sound://')) {
      // 如果去除 sound，直接替换为 javascript:void(0)
      if (config.soundRemove === true) {
        return str.replace(file, 'javascript:void(0);')
      } else if (config.soundIgnore === true) {
        // 忽略音频
        return str
      }
      let suffix = getSuffix(file)

      // 查询
      let result = ctx.mdd.lookup(`\\${file.replace('sound://', '')}`)

      if (result.definition) {
        entry.resource[file] = {
          type: 'audio',
          suffix,
          definition: result.definition
        }
        // 替换为 base64
        if (config.replace !== false) {
          return str.replace(file, `data:audio/${suffix};base64,${result.definition}`)
        } else {
          return str
        }
      }
    }

    return str
  })
  return entry
}

module.exports = {
  image,
  style,
  sound
}