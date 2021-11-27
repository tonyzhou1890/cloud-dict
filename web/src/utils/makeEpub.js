import EpubMaker from '../libs/epub-maker'
import { dataURItoBlob } from './index'
import { exportConfig } from './config'

function make(data, config = {}) {
  console.log(data, config)
  const epub = new EpubMaker()
    .withAuthor('cloud-dict')
    .withLanguage('zh-CN')

  // style
  {
    let stylesheet = data.resource.find(item => item.type === 'style')
    // console.log(stylesheet)
    // let css = ''
    // if (stylesheet) {
    //   css = window.atob(stylesheet.data.replace('data:text/css:base64,', ''))
    // }

    // 因为字典 css 不规范，最后一个样式可能缺少右括号，所以把字体放最前面。路径相对于打包后的 css 文件
    // css = `
    //   @font-face {
    //     font-family: 'Kingsoft Phonetic Plain';
    //     src: url('../fonts/kpp.otf');
    //   }
    // ` + css

    // let blob = dataURItoBlob('data:text/css:base64,' + window.btoa(css))
    if (stylesheet) {
      let blob = dataURItoBlob(stylesheet.data)
      epub.withStylesheetUrl(URL.createObjectURL(blob))
    }

  }

  // font
  // {
  //   epub.withAdditionalFile('/fonts/kpp.otf', 'fonts', 'kpp.otf')
  // }

  // image
  {
    data.resource.map(item => {
      if (item.type === 'image') {
        let blob = dataURItoBlob(item.data)
        epub.withAdditionalFile(URL.createObjectURL(blob), 'images', item.name)
      }
    })
  }


  epub.withTitle(config.title || 'Cloud-Dict')

  // 分章节
  let index = 0
  let chapter = null
  let chapterIndex = 1
  let len = data.list.length
  let rule = []
  exportConfig.chapterSplit.map(v => {
    if (len <= v[0]) {
      rule = v
    }
  })

  data.list.map((item, total) => {
    // 如果每章单词数和总单词数相同，不需要划分二级章节
    if (rule[0] === rule[1]) {
      epub.withSection(
        getSection(item)
      )
    } else {
      if (index === 0) // 章节开始
      {
        chapter = new EpubMaker.Section('auto-toc', `Chapter ${chapterIndex}`, { title: `Chapter ${chapterIndex}` }, true, true)
      }
      chapter.withSubSection(getSection(item))
      index++
      if (index === rule[1] || total === data.list.length - 1) // 章节结束
      {
        epub.withSection(chapter)
        chapterIndex++
        index = 0
      }
    }
  })

  function getSection(item, config = {}) {
    const content = item.definition.replace(/<img.*?src="(.*?)".*?>/g, (str, img) => {
      return str.replace(img, `images/${img}`)
    })
    return new EpubMaker.Section(undefined, config.id || item.word, { title: item.word, content }, true, false)
  }

  return epub.downloadEpub()
}

export default make