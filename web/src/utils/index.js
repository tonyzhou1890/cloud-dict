// 获取纯文本
export function getFile(path) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target.result)
    }
    reader.onerror = (e) => {
      reject(e)
    }
    reader.readAsText(path, 'utf8')
  })
}

/**
     * base64  to blob二进制
     */
export function dataURItoBlob(dataURI) {
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]; // mime类型
  var byteString = atob(dataURI.split(',')[1]); //base64 解码
  var arrayBuffer = new ArrayBuffer(byteString.length); //创建缓冲数组
  var intArray = new Uint8Array(arrayBuffer); //创建视图

  for (var i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([intArray], { type: mimeString });
}

/**
* 
* blob二进制 to base64
**/
export function blobToDataURI(blob, callback) {
  var reader = new FileReader();
  reader.onload = function (e) {
    callback(e.target.result);
  }
  reader.readAsDataURL(blob);
}

/**
 * 对词典数据格式化
 * @param {*} data
 * ```
 * {
 *    resource: {},
 *    list: []
 * }
 * ``` 
 */
export function format(data) {
  // 处理资源
  let resource = data.resource || {}
  let resourceArr = []
  Object.keys(resource).map(key => {
    const temp = resource[key]
    if (temp.type === 'image') {
      resourceArr.push({
        data: `data:image/${temp.suffix};base64,${temp.definition}`,
        type: temp.type,
        name: key
      })
    } else if (temp.type === 'style') {
      resourceArr.push({
        data: `data:text/css:base64,${temp.definition}`,
        type: temp.type,
        name: key
      })
    }
  })
  data.resource = resourceArr

  data.list.map(item => {
    // 处理链接和已经是 javascript:void(0) 的 a 链接(以及包含其中的图片)
    // item.definition = item.definition.replace(/<a.*?href="(entry:.*?)">/g, (str, entry) => {
    //   return str.replace(entry, 'javascript:void(0)')
    // })
    item.definition = item.definition.replace(/(<a.*?href="entry:.*?">|<a.*?href="javascript:void\(0\);".*?<img.*?><\/a>)/g, () => {
      return ''
    })
    // 去掉 x00 符号-- x00 会导致 xml 解析错误
    // eslint-disable-next-line
    item.definition = item.definition.replace(/\x00/g, '').trim()
    // 非字符实体开头的 & 转为字符实体，否则 '& ' 这种也会导致 xml 解析报错
    item.definition = item.definition.replace(/&(?!#?[a-z0-9]+;)/g, '&amp;')
    // 非标签情况的标签开始符号
    item.definition = item.definition.replace(/(<)[美英]>/g, (str, $1) => {
      return str.replace($1, '&lt;')
    })
    // 金山音标转换 unicode
    item.definition = phoneticFormat(item.definition)
  })
}

/**
 * 将 base64 处理为 img url
 * @param {*} data
 */
export function base64ToImg(data) {
  const resourceMap = data.resource ?? {}
  const reg = /<img.*?src="(.*?)"(\s|>|\/>)/g
  console.log(data)
  data.definition = data.definition.replace(reg, (str, img) => {
    if (resourceMap[img] && resourceMap[img].type === 'image') {
      return str.replace(img, () => {
        return `data:image/${resourceMap[img].suffix};base64,${resourceMap[img].definition}`
      })
    }
  })
  return data
}


/**
 * 金山音标替换成 unicode 字符
 */
export const phoneticFormat = (() => {
  /**
   * 金山音标英语音标转国际音标
   * http://www.fmddlmyy.cn/text66.html
   */
  const phoneticMap = {
    '5': 'ˈ',
    '7': 'ˌ',
    '9': 'ˌ',
    'A': 'æ',
    'B': 'ɑ',
    'C': 'ɔ',
    'E': 'ə',
    'F': 'ʃ',
    'I': 'ɪ',
    'J': 'ʊ',
    'N': 'ŋ',
    'Q': 'ʌ',
    'R': 'ɔ',
    'T': 'ð',
    'U': 'u',
    'V': 'ʒ',
    'W': 'θ',
    'Z': 'ɛ',
    '\\': 'ɜ',
    '^': 'ɡ',
  }

  return function (str) {
    return str.replace(/(Kingsoft Phonetic Plain, Tahoma).*?>(.*?)<\//g, (target, $1, $2) => {
      if ($2) {
        let res = []
        for (let i = 0; i < $2.length; i++) {
          res.push(phoneticMap[$2[i]] || $2[i])
        }
        res = res.join('')
        return target.replace($1, '').replace($2, res)
      } else {
        return str
      }
    })
  }

})()