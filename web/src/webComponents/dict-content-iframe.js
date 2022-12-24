export default class DictContentIframe extends HTMLElement {
  static get observedAttributes() { return ['word', 'dictid'] }

  constructor() {
    super()
    const shadowRoot = this.attachShadow({ mode: 'open' })
    const iframe = document.createElement('iframe')
    iframe.style = `border: none; width: 100%; height: auto;`
    this.iframe = iframe
    shadowRoot.appendChild(iframe)
  }

  get word() {
    return this.getAttribute('word' || '')
  }

  set word(val) {
    this.setAttribute('word', val)
    this.setUrl()
  }

  get dictid() {
    return this.getAttribute('dictid' || '')
  }

  set dictid(val) {
    this.setAttribute('dictid', val)
    this.setUrl()
  }

  setUrl() {
    this.iframe.src = `/word-content?dictId=${this.dictid}&word=${this.word}`
  }

  connectedCallback() {
    this.text = this.text || ''
    this.dictid = this.dictid || ''
  }

  attributeChangedCallback() {
  }
}

if (!customElements.get('dict-content-iframe')) {
  customElements.define('dict-content-iframe', DictContentIframe);
}