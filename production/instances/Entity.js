import {v4} from "uuid"
import Movable from "./Movable";
import COMPONENTS from "../../static/COMPONENTS.json";
import DirectionalLightComponent from "../components/rendering/DirectionalLightComponent";
import MeshComponent from "../components/rendering/MeshComponent";
import PointLightComponent from "../components/rendering/PointLightComponent";
import ProbeComponent from "../components/rendering/ProbeComponent";
import CameraComponent from "../components/misc/CameraComponent";
import SpriteComponent from "../components/rendering/SpriteComponent";
import RigidBodyComponent from "../components/physics/RigidBodyComponent";
import PhysicsColliderComponent from "../components/physics/PhysicsColliderComponent";
import CullingComponent from "../components/misc/CullingComponent";
import EntityAPI from "../apis/EntityAPI";
import UIComponent from "../components/misc/UIComponent";
import Engine from "../Engine";


const TYPED_ATTRIBUTES = [
    "_translation",
    "__changedBuffer",
    "_rotationQuat",
    "matrix",
    "absoluteTranslation",
    "_scaling",
    "baseTransformationMatrix"
]

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

    set active(data) {
        this._active = data

        if (this.components.get(COMPONENTS.POINT_LIGHT) || this.components.get(COMPONENTS.DIRECTIONAL_LIGHT)) {
            EntityAPI.packageLights(true)
            this.needsLightUpdate = true
        }
        else
            EntityAPI.registerEntityComponents(this)
    }

    get active() {
        return this._active
    }

    constructor(id = v4(), name = "Empty entity", active = true) {
        super()
        this.id = id
        this.name = name
        this._active = active
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
        const str = Entity.serializeComplexObject(this.serializable())
        const newEntity = Entity.parseEntityObject(JSON.parse(str))
        newEntity.id = v4()
        newEntity.queryKey = newEntity.id.slice(0, newEntity.id.length / 2);
        return newEntity
    }

    static nativeComponents = {
        [COMPONENTS.DIRECTIONAL_LIGHT]: DirectionalLightComponent,
        [COMPONENTS.MESH]: MeshComponent,
        [COMPONENTS.POINT_LIGHT]: PointLightComponent,
        [COMPONENTS.PROBE]: ProbeComponent,
        [COMPONENTS.CAMERA]: CameraComponent,
        [COMPONENTS.SPRITE]: SpriteComponent,

        [COMPONENTS.PHYSICS_COLLIDER]: PhysicsColliderComponent,
        [COMPONENTS.RIGID_BODY]: RigidBodyComponent,
        [COMPONENTS.CULLING]: CullingComponent,
        [COMPONENTS.UI]: UIComponent,
    }

    static parseEntityObject(entity) {

        const parsedEntity = new Entity(entity.id, entity.name, entity.active)
        const keys = Object.keys(entity)

        for (let i = 0; i < keys.length; i++) {
            const k = keys[i]
            if (k !== "components" && k !== "parent" && k !== "matrix" && !TYPED_ATTRIBUTES.includes(k))
                parsedEntity[k] = entity[k]
        }

        for (let i = 0; i < TYPED_ATTRIBUTES.length; i++) {
            const key = TYPED_ATTRIBUTES[i]
            if (!entity[key])
                continue
            for (let j = 0; j < parsedEntity[key].length; j++)
                parsedEntity[key][j] = entity[key][j]
        }

        parsedEntity.parent = undefined
        parsedEntity.parentCache = entity.parent
        for (const k in entity.components) {
            const component = parsedEntity.addComponent(k)
            if (!component)
                continue
            const keys = Object.keys(entity.components[k])
            for (let i = 0; i < keys.length; i++) {
                const componentValue = keys[i]
                if (componentValue.includes("__") || componentValue.includes("#") || componentValue === "_props" || componentValue === "_name")
                    continue
                component[componentValue] = entity.components[k][componentValue]
            }
            if (k === COMPONENTS.DIRECTIONAL_LIGHT)
                component.changed = true
        }
        parsedEntity.changed = true
        return parsedEntity
    }

    addComponent(KEY) {
        let instance = Entity.nativeComponents[KEY]
        if (instance != null) {
            instance = new instance()
            instance.__entity = this
            this.components.set(KEY, instance)

            if (Engine.entitiesMap.get(this.id) != null) // initialized
                EntityAPI.registerEntityComponents(this)

            return instance
        }
    }

    removeComponent(KEY) {
        const hasComponent = this.components.get(KEY) != null
        this.components.delete(KEY)

        if (hasComponent && Engine.entitiesMap.get(this.id) != null)
            EntityAPI.registerEntityComponents(this)
    }

    static serializeComplexObject(obj) {
        return JSON.stringify(
            obj,
            (key, value) => {
                if (key.startsWith("#") || key.startsWith("__"))
                    return undefined
                if (value instanceof Int8Array ||
                    value instanceof Uint8Array ||
                    value instanceof Uint8ClampedArray ||
                    value instanceof Int16Array ||
                    value instanceof Uint16Array ||
                    value instanceof Int32Array ||
                    value instanceof Uint32Array ||
                    value instanceof Float32Array ||
                    value instanceof Float64Array)
                    return Array.from(value)

                return value
            })
    }
}