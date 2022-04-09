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
    return this.getAttribute('text' || '')
  }

  set text(val) {
    this.setAttribute('text', val)
  }

  connectedCallback() {
    this.text = this.text || ''
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'text') {
      this.shadowRoot.innerHTML = newValue
      setTimeout(() => {
        // a 标签元素处理
        const anchorEls = this.shadowRoot.querySelectorAll('a')
          ;[].map.call(anchorEls, el => {
            // 词条
            if (el.attributes.href?.value?.startsWith('entry://')) {
              let entry = el.attributes.href.value.replace('entry://', '')
              // el.setAttribute('href', 'javascript: void(0)')
              // 修改为可以通过链接打开--主要是为了中键新窗口打开
              el.setAttribute('href', `/search?word=${entry}`)
              // 左键点击事件，触发 clickEntry 事件。屏蔽默认行为。因为页面切换加了动画。左键通过默认行为查询单词效率太低
              el.onclick = (e) => {
                this.dispatchEvent(new CustomEvent(events.clickEntry, {
                  detail: {
                    entry
                  }
                }))
                e?.preventDefault()
                console.log(entry)
              }
            }
            // 音频
            // if (el.attributes.href?.value?.startsWith('data:audio')) {
            //   let sound = el.attributes.href?.value
            //   el.setAttribute('href', 'javascript: void(0)')
            //   el.onclick = () => {
            //     this.dispatchEvent(new CustomEvent(events.clickSound, {
            //       detail: {
            //         sound
            //       }
            //     }))
            //   }
            // }
            if (el.attributes.href?.value?.startsWith('sound://')) {
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

if (!customElements.get('dict-content')) {
  customElements.define('dict-content', DictContent);
}