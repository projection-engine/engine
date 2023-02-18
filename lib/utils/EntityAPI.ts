import COMPONENTS from "../../static/COMPONENTS"
import Engine from "../../Engine";
import EntityWorkerAPI from "./EntityWorkerAPI";
import UIAPI from "../rendering/UIAPI";
import PhysicsAPI from "../rendering/PhysicsAPI";
import Entity from "../../instances/Entity";
import ENTITY_TYPED_ATTRIBUTES from "../../static/ENTITY_TYPED_ATTRIBUTES";
import LightsAPI from "./LightsAPI";
import VisibilityRenderer from "../../runtime/VisibilityRenderer";
import ResourceEntityMapper from "../../resource-libs/ResourceEntityMapper";
import MeshResourceMapper from "../MeshResourceMapper";
import MaterialResourceMapper from "../MaterialResourceMapper";
import QueryAPI from "./QueryAPI";

const COMPONENT_TRIGGER_UPDATE = [COMPONENTS.LIGHT, COMPONENTS.MESH]
const excludedKeys = [
    ...ENTITY_TYPED_ATTRIBUTES,
    "components",
    "parent",
    "matrix",
    "_props",
    "isCollection",
    "id"
]
export default class EntityAPI {
    static getNewEntityInstance(id?: string, isCollection?: boolean): Entity {
        return new Entity(id, isCollection)
    }

    static isRegistered(entity) {
        return Engine.entities.has(entity.id)
    }

    static addGroup(entities: Entity[]) {
        const levelEntity = Engine.loadedLevel
        if(!levelEntity)
            return
        const map = {}
        const size = entities.length
        for (let i = 0; i < size; i++){
            const entity = entities[i];
            map[entity.id] = entity
        }
        for (let i = 0; i < size; i++){
            const entity = entities[i];
            if (entity === levelEntity)
                continue;
            if (!entity.parentID || entity.parentID === levelEntity.id)
                entity.addParent(levelEntity)
            else if (!entity.parent && entity.parentID) {
                if(Engine.entities.has(entity.parentID))
                    entity.addParent(Engine.entities.get(entity.parentID))
                else
                    entity.addParent(map[entity.parentID])
            }
            entity.parentID = undefined
        }
        Engine.entities.addBlock(entities, e => e.id)
        EntityWorkerAPI.registerBlock(entities)
        ResourceEntityMapper.addBlock(entities)
    }

    static addEntity(entity?: Entity): Entity {
        if (!entity)
            return
        if (entity && Engine.entities.has(entity.id))
            return Engine.entities.get(entity.id)
        const target = entity ?? EntityAPI.getNewEntityInstance()
        if (!entity.parent && !entity.parentID)
            entity.addParent(Engine.loadedLevel)
        Engine.entities.set(target.id, target)
        EntityWorkerAPI.registerEntity(target)
        EntityAPI.registerEntityComponents(target)
        return entity
    }

    static toggleVisibility(entity: Entity): void {
        const newValue = !entity.active
        entity.active = newValue
        let needsLightUpdate = entity.meshComponent !== undefined || entity.lightComponent !== undefined
        let needsVisibilityUpdate = entity.meshComponent !== undefined
        const hierarchy = QueryAPI.getHierarchy(entity)
        hierarchy.forEach(child => {
            child.active = newValue
            needsVisibilityUpdate = needsVisibilityUpdate || child.meshComponent !== undefined
            needsLightUpdate = needsLightUpdate || child.meshComponent !== undefined || child.lightComponent !== undefined
        })

        if (needsLightUpdate)
            LightsAPI.packageLights(false, true)
        VisibilityRenderer.needsUpdate = needsVisibilityUpdate
    }

    static registerEntityComponents(entity: Entity, previouslyRemoved?: string): void {
        if (!EntityAPI.isRegistered(entity))
            return

        Engine.queryMap.set(entity.queryKey, entity)
        ResourceEntityMapper.addEntity(entity)
        if (COMPONENT_TRIGGER_UPDATE.indexOf(<COMPONENTS | undefined>previouslyRemoved) || !!COMPONENT_TRIGGER_UPDATE.find(v => entity.components.get(v) != null))
            LightsAPI.packageLights(false, true)
        VisibilityRenderer.needsUpdate = true
    }

