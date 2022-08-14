import UIRenderer from "../../UIRenderer";
import UIComponent from "../basic/UIComponent";

export default class Reactive extends UIComponent{
    state = {}
    props = {}
    isInitialized = false
    elements = []
    parent = UIRenderer.renderTarget


    constructor(
        uiEntity,
        {
            initialState,
            props,
            elements = [],
            parent
        }) {
        super(uiEntity)
        if (parent instanceof HTMLElement)
            this.parent = parent
        if (Array.isArray(children))
            this.children = children
        if (Array.isArray(elements))
            this.elements = elements
        if (typeof initialState === "object")
            this.state = initialState
        if (typeof props === "object")
            this.props = props

        this.uiEntity = uiEntity
    }

    mount() {
        super.mount()
        if (this.isInitialized)
            return
        this.isInitialized = true
        const elements = this.uiEntity.children
        for (let i = 0; i < elements.length; i++)
            this.elements[i].mount(this.parent)
    }

    unmount() {
        super.unmount()
        const elements = this.uiEntity.children
        for (let i = 0; i < elements.length; i++)
            elements[i].unmount()
        this.isInitialized = false
    }
}