import {v4} from "uuid";
import UserInterfaceController from "../controllers/UserInterfaceController";
import ELEMENT_ID from "../data/ELEMENT_ID";

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
    queryKey = this.id
    scripts = []
    _layoutBlock = ""

    constructor(id, name, attributes) {
        if (name)
            this.name = name
        if (id) {
            this.id = id
            this.queryKey = id
        }

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

    #updateTextContent() {
        const element = document.createTextNode(this._textContent)

        this._element.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE)
                this._element.removeChild(child)
        })
        this._element.appendChild(element)
    }

    set textContent(inner) {
        this._textContent = inner
        if (this._element)
            this.#updateTextContent()
    }

    set layoutBlock(html) {
        if (this._element)
            this._element.innerHTML = html
        this._layoutBlock = html
    }

    get layoutBlock() {
        return this._layoutBlock
    }

    get textContent() {
        return this._textContent
    }

    #updateContent() {
        this._element.id = this.queryKey
        if (this._layoutBlock)
            this._element.innerHTML = this._layoutBlock
        if (this._textContent)
            this.#updateTextContent()

        Object.assign(this._element.style, this._styles)
        if (this.className)
            this._element.className = this.className
    }

    #initializeElement(isMountUnmount) {
        let wasUnmounted = false
        if (this.isInitialized && !isMountUnmount) {
            this.unmount()
            wasUnmounted = true
        }

        this._element = document.createElement(this._tag)
        this.#updateContent()
        if (wasUnmounted && !isMountUnmount)
            this.mount()
        this._element.setAttribute(ELEMENT_ID, this.id)
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
        return this.parent ? this.parent.element : UserInterfaceController.renderTarget
    }

    set styles(data) {
        this._styles = data
        this.updateStyles()
    }

    get styles() {
        return this._styles
    }

    updateStyles() {
        if (this._element) {
            this._element.removeAttribute("style")
            Object.assign(this._element.style, this._styles)

        }
    }

    mount() {
        if (this.isInitialized)
            return

        if (!this._element)
            this.#initializeElement(true)
        else
            this.#updateContent()
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
        if (this._element.parentElement)
            this._element.parentElement.removeChild(this._element)


        const elements = this.children
        for (let i = 0; i < elements.length; i++)
            elements[i].unmount()
    }
}