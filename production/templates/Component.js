import {v4 as uuidv4} from "uuid"

export default class Component {
    id = uuidv4()

    _props = []
    _icon = ""
    _name = ""
    #entity
    get entity(){
        return this.#entity
    }
    set entity(ref){
        if(!this.#entity)
            this.#entity = ref
    }
    onUpdate(){}
    static group(label, children) {
        return {
            type: "group",
            label,
            children: Array.isArray(children) ? children : []
        }
    }

    static number(label, key, max, min, increment = .1, isAngle, realtime=true, disabledIf) {
        return {label, max, min, increment, type: "number", key, isAngle, realtime, disabledIf}
    }
    static array(labels, key, precision,  increment, max, min, isAngle, disabledIf) {
        return {labels, max, min, precision, increment, type: "array", key, disabledIf, isAngle}
    }

    static string(label, key) {
        return {type: "string", label, key}
    }

    static options(label, key, options) {
        return {
            type: "options",
            label,
            options,
            key
        }
    }

    static color(label, key, disabledIf) {
        return {type: "color", label, key, disabledIf}
    }

    static boolean(label, key) {
        return {type: "boolean", label, key}
    }

    static imageTexture(label, key) {
        return {type: "image", label, key}
    }

    static mesh(label, key) {
        return {type: "mesh", label, key}
    }

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




}