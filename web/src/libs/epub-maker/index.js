import { saveAs } from 'file-saver'
import lightnovel from './template-builders/lightnovel-builder'
import lightnovel3 from './template-builders/lightnovel3-builder'
import dict from './template-builders/dict'
import './util/handlebar-helpers'

const templateManagers = {
  lightnovel,
  lightnovel3,
  dict
}

class EpubMaker {
  constructor() {
    this.epubConfig = {
      toc: [],
      landmarks: [],
      sections: [],
      stylesheet: {},
      additionalFiles: [],
      options: {},
      uuid: Date.now(),
      templateName: 'lightnovel3'
    }
  }

  withUuid(uuid) {
    this.epubConfig.uuid = uuid
    return this
  }

  withTemplate(templateName) {
    this.epubConfig.templateName = templateName
    return this
  }

  withTitle(title) {
    this.epubConfig.title = title
    this.epubConfig.slug = (title || 'epub').replace(/[/:*?"<>|]/g, '')
    return this
  }

  withLanguage(lang) {
    this.epubConfig.lang = lang
    return this
  }

  withAuthor(author) {
    this.epubConfig.author = author
    return this
  }

  withPublisher(publisher) {
    this.epubConfig.publisher = publisher
    return this
  }

  withModificationDate(modificationDate) {
    this.epubConfig.modificationDate = modificationDate.toISOString()
    this.epubConfig.modificationDateYMD = this.epubConfig.modificationDate.substr(0, 10)
    return this
  }

  withRights(rightsConfig) {
    this.epubConfig.rights = rightsConfig
    return this
  }

  withCover(coverUrl, rightsConfig) {
    this.epubConfig.coverUrl = coverUrl
    this.epubConfig.coverRights = rightsConfig
    return this
  }

  withAttributionUrl(attributionUrl) {
    this.epubConfig.attributionUrl = attributionUrl
    return this
  }

  withStylesheetUrl(stylesheetUrl, replaceOriginal) {
    this.epubConfig.stylesheet = {
      url: stylesheetUrl,
      styles: '',
      replaceOriginal
    }
    return this
  }

  withSection(section) {
    this.epubConfig.sections.push(section)
    Array.prototype.push.apply(this.epubConfig.toc, section.collectToc())
    Array.prototype.push.apply(this.epubConfig.landmarks, section.collectLandmarks())
    return this
  }

  withAdditionalFile(fileUrl, folder, filename) {
    this.epubConfig.additionalFiles.push({
      url: fileUrl,
      folder,
      filename
    })
    return this
  }

  withOption(key, value) {
    this.epubConfig.options[key] = value
    return this
  }

  makeEpub() {
    this.epubConfig.publicationDate = new Date().toISOString()
    this.epubConfig.publicationDateYMD = this.epubConfig.publicationDate.substr(0, 10)
    return templateManagers[this.epubConfig.templateName].make(this.epubConfig).then((epubZip) => {
      console.info('generating epub for: ' + this.epubConfig.title);
      const content = epubZip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip', compression: 'DEFLATE' })
      return content
    })
  }

  downloadEpub(callback, useTitle) {
    return new Promise((resolve, reject) => {
      this.makeEpub()
        .then(epubZipContent => {
          let filename
          if (useTitle) {
            filename = this.epubConfig.title + '.epub'
          }
          else {
            filename = this.epubConfig.slug + '.epub'
          }
          console.info('saving "' + filename + '"...');
          if (callback && typeof (callback) === 'function') {
            callback(epubZipContent, filename)
          }
          saveAs(epubZipContent, filename)
          resolve(epubZipContent)
        })
        .catch(e => {
          reject(e)
        })
    })
  }
}

class Section {
  /**
   * @epubType Optional. Allows you to add specific epub type content such as [epub:type="titlepage"]
   * @id Optional, but required if section should be included in toc and / or landmarks
   * @content Optional. Should not be empty if there will be no subsections added to this section. Format: { title, content, renderTitle }
   */
  constructor(epubType, id, content, includeInToc, includeInLandmarks) {
    this.epubType = epubType
    this.id = id
    this.content = content
    this.includeInToc = includeInToc
    this.includeInLandmarks = includeInLandmarks
    this.subSections = []

    if (content) {
      content.renderTitle = content.renderTitle !== false // 'undefined' should default to true
    }
  }

  withSubSection(subsection) {
    this.subSections.push(subsection)
    return this
  }

  collectToc() {
    return this.collectSections(this, 'includeInToc')
  }

  collectLandmarks() {
    return this.collectSections(this, 'includeInLandmarks')
  }

  collectSections(section, prop) {
    var sections = section[prop] ? [section] : []
    for (var i = 0; i < section.subSections.length; i++) {
      Array.prototype.push.apply(sections, this.collectSections(section.subSections[i], prop))
    }
    return sections
  }
}

EpubMaker.Section = Section

export default EpubMaker