    static removeEntity(entityToRemove: string | Entity) {
        const entity = entityToRemove instanceof Entity ? entityToRemove : Engine.entities.get(entityToRemove)
        if (!entity || entity === Engine.loadedLevel)
            return
        entity.removeParent()
        EntityAPI.removeGroup([entity], true)
    }

    static removeGroup(toRemove: Entity[], searchHierarchy: boolean) {
        const hierarchy: { [key: string]: Entity } = {}
        for (let i = 0; i < toRemove.length; i++) {
            const entity = toRemove[i]
            if (entity !== Engine.loadedLevel)
                hierarchy[entity.id] = entity
            if (searchHierarchy)
                QueryAPI.getHierarchyToObject(entity, hierarchy)
        }
        const entities = Object.values(hierarchy)
        Engine.entities.removeBlock(entities, entity => entity.id)
        MeshResourceMapper.removeBlock(entities)
        MaterialResourceMapper.removeBlock(entities)
        ResourceEntityMapper.removeBlock(entities)
        EntityWorkerAPI.removeBlock(entities)

        let didLightsChange
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i]
            if (entity === Engine.loadedLevel)
                continue

            if (entity.parent && !hierarchy[entity.parent.id])
                entity.removeParent()
            if (!Engine.isDev)
                for (let i = 0; i < entity.scripts.length; i++) {
                    const scr = entity.scripts[i]
                    if (scr && scr.onDestruction)
                        scr.onDestruction()
                }
            Engine.queryMap.delete(entity.queryKey)
            PhysicsAPI.removeRigidBody(entity)
            UIAPI.deleteUIEntity(entity)
            if (entity.lightComponent !== undefined || entity.meshComponent !== undefined)
                didLightsChange = true
        }

        if (didLightsChange)
            LightsAPI.packageLights(false, true)
    }

    static parseEntityObject(entity: MutableObject, asNew?: boolean): Entity {
        const parsedEntity = EntityAPI.getNewEntityInstance(asNew ? crypto.randomUUID() : entity.id, entity.isCollection)

        const keys = Object.keys(entity)

        for (let i = 0; i < keys.length; i++) {
            try {
                const k = keys[i]
                if (!excludedKeys.includes(k))
                    parsedEntity[k] = entity[k]
            } catch (err) {
                console.warn(err)
            }
        }

        for (let i = 0; i < ENTITY_TYPED_ATTRIBUTES.length; i++) {
            try {
                const key = ENTITY_TYPED_ATTRIBUTES[i]
                if (!entity[key])
                    continue
                for (let j = 0; j < parsedEntity[key].length; j++)
                    parsedEntity[key][j] = entity[key][j]
            } catch (err) {
                console.warn(err)
            }
        }

        parsedEntity.parentID = entity.parent ?? Engine.loadedLevel?.id

        for (const k in entity.components) {
            const component = parsedEntity.addComponent(k)
            if (!component)
                continue
            const keys = Object.keys(entity.components[k])
            for (let i = 0; i < keys.length; i++) {
                try {
                    let componentValue = keys[i]
                    if (componentValue.includes("__") || componentValue.includes("#") || componentValue === "_props" || componentValue === "_name")
                        continue
                    switch (k) {
                        case COMPONENTS.MESH: {
                            if (componentValue === "_meshID" || componentValue === "_materialID")
                                component[componentValue.replace("_", "")] = entity.components[k][componentValue]
                            else
                                component[componentValue] = entity.components[k][componentValue]
                            break
                        }
                        case COMPONENTS.ATMOSPHERE:
                        case COMPONENTS.DECAL: {
                            if (componentValue.charAt(0) === "_")
                                component[componentValue.substring(1, componentValue.length)] = entity.components[k][componentValue]
                            else
                                component[componentValue] = entity.components[k][componentValue]
                            break
                        }
                        default:
                            component[componentValue] = entity.components[k][componentValue]
                    }


                } catch (err) {
                    console.warn(err)
                }
            }
        }
        parsedEntity.changed = true
        parsedEntity.name = entity.name
        parsedEntity.active = entity.active
        return parsedEntity
    }
}
