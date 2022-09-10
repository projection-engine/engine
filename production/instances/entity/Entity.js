import {v4} from "uuid"
import cloneClass from "../../utils/clone-class"
import Movable from "./Movable";
import COMPONENTS from "../../data/COMPONENTS";

import DirectionalLightComponent from "../../components/rendering/DirectionalLightComponent";
import MeshComponent from "../../components/rendering/MeshComponent";
import PointLightComponent from "../../components/rendering/PointLightComponent";
import ProbeComponent from "../../components/rendering/ProbeComponent";
import CameraComponent from "../../components/misc/CameraComponent";
import SpriteComponent from "../../components/rendering/SpriteComponent";
import RigidBodyComponent from "../../components/physics/RigidBodyComponent";
import BoxColliderComponent from "../../components/physics/BoxColliderComponent";
import SphereColliderComponent from "../../components/physics/SphereColliderComponent";
import CapsuleColliderComponent from "../../components/physics/CapsuleColliderComponent";


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
        [COMPONENTS.DIRECTIONAL_LIGHT]: (entity) => new DirectionalLightComponent(entity),
        [COMPONENTS.MESH]: (entity, k) => new MeshComponent(entity.components[k].meshID, entity.components[k].materialID),
        [COMPONENTS.POINT_LIGHT]: () => new PointLightComponent(),
        [COMPONENTS.PROBE]: () => new ProbeComponent(),
        [COMPONENTS.CAMERA]: () => new CameraComponent(),
        [COMPONENTS.SPRITE]: () => new SpriteComponent(),

        [COMPONENTS.SPHERE_COLLIDER]: () => new SphereColliderComponent(),
        [COMPONENTS.BOX_COLLIDER]: () => new BoxColliderComponent(),
        [COMPONENTS.CAPSULE_COLLIDER]: () => new CapsuleColliderComponent(),
        [COMPONENTS.RIGID_BODY]: () => new RigidBodyComponent(),
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
                let component = Entity.nativeComponents[k](entity, k)

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