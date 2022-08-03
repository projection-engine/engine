import {v4 as uuidv4} from "uuid"

export default class Component {
    id = uuidv4()
    active = true
    #initializedCustom = false
    _props = []
    _icon = ""
    _name = ""


    get props() {
        return this._props
    }

    get icon() {
        return this._icon
    }

    get name() {
        return this._name
    }

    constructor(id) {
        if (id)
            this.id = id
    }

    constructFromCustom(name, icon, props, initial) {
        if (this.#initializedCustom)
            return
        this.#initializedCustom = true

        this._icon = icon
        this._name = name
        this._props = props
        Object.keys(initial).forEach(key => {
            if (key !== "COMPONENT_NAME" && key !== "COMPONENT_KEY" && key !== "COMPONENT_ICON" && key !== "props")
                this[key] = initial[key]
        })

    }
}