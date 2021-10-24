const events = {
  clickEntry: 'click-entry',
  clickSound: 'click-sound'
}

export default class DictContent extends HTMLElement {
  static get observedAttributes() { return ['text'] }

  constructor() {
    super()
    const shadowRoot = this.attachShadow({ mode: 'open' })
    shadowRoot.innerHTML = ``
  }

  get text() {
    return this.getAttribute('text' ||'')
  }

  set text(val) {
    this.setAttribute('text', val)
  }

  connectedCallback() {
    this.text = this.text || ''
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (name === 'text') {
      this.shadowRoot.innerHTML = newValue
      setTimeout(() => {
        const els = this.shadowRoot.querySelectorAll('a')
        ;[].map.call(els, el => {
          // 词条
          if (el.attributes.href?.value?.startsWith('entry://')) {
            let entry = el.attributes.href.value.replace('entry://', '')
            el.setAttribute('href', 'javascript: void(0)')
            el.onclick = () => {
              this.dispatchEvent(new CustomEvent(events.clickEntry, {
                detail: {
                  entry
                }
              }))
              console.log(entry)
            }
          }
          // 音频
          if (el.attributes.href?.value?.startsWith('data:audio')) {
            let sound = el.attributes.href?.value
            el.setAttribute('href', 'javascript: void(0)')
            el.onclick = () => {
              this.dispatchEvent(new CustomEvent(events.clickSound, {
                detail: {
                  sound
                }
              }))
            }
          }
        })
      }, 0)
    }
  }
}

if(!customElements.get('dict-content')){
  customElements.define('dict-content', DictContent);
}