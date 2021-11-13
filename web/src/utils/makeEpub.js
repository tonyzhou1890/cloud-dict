import EpubMaker from '../libs/epub-maker'
import { dataURItoBlob } from './index'

function make(data, config = {}) {
  console.log(data, config)
  const epub = new EpubMaker()
    .withAuthor('cloud-dict')
    .withLanguage('zh-CN')

  // style
  {
    let stylesheet = data.resource.find(item => item.type === 'style')
    console.log(stylesheet)
    let css = ''
    if (stylesheet) {
      css = window.atob(stylesheet.data.replace('data:text/css:base64,', ''))
    }

    // 因为字典 css 不规范，最后一个样式可能缺少右括号，所以把字体放最前面
    css = `
      @font-face {
        font-family: 'Kingsoft Phonetic Plain';
        src: url('fonts/Ksphonet.otf');
      }
    ` + css

    let blob = dataURItoBlob('data:text/css:base64,' + window.btoa(css))
    epub.withStylesheetUrl(URL.createObjectURL(blob))
  }

  // font--only otf supported
  {
    epub.withAdditionalFile('/font/Ksphonet.otf', 'fonts', 'Ksphonet.otf')
  }

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

  data.list.map(item => {
    const content = item.definition.replace(/<img.*?src="(.*?)".*?>/g, (str, img) => {
      return str.replace(img, `images/${img}`)
    })
    epub.withSection(
      new EpubMaker.Section(undefined, item.word, { title: item.word, content }, true, false)
    )
  })

  return epub.downloadEpub()
}

export default make