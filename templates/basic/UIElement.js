import {v4} from "uuid";
import UIRenderer from "../../UIRenderer";

export default class UIElement {
    parent
    children = []

    name = "New UI Element"
    id = v4()
    state = {}
    props = {}
    _element = undefined
    isInitialized = false

    constructor(id, name, attributes) {
        if (name)
            this.name = name
        if (id)
            this.id = id

        if (attributes) {
            const {
                initialState,
                props,
                parent
            } = attributes

            this.parent = parent
            if (Array.isArray(children))
                this.children = children
            if (typeof initialState === "object")
                this.state = initialState
            if (typeof props === "object")
                this.props = props
        }

    }

    set textContent(inner) {
        const newContent = document.createTextNode(inner)
        this.parent.removeChild(this._element)
        this._element = newContent
        this.parent.appendChild(this._element)
    }

    set element({tag, textContent}) {
        if (this.isInitialized)
            this.unmount()
        this._element = !textContent ? document.createElement(tag) : document.createTextNode(textContent)
        this._textContent = textContent
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