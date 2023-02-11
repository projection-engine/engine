import COMPONENTS from "../../static/COMPONENTS"
import Engine from "../../Engine";

import ENVIRONMENT from "../../static/ENVIRONMENT";
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
    static #timeout

    static getNewEntityInstance(id?: string, isCollection?: boolean): Entity {
        return new Entity(id, isCollection)
    }

    static isRegistered(entity) {
        return Engine.entities.has(entity.id)
    }

    static addEntity(entity?: Entity): Entity {
        if (!entity)
            return
        if (entity && Engine.entities.has(entity.id))
            return Engine.entities.map.get(entity.id)
        const target = entity ?? EntityAPI.getNewEntityInstance()
        if (!entity.parent && !entity.parentID)
            entity.addParent(Engine.loadedLevel)
        Engine.entities.add(target.id, target)

        EntityWorkerAPI.removeEntity(target)
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
        if (Engine.environment !== ENVIRONMENT.DEV)
            PhysicsAPI.registerRigidBody(entity)
        Engine.queryMap.set(entity.queryKey, entity)
        UIAPI.createUIEntity(entity)

        if (entity.lightComponent !== undefined)
            ResourceEntityMapper.lights.add(entity.id, entity)
        if (entity.spriteComponent !== undefined)
            ResourceEntityMapper.sprites.add(entity.id, entity)
        if (entity.decalComponent !== undefined)
            ResourceEntityMapper.decals.add(entity.id, entity)
        if (entity.uiComponent !== undefined)
            ResourceEntityMapper.ui.add(entity.id, entity)
        if (entity.atmosphereComponent !== undefined)
            ResourceEntityMapper.atmosphere.add(entity.id, entity)
        if (entity.lightProbeComponent !== undefined)
            ResourceEntityMapper.lightProbe.add(entity.id, entity)
        if (entity.cameraComponent !== undefined)
            ResourceEntityMapper.cameras.add(entity.id, entity)
        if (entity.uiComponent !== undefined)
            ResourceEntityMapper.ui.add(entity.id, entity)
        if (entity.meshComponent !== undefined) {
            ResourceEntityMapper.meshes.add(entity.id, entity)
            entity.meshComponent.updateComponentReferences()
        }


        if (COMPONENT_TRIGGER_UPDATE.indexOf(<COMPONENTS | undefined>previouslyRemoved) || !!COMPONENT_TRIGGER_UPDATE.find(v => entity.components.get(v) != null))
            LightsAPI.packageLights(false, true)
        VisibilityRenderer.needsUpdate = true
    }

    static removeEntity(entityToRemove: string | Entity) {
        const id = entityToRemove instanceof Entity ? entityToRemove.id : entityToRemove
        const entity = entityToRemove instanceof Entity ? entityToRemove : Engine.entities.map.get(entityToRemove)
        if (!entity || entity === Engine.loadedLevel) {
            return
        }
        entity.removeParent()
        EntityAPI.removeGroup(entity.children.array)
        if (!Engine.isDev)
            for (let i = 0; i < entity.scripts.length; i++) {
                const scr = entity.scripts[i]
                if (scr && scr.onDestruction)
                    scr.onDestruction()
            }

        Engine.entities.delete(id)

        ResourceEntityMapper.lights.delete(id)
        ResourceEntityMapper.sprites.delete(id)
        ResourceEntityMapper.cameras.delete(id)
        ResourceEntityMapper.ui.delete(id)
        ResourceEntityMapper.decals.delete(id)
        if (ResourceEntityMapper.meshes.has(id)) {
            ResourceEntityMapper.meshes.delete(id)
            MeshResourceMapper.unlinkEntityMesh(id)
            MaterialResourceMapper.unlinkEntityMaterial(id)
        }

        ResourceEntityMapper.atmosphere.delete(id)
        ResourceEntityMapper.lightProbe.delete(id)


        Engine.queryMap.delete(entity.queryKey)


        clearTimeout(EntityAPI.#timeout)
        EntityAPI.#timeout = setTimeout(() => {
            PhysicsAPI.removeRigidBody(entity)
            EntityWorkerAPI.removeEntity(entity)
            UIAPI.deleteUIEntity(entity)
            if (entity.lightComponent !== undefined || entity.meshComponent !== undefined) {
                LightsAPI.packageLights(false, true)
                VisibilityRenderer.needsUpdate = true
            }
        }, 25)
    }

    static removeGroup(entities: Entity[]) {
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i]
            const id = entity.id
            if (entity === Engine.loadedLevel)
                return

            if (entity.parent && !entities.includes(entity.parent))
                entity.removeParent()
            EntityAPI.removeGroup(entity.children.array)
            if (!Engine.isDev)
                for (let i = 0; i < entity.scripts.length; i++) {
                    const scr = entity.scripts[i]
                    if (scr && scr.onDestruction)
                        scr.onDestruction()
                }

            Engine.entities.delete(id)

            ResourceEntityMapper.lights.delete(id)
            ResourceEntityMapper.sprites.delete(id)
            ResourceEntityMapper.cameras.delete(id)
            ResourceEntityMapper.ui.delete(id)
            ResourceEntityMapper.decals.delete(id)
            if (ResourceEntityMapper.meshes.has(id)) {
                ResourceEntityMapper.meshes.delete(id)
                MeshResourceMapper.unlinkEntityMesh(id)
                MaterialResourceMapper.unlinkEntityMaterial(id)
            }

            ResourceEntityMapper.atmosphere.delete(id)
            ResourceEntityMapper.lightProbe.delete(id)


            Engine.queryMap.delete(entity.queryKey)

        }
        let didLightsChange
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i]
            PhysicsAPI.removeRigidBody(entity)
            EntityWorkerAPI.removeEntity(entity)
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

        parsedEntity.parentID = entity.parent

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
