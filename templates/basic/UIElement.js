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
    className = ""
    _styles = {}
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
                this._styles = styles
            if (className)
                this.className = className
            if (tag)
                this.tag = tag
        }
    }

    set textContent(inner) {
        if (this._element)
            this._element.innerText = inner
        this._textContent = inner
    }

    get textContent() {
        return this._textContent
    }

    #initializeElement(isMountUnmount) {
        let wasUnmounted = false
        if (this.isInitialized && !isMountUnmount) {
            this.unmount()
            wasUnmounted = true
        }
        if (this._tag.toLowerCase() === "text")
            this._element = document.createTextNode(this._textContent)
        else {
            this._element = document.createElement(this._tag)
            if (this._textContent)
                this._element.innerText = this._textContent
        }
        Object.assign(this._element.style, this._styles)
        if (this.className)
            this._element.className = this.className
        if (wasUnmounted && !isMountUnmount)
            this.mount()
    }

    set tag(tag) {
        this._tag = tag
        this.#initializeElement()
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

    set styles(data) {
        this._styles = data
        this.updateStyles()
    }

    get styles() {
        return this._styles
    }

    updateStyles() {
        console.log(this._element, this._styles)
        if (this._element)
            Object.assign(this._element.style, this._styles)
    }

    mount() {
        if (this.isInitialized)
            return

        if (!this._element)
            this.#initializeElement(true)

        this.isInitialized = true
        this.parentElement.appendChild(this._element)


        const elements = this.children
        for (let i = 0; i < elements.length; i++)
            elements[i].mount()
    }

    unmount() {
        if (!this.isInitialized)
            return

        if (!this._element)
            this.#initializeElement(true)

        this.isInitialized = false
        this.parentElement.removeChild(this._element)

        const elements = this.children
        for (let i = 0; i < elements.length; i++)
            elements[i].unmount()
    }
}