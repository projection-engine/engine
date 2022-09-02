import Entity from "../templates/Entity"
import COMPONENTS from "../data/COMPONENTS"
import DirectionalLightComponent from "../templates/DirectionalLightComponent"
import MeshComponent from "../templates/MeshComponent"
import PointLightComponent from "../templates/PointLightComponent"
import ProbeComponent from "../templates/ProbeComponent"
import CameraComponent from "../templates/CameraComponent"
import componentConstructor from "../../../component-constructor";
import SpriteComponent from "../templates/SpriteComponent";


const ENTITIES = {
    [COMPONENTS.DIRECTIONAL_LIGHT]: async (entity, k) => new DirectionalLightComponent(entity.components[k].id, entity),
    [COMPONENTS.MESH]: async (entity, k) => new MeshComponent(entity.components[k].id, entity.components[k].meshID, entity.components[k].materialID),
    [COMPONENTS.POINT_LIGHT]: async (entity, k) => new PointLightComponent(entity.components[k].id),
    [COMPONENTS.PROBE]: async (entity, k) => new ProbeComponent(entity.components[k].id),
    [COMPONENTS.CAMERA]: async (entity, k) => new CameraComponent(entity.components[k].id),
    [COMPONENTS.SPRITE]: async () => new SpriteComponent(),
}

export default async function parseEntityObject(entity) {
    const parsedEntity = new Entity(entity.id, entity.name, entity.active)
    Object.keys(entity)
        .forEach(k => {
            if (k !== "components" && k !== "parent" && k !== "matrix")
                parsedEntity[k] = entity[k]
        })

    parsedEntity.parent = undefined
    parsedEntity.parentCache = entity.parent
    for (const k in entity.components) {
        if (typeof ENTITIES[k] === "function") {
            let component = await ENTITIES[k](entity, k)

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
    for (let i = 0; i < parsedEntity.scripts.length; i++)
        await componentConstructor(parsedEntity, parsedEntity.scripts[i].id, false)
    return parsedEntity
}