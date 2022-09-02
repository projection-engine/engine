import {v4 as uuidv4} from "uuid"

export default class Component {
    static propTypes = Object.freeze({
        NUMBER: "number",
        GROUP: "group",
        ARRAY: "array",
        STRING: "string",
        OPTIONS: "options",
        COLOR: "color",
        BOOLEAN: "bool",
        IMAGE: "image",
        MESH: "mesh"
    })

    id = uuidv4()

    _props = []
    _icon = ""
    _name = ""
    #entity
    get entity() {
        return this.#entity
    }

    set entity(ref) {
        if (!this.#entity)
            this.#entity = ref
    }

    onUpdate() {
    }

    static group(label, children) {
        return {
            type: Component.propTypes.GROUP,
            label,
            children: Array.isArray(children) ? children : []
        }
    }

    static number(label, key, max, min, increment = .1, isAngle, realtime = true, disabledIf) {
        return {label, max, min, increment, type: Component.propTypes.NUMBER, key, isAngle, realtime, disabledIf}
    }

    static array(labels, key, precision, increment, max, min, isAngle, disabledIf) {
        return {labels, max, min, precision, increment, type: Component.propTypes.ARRAY, key, disabledIf, isAngle}
    }

    static string(label, key) {
        return {type: Component.propTypes.STRING, label, key}
    }

    static options(label, key, options) {
        return {
            type: Component.propTypes.OPTIONS,
            label,
            options,
            key
        }
    }

    static color(label, key, disabledIf) {
        return {type: Component.propTypes.COLOR, label, key, disabledIf}
    }

    static boolean(label, key) {
        return {type: Component.propTypes.BOOLEAN, label, key}
    }

    static imageTexture(label, key) {
        return {type: Component.propTypes.IMAGE, label, key}
    }

    static mesh(label, key) {
        return {type: Component.propTypes.MESH, label, key}
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