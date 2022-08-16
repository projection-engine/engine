import {v4} from "uuid";
import UIRenderer from "../../UIRenderer";

export default class UIElement {
    parent
    children = []

    name = "New UI Element"
    id = v4()
    props = {}
    _element = undefined
    isInitialized = false
    className
    styles = {}
    _tag = "div"
    _textContent = ""

    constructor(id, name, attributes) {
        if (name)
            this.name = name
        if (id)
            this.id = id

        if (attributes) {
            const {
                parent,
                styles,
                className,
                tag
            } = attributes
            this.parent = parent
            if (styles)
                this.styles = styles
            if (className)
                this.className = className
            if (tag)
                this.tag = tag
        }
    }

    set textContent(inner) {
        this._element.innerText = inner
        this._textContent = inner
    }

    get textContent() {
        return this._textContent
    }

    set tag(tag) {
        this._tag = tag
        let wasUnmounted = false
        if (this.isInitialized) {
            this.unmount()
            wasUnmounted = true
        }
        this._element = this._tag.toLowerCase() === "text" ? document.createTextNode(this._textContent) : document.createElement(tag)
        if (wasUnmounted)
            this.mount()
    }

    get tag() {
        return this._tag
    }

    get element() {
        return this._element
    }

    get parentElement() {
        return this.parent ? this.parent.element : UIRenderer.renderTarget
    }

    mount() {
        if (this.isInitialized)
            return
        this.isInitialized = true

        this.parentElement.appendChild(this._element)
        Object.assign(this._element.style, this.styles)
        this._element.className = this.className

        const elements = this.children
        for (let i = 0; i < elements.length; i++)
            elements[i].mount()
    }

    unmount() {
        if (!this.isInitialized)
            return
        this.isInitialized = false
        this.parentElement.removeChild(this._element)

        const elements = this.children
        for (let i = 0; i < elements.length; i++)
            elements[i].unmount()
    }
}