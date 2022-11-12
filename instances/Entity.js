import {v4} from "uuid"
import Movable from "./Movable";
import COMPONENTS from "../static/COMPONENTS.js";
import EntityAPI from "../lib/utils/EntityAPI";
import QueryAPI from "../lib/utils/QueryAPI";
import ComponentGetter from "../templates/ComponentGetter";
import serializeStructure from "../utils/serialize-structure";
import LightsAPI from "../lib/rendering/LightsAPI";


export default class Entity extends Movable {
    id
    queryKey
    name
    _active
    components = new Map()
    scripts = []
    children = []
    parent
    pickID = [-1, -1, -1]
    instancingGroupID

    constructor(id = v4(), name = "Empty entity", active = true) {
        super()
        this.id = id
        this.name = name
        this._active = active
        this.queryKey = id.slice(0, id.length / 2);
    }

    set active(data) {
        this._active = data

        if (this.components.get(COMPONENTS.POINT_LIGHT) || this.components.get(COMPONENTS.DIRECTIONAL_LIGHT)) {
            LightsAPI.packageLights(true)
            this.needsLightUpdate = true
        } else
            EntityAPI.registerEntityComponents(this)
    }

    get active() {
        return this._active
    }


    get pickIndex() {
        return this.pickID[0] * 255 + this.pickID[1] * 255 + this.pickID[2] * 255
    }

    serializable() {
        const temp = {...this}
        delete temp.parent
        temp.parent = this.parent?.id
        delete temp.children
        const parsedComponents = {}
        Array.from(this.components.entries())
            .forEach(([k, v]) => {
                parsedComponents[k] = v
            })
        temp.components = parsedComponents
        return temp
    }

    clone() {
        const str = serializeStructure(this.serializable())
        const newEntity = EntityAPI.parseEntityObject(JSON.parse(str))
        newEntity.id = v4()
        newEntity.queryKey = newEntity.id.slice(0, newEntity.id.length / 2);
        return newEntity
    }


    addComponent(KEY) {
        let instance = ComponentGetter[KEY]
        if (instance != null) {
            instance = new instance()
            instance.__entity = this
            this.components.set(KEY, instance)

            if (QueryAPI.getEntityByID(this.id) != null)
                EntityAPI.registerEntityComponents(this)

            return instance
        }
    }

    removeComponent(KEY) {
        const hasComponent = this.components.get(KEY) != null
        this.components.delete(KEY)

        if (hasComponent && QueryAPI.getEntityByID(this.id) != null)
            EntityAPI.registerEntityComponents(this)
    }


}