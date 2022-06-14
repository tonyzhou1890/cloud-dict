import JSZip from 'jszip'
import Handlebars from 'handlebars'
import mimetype from '../epub_templates/lightnovel3/mimetype'
import container from '../epub_templates/lightnovel3/META-INF/container.xml'
import opf from '../epub_templates/lightnovel3/EPUB/lightnovel.opf'
import ncx from '../epub_templates/lightnovel3/EPUB/lightnovel.ncx'
import nav from '../epub_templates/lightnovel3/EPUB/nav.html'
import css from '../epub_templates/lightnovel3/EPUB/css/main.css'
import content from '../epub_templates/lightnovel3/EPUB/content.html'
import autoToc from '../epub_templates/lightnovel3/EPUB/auto-toc.html'
import sectionsNavTemplate from '../epub_templates/lightnovel3/EPUB/sections-nav-template.html'
import sectionsNCXTemplate from '../epub_templates/lightnovel3/EPUB/sections-ncx-template.xml'
import sectionsOPFManifestTemplate from '../epub_templates/lightnovel3/EPUB/sections-opf-manifest-template.xml'
import sectionsOPFSpineTemplate from '../epub_templates/lightnovel3/EPUB/sections-opf-spine-template.xml'

const templates = {
  mimetype,
  container,
  opf,
  ncx,
  nav,
  css,
  content,
  autoToc,
  sectionsNavTemplate,
  sectionsNCXTemplate,
  sectionsOPFManifestTemplate,
  sectionsOPFSpineTemplate
}

class Builder {
  make(epubConfig) {
    const zip = new JSZip()
    this.addAdditionalInfo(epubConfig)
    return Promise.all([
      this.addMimetype(zip),
      this.addContainerInfo(zip, epubConfig),
      this.addManifestOpf(zip, epubConfig),
      this.addCover(zip, epubConfig),
      this.addFiles(zip, epubConfig),
      this.addEpub2Nav(zip, epubConfig),
      this.addEpub3Nav(zip, epubConfig),
      this.addStylesheets(zip, epubConfig),
      this.addContent(zip, epubConfig)
    ])
      .then(() => {
        console.log(zip)
        return Promise.resolve(zip)
      })
      .catch(e => {
        console.log(e)
        return Promise.reject(e)
      })
  }

  addAdditionalInfo(epubConfig) {
    //Default options
    epubConfig.options.tocName = epubConfig.options.tocName || 'Menu';
    //Generate name and full title for each section/subsection
    for (var i = 0; i < epubConfig.sections.length; i++) {
      epubConfig.sections[i].rank = i;
      this.addInfoSection(epubConfig.sections[i]);
    }
  }

  addInfoSection(section, titlePrefix, namePrefix) {
    if (!section.content) {
      section.content = {};
    }
    if (titlePrefix) {
      titlePrefix = section.content.fullTitle = titlePrefix + ' - ' + section.content.title;
      namePrefix = section.name = namePrefix + '-' + section.rank;
    } else {
      titlePrefix = section.content.fullTitle = section.content.title;
      namePrefix = section.name = '' + section.rank;
    }
    if (section.content.content || section.content.renderTitle || section.epubType == 'auto-toc') {
      section.needPage = true;
    }
    for (var i = 0; i < section.subSections.length; i++) {
      section.subSections[i].rank = i;
      this.addInfoSection(section.subSections[i], titlePrefix, namePrefix);
    }
  }

  addMimetype(zip) {
    zip.file('mimetype', templates.mimetype);
  }

  addContainerInfo(zip, epubConfig) {
    zip.folder('META-INF').file('container.xml', this.compile(templates.container, epubConfig));
  }

  addManifestOpf(zip, epubConfig) {
    Handlebars.registerPartial('sectionsOPFManifestTemplate', templates.sectionsOPFManifestTemplate);
    Handlebars.registerPartial('sectionsOPFSpineTemplate', templates.sectionsOPFSpineTemplate);
    zip.folder('EPUB').file('lightnovel.opf', this.compile(templates.opf, epubConfig));
  }

  addCover(zip, epubConfig) {
    return new Promise((resolve, reject) => {
      if (epubConfig.coverUrl) {
        fetch(epubConfig.coverUrl)
          .then(res => {
            res.arrayBuffer()
              .then(data => {
                zip.folder('EPUB').folder('images').file(epubConfig.options.coverFilename, data, { binary: true })
                resolve()
              })
              .catch(e => reject(e))
          })
          .catch(e => reject(e))
      } else {
        resolve(true)
      }
    })
  }

  addEpub2Nav(zip, epubConfig) {
    Handlebars.registerPartial('sectionsNCXTemplate', templates.sectionsNCXTemplate);
    Handlebars.registerPartial('sectionsNavTemplate', templates.sectionsNavTemplate);
    zip.folder('EPUB').file('lightnovel.ncx', this.compile(templates.ncx, epubConfig));
  }

  addEpub3Nav(zip, epubConfig) {
    Handlebars.registerPartial('sectionsNavTemplate', templates.sectionsNavTemplate);
    zip.folder('EPUB').file('nav.html', this.compile(templates.nav, epubConfig));
  }

  addStylesheets(zip, epubConfig) {
    const self = this
    return new Promise((resolve, reject) => {
      if (epubConfig.stylesheet.url) {
        fetch(epubConfig.stylesheet.url)
          .then(res => {
            res.text()
              .then(text => {
                epubConfig.styles = text
                compileAndAddCss()
                resolve(text)
              })
              .catch(e => reject(e))
          })
          .catch(e => reject(e))
      } else {
        compileAndAddCss()
        resolve(true)
      }
    })

    function compileAndAddCss() {
      var styles = {
        original: epubConfig.stylesheet.replaceOriginal ? '' : templates.css,
        custom: epubConfig.styles
      };
      zip.folder('EPUB').folder('css').file('main.css', self.compile('{{{original}}}{{{custom}}}', styles, true))
    }
  }

  addFiles(zip, epubConfig) {
    return Promise.all(epubConfig.additionalFiles.map(file => {
      return new Promise((resolve2, reject2) => {
        fetch(file.url).then(res => {
          res.arrayBuffer()
            .then(data => {
              // console.log(file, data)
              zip.folder('EPUB').folder(file.folder).file(file.filename, data, { binary: true })
              resolve2()
            })
            .catch(e => reject2(e))
        }).catch(e => reject2(e))
      })
    }))
  }

  addSection(zip, section) {
    if (section.needPage) {
      if (section.epubType == 'auto-toc') {
        zip.folder('EPUB').file(section.name + '.html', this.compile(templates.autoToc, section));
      } else {
        zip.folder('EPUB').file(section.name + '.html', this.compile(templates.content, section));
      }
    }
    for (var i = 0; i < section.subSections.length; i++) {
      this.addSection(zip, section.subSections[i]);
    }
  }

  addContent(zip, epubConfig) {
    for (var i = 0; i < epubConfig.sections.length; i++) {
      this.addSection(zip, epubConfig.sections[i]);
    }
  }

  compile(template, content, skipFormatting) {
    console.log(skipFormatting)
    return formatHTML(Handlebars.compile(template)(content));

    function formatHTML(htmlstr) {
      return htmlstr
    }
  }
}

export default new Builder()
