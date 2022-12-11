import {v4} from "uuid"
import Movable from "./Movable";
import COMPONENTS from "../static/COMPONENTS.js";
import EntityAPI from "../lib/utils/EntityAPI";
import ComponentGetter from "../templates/ComponentGetter";
import serializeStructure from "../utils/serialize-structure";
import Engine from "../Engine";


export default class Entity extends Movable {
    id
    queryKey
    name
    active = true
    components = new Map()
    scripts = []
    children = []
    parent
    pickID = [-1, -1, -1]
    __materialRef
    __meshRef
    __lightComp

    constructor(id = v4(), name = "Empty entity", active = true) {
        super()
        this.id = id
        this.name = name
        this.active = active
        this.queryKey = id.slice(0, id.length / 2);
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

    static isRegistered(entity) {
        return !!Engine.entitiesMap.get(entity.id)
    }

    addComponent(KEY) {
        let instance = ComponentGetter[KEY]
        if (instance != null) {
            instance = new instance()
            instance.__entity = this
            this.components.set(KEY, instance)
            switch (KEY) {
                case COMPONENTS.LIGHT:
                    this.__hasLight = true
                    this.__lightComp = instance
                    break
                case COMPONENTS.MESH:
                    this.__hasMesh = true
                    break
                case COMPONENTS.CAMERA:
                    this.__hasCamera = true
                    break
                case COMPONENTS.SKYLIGHT:
                    this.__hasSkylight = true
                    break
                case COMPONENTS.SPRITE:
                    this.__hasSprite = true
                    break
                case COMPONENTS.PHYSICS_COLLIDER:
                    this.__hasCollider = true
                    break
                case COMPONENTS.RIGID_BODY:
                    this.__hasRigidBody = true
                    break
                case COMPONENTS.CULLING:
                    this.__hasCulling = true
                    break
                case COMPONENTS.UI:
                    this.__hasUI = true
                    break
                case COMPONENTS.TERRAIN:
                    this.__hasTerrain = true
                    break
            }
            EntityAPI.registerEntityComponents(this)

            return instance
        }
    }

    removeComponent(KEY) {
        const hasComponent = this.components.get(KEY) != null
        this.components.delete(KEY)

        if (hasComponent) {
            EntityAPI.registerEntityComponents(this, KEY)
            switch (KEY) {
                case COMPONENTS.LIGHT:
                    this.__hasLight = false
                    this.__lightComp = undefined
                    break
                case COMPONENTS.MESH:
                    this.__hasMesh = false
                    break
                case COMPONENTS.CAMERA:
                    this.__hasCamera = false
                    break
                case COMPONENTS.SKYLIGHT:
                    this.__hasSkylight = false
                    break
                case COMPONENTS.SPRITE:
                    this.__hasSprite = false
                    break
                case COMPONENTS.PHYSICS_COLLIDER:
                    this.__hasCollider = false
                    break
                case COMPONENTS.RIGID_BODY:
                    this.__hasRigidBody = false
                    break
                case COMPONENTS.CULLING:
                    this.__hasCulling = false
                    break
                case COMPONENTS.UI:
                    this.__hasUI = false
                    break
                case COMPONENTS.TERRAIN:
                    this.__hasTerrain = false
                    break
            }
        }
    }


}