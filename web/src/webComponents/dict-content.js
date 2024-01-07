const events = {
  clickEntry: "click-entry",
  clickSound: "click-sound",
};

export default class DictContent extends HTMLElement {
  static get observedAttributes() {
    return ["text"];
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = ``;
    // this.window = new Proxy(window)
  }

  get text() {
    return this.getAttribute("text" || "");
  }

  set text(val) {
    this.setAttribute("text", val);
  }

  connectedCallback() {
    this.text = this.text || "";
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "text") {
      this.shadowRoot.innerHTML = `${newValue}`;
      setTimeout(() => {
        // a 标签元素处理
        const anchorEls = this.shadowRoot.querySelectorAll("a");
        [].map.call(anchorEls, (el) => {
          // 词条
          if (el.attributes.href?.value?.startsWith("entry://")) {
            let entry = el.attributes.href.value.replace("entry://", "");
            // el.setAttribute('href', 'javascript: void(0)')
            // 跳转连接不是 # 开头的才可以跳转，以 # 开头的链接属于释义内部跳转，暂不支持
            if (!entry.startsWith("#")) {
              // 修改为可以通过链接打开--主要是为了中键新窗口打开
              el.setAttribute("href", `/search?word=${entry}`);
              // 左键点击事件，触发 clickEntry 事件。屏蔽默认行为。因为页面切换加了动画。左键通过默认行为查询单词效率太低
              el.onclick = (e) => {
                this.dispatchEvent(
                  new CustomEvent(events.clickEntry, {
                    detail: {
                      entry,
                    },
                  })
                );
                e?.preventDefault();
                console.log(entry);
              };
            } else {
              el.setAttribute("href", "javascript: void(0)");
              // el.setAttribute("href", entry);
            }
          }
          // 音频
          if (el.attributes.href?.value?.startsWith("sound://")) {
            let sound = el.attributes.href?.value;
            el.setAttribute("href", "javascript: void(0)");
            el.onclick = () => {
              this.dispatchEvent(
                new CustomEvent(events.clickSound, {
                  detail: {
                    sound,
                  },
                })
              );
            };
          }
        });
        // 脚本
        const scriptEls = this.shadowRoot.querySelectorAll("script");
        [].map.call(scriptEls, (el) => {
          if (el.src) {
            const s = document.createElement("script");
            s.src = el.src;
            this.shadowRoot.appendChild(s);
          }
        });
      }, 0);
    }
  }
}

if (!customElements.get("dict-content")) {
  customElements.define("dict-content", DictContent);
}
