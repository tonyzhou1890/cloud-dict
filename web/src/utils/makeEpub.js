// import EpubMaker from 'epub-maker/dist/js-epub-maker'
// console.log(EpubMaker)
import { dataURItoBlob } from './index'

function make(data, config = {}, callback) {
  console.log(data, config)
  let stylesheet = data.resource.find(item => item.type = 'style')
  const epub = new window.EpubMaker()
    .withTemplate('idpf-wasteland')
    // .withTemplate('lightnovel')
    .withAuthor('cloud-dict')
    .withLanguage('zh-CN')

  if (stylesheet) {
    let blob = dataURItoBlob(stylesheet.data)
    epub.withStylesheetUrl(URL.createObjectURL(blob))
  }

  data.resource.map(item => {
    if (item.type === 'image') {
      let blob = dataURItoBlob(item.data)
      epub.withAdditionalFile(URL.createObjectURL(blob), '/resource', item.key)
    }
  })

  epub.withTitle('Cloud-Dict')

  data.list.map(item => {
    const content = item.definition.replace(/<img.*?src="(.*?)".*?>/g, (str, img) => {
      return str.replace(img, `/resource/${img}`)
    })
    epub.withSection(
      new window.EpubMaker.Section(undefined, item.word, { title: item.word, content }, true, false)
    )
  })

  epub.downloadEpub()
  if (typeof callback === 'function') {
    callback()
  }
}

export default make