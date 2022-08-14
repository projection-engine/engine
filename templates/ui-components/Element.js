import UIComponent from "../basic/UIComponent";

export default class Element extends UIComponent {
    _element
    className
    style
    parent
    isMounted = false

    _textContent = ""

    constructor(uiEntity, tag, textContent) {
        super(uiEntity)
        this.element = {tag, textContent}
    }

    set textContent(inner) {
        const newContent = document.createTextNode(inner)
        this.parent.removeChild(this._element)
        this._element = newContent
        this.parent.appendChild(this._element)
    }

    set element({tag, textContent}) {
        if (this.isMounted)
            this.unmount()
        this._element = !textContent ? document.createElement(tag) : document.createTextNode(textContent)
        this._textContent = textContent
    }

    mount(parentTarget) {
        super.mount()
        if (!this.isMounted)
            return
        this.parent = parentTarget
        this.isMounted = true

        this.parent.appendChild(this._element)
    }

    unmount() {
        super.unmount()
        if (this.isMounted)
            return
        this.isMounted = false
        this.parent.removeChild(this._element)
    }
}