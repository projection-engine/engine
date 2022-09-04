import {v4} from "uuid"
import cloneClass from "../utils/clone-class"
import Movable from "./Movable";
import COMPONENTS from "../data/COMPONENTS";

import DirectionalLightComponent from "./DirectionalLightComponent";
import MeshComponent from "./MeshComponent";
import PointLightComponent from "./PointLightComponent";
import ProbeComponent from "./ProbeComponent";
import CameraComponent from "./CameraComponent";
import SpriteComponent from "./SpriteComponent";


export default class Entity extends Movable {
    id
    queryKey
    name
    active
    components = {}
    scripts = []
    children = []
    parent
    pickID = [-1, -1, -1]
    instancingGroupID

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
        return temp
    }

    clone() {
        let clone = new Entity()
        clone.name = this.name
        let newComponents = {}

        Object.keys(this.components).forEach(c => {
            const cClone = cloneClass(this.components[c])
            cClone.id = v4()
            newComponents[c] = cClone
        })

        delete clone.components
        clone.components = newComponents
        clone.active = this.active

        clone.rotation = [...this.rotation]
        clone.rotationQuaternion = [...this.rotationQuaternion]
        clone.translation = [...this.translation]
        clone.scaling = [...this.scaling]
        clone.matrix = [...this.matrix]
        clone.baseTransformationMatrix = [...this.baseTransformationMatrix]
        clone.lockedRotation = this.lockedRotation
        clone.lockedScaling = this.lockedScaling

        return clone
    }

    static nativeComponents = {
        [COMPONENTS.DIRECTIONAL_LIGHT]: async (entity, k) => new DirectionalLightComponent(entity.components[k].id, entity),
        [COMPONENTS.MESH]: async (entity, k) => new MeshComponent(entity.components[k].id, entity.components[k].meshID, entity.components[k].materialID),
        [COMPONENTS.POINT_LIGHT]: async (entity, k) => new PointLightComponent(entity.components[k].id),
        [COMPONENTS.PROBE]: async (entity, k) => new ProbeComponent(entity.components[k].id),
        [COMPONENTS.CAMERA]: async (entity, k) => new CameraComponent(entity.components[k].id),
        [COMPONENTS.SPRITE]: async () => new SpriteComponent(),
    }

    static async parseEntityObject(entity) {

        const parsedEntity = new Entity(entity.id, entity.name, entity.active)
        Object.keys(entity)
            .forEach(k => {
                if (k !== "components" && k !== "parent" && k !== "matrix")
                    parsedEntity[k] = entity[k]
            })

        parsedEntity.parent = undefined
        parsedEntity.parentCache = entity.parent
        for (const k in entity.components) {
            if (typeof Entity.nativeComponents[k] === "function") {
                let component = await Entity.nativeComponents[k](entity, k)

                if (component) {
                    const keys = Object.keys(entity.components[k])
                    for (let i = 0; i < keys.length; i++) {
                        const oK = keys[i]
                        if (!oK.includes("__") && !oK.includes("#")) component[oK] = entity.components[k][oK]
                    }
                    parsedEntity.components[k] = component
                    if (k === COMPONENTS.DIRECTIONAL_LIGHT)
                        component.changed = true
                }
            }
        }
        parsedEntity.changed = true
        return parsedEntity
    }
}