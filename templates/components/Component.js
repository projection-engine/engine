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
        MESH: "mesh",
        MATERIAL: "material",
        TERRAIN: "terrain",
        QUAT_EULER: "quatEuler"
    })
    __entity

    _props = []
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

    static group(label, children, disabledIf) {
        return {
            type: Component.propTypes.GROUP,
            label,
            disabledIf,
            children: Array.isArray(children) ? children : []
        }
    }

    static number(label, key, max, min, increment = .001, isAngle, realtime = true, disabledIf) {
        return {label, max, min, increment, type: Component.propTypes.NUMBER, key, isAngle, realtime, disabledIf}
    }
    static quaternionToEuler(label, key, disabledIf) {
        return {label, type: Component.propTypes.QUAT_EULER, key, disabledIf}
    }
    static array(labels, key, increment, max, min, isAngle, disabledIf, defaultValue) {
        return {labels, max, min, increment, type: Component.propTypes.ARRAY, key, disabledIf, isAngle, defaultValue}
    }

    static string(label, key) {
        return {type: Component.propTypes.STRING, label, key}
    }

    static options(key, options, disabledIf) {
        return {
            type: Component.propTypes.OPTIONS,

            options,
            key,
            disabledIf
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
    static materialInstance(label, key, terrainMaterials) {
        return {type: Component.propTypes.MATERIAL, label, key, terrainMaterials}
    }
    static terrainInstance(label, key) {
        return {type: Component.propTypes.TERRAIN, label, key}
    }
    static meshInstance(label, key) {
        return {type: Component.propTypes.MESH, label, key}
    }


    get props() {
        return this._props
    }


    get name() {
        return this._name
    }

}