import COMPONENTS from "../../templates/COMPONENTS"
import Engine from "../../Engine";
import QueryAPI from "./QueryAPI";

import ENVIRONMENT from "../../static/ENVIRONMENT";
import EntityWorkerAPI from "./EntityWorkerAPI";
import UIAPI from "../rendering/UIAPI";
import PhysicsAPI from "../rendering/PhysicsAPI";
import Entity from "../../instances/Entity";
import ENTITY_TYPED_ATTRIBUTES from "../../static/ENTITY_TYPED_ATTRIBUTES";
import LightsAPI from "./LightsAPI";
import MaterialAPI from "../rendering/MaterialAPI";
import VisibilityRenderer from "../../runtime/VisibilityRenderer";
import GPU from "../../GPU";
import MutableObject from "../../MutableObject";
import ResourceEntityMapper from "../ResourceEntityMapper";

const COMPONENT_TRIGGER_UPDATE = [COMPONENTS.LIGHT, COMPONENTS.MESH]
export default class EntityAPI {
    static addEntity(entity?: Entity): Entity {
        if(entity && Engine.entities.has(entity.id))
            return Engine.entities.map.get(entity.id)
        let target = entity || new Entity()

        Engine.entities.add(target.id, target)
        EntityWorkerAPI.removeEntity(target)
        EntityWorkerAPI.registerEntity(target)
        EntityAPI.registerEntityComponents(target)

        VisibilityRenderer.needsUpdate = true

        return entity
    }

    static toggleVisibility(entity: Entity): void {
        const newValue = !entity.active
        let needsLightUpdate = false, needsVisibilityUpdate = false
        const loopHierarchy = (entity) => {
            for (let i = 0; i < entity.children.length; i++)
                loopHierarchy(entity.children[i])
            entity.active = newValue
            needsVisibilityUpdate = needsVisibilityUpdate || entity.meshComponent !== undefined
            needsLightUpdate = needsLightUpdate || entity.meshComponent !== undefined || entity.lightComponent !== undefined
        }
        loopHierarchy(entity)
        if (needsLightUpdate)
            LightsAPI.packageLights(false, true)
        VisibilityRenderer.needsUpdate = needsVisibilityUpdate
    }

    static linkEntities(child: Entity, parent?: Entity | undefined): void {

        if (child.parent != null) {
            EntityWorkerAPI.updateEntityLinks(child, child.parent)
            child.parent.children = child.parent.children.filter(c => c !== child)
            child.parent = undefined
        }

        if (parent != null) {
            child.parent = parent
            parent.children.push(child)
            EntityWorkerAPI.updateEntityLinks(child, parent)
        }

        VisibilityRenderer.needsUpdate = true
    }

    static registerEntityComponents(entity: Entity, previouslyRemoved?: string): void {

        if (!Entity.isRegistered(entity))
            return
        if (Engine.environment !== ENVIRONMENT.DEV)
            PhysicsAPI.registerRigidBody(entity)
        Engine.queryMap.set(entity.queryKey, entity)
        if (UIAPI.uiMountingPoint != null)
            UIAPI.createUIEntity(entity)

        if (entity.lightComponent !== undefined)
            ResourceEntityMapper.lights.add(entity.id, entity)
        if (entity.spriteComponent !== undefined)
            ResourceEntityMapper.sprites.add(entity.id, entity)
        if (entity.decalComponent !== undefined)
            ResourceEntityMapper.decals.add(entity.id, entity)
        if (entity.meshComponent !== undefined) {
            ResourceEntityMapper.meshesToDraw.add(entity.id, entity)
            MaterialAPI.updateMap(entity.meshComponent)
        }


        if (COMPONENT_TRIGGER_UPDATE.indexOf(<COMPONENTS | undefined>previouslyRemoved) || !!COMPONENT_TRIGGER_UPDATE.find(v => entity.components.get(v) != null))
            LightsAPI.packageLights(false, true)
        VisibilityRenderer.needsUpdate = true
    }

    static removeEntity(id: string) {

        const entity = Engine.entities.map.get(id)
        if (!entity)
            return

        if (GPU.activeSkylightEntity === entity)
            GPU.activeSkylightEntity = undefined

        if (!Engine.isDev)
            for (let i = 0; i < entity.scripts.length; i++) {
                const scr = entity.scripts[i]
                if (scr && scr.onDestruction)
                    scr.onDestruction()
            }

        Engine.entities.delete(id)

        ResourceEntityMapper.lights.delete(id)
        ResourceEntityMapper.sprites.delete(id)
        ResourceEntityMapper.decals.delete(id)
        console.trace(ResourceEntityMapper.meshesToDraw.has(id))
        ResourceEntityMapper.meshesToDraw.delete(id)
        console.trace(ResourceEntityMapper.meshesToDraw.has(id))

        setTimeout(() => console.trace(ResourceEntityMapper.meshesToDraw.has(id)), 250)
        PhysicsAPI.removeRigidBody(entity)
        EntityWorkerAPI.removeEntity(entity)
        UIAPI.deleteUIEntity(entity)
        Engine.queryMap.delete(entity.queryKey)

        if (entity.materialRef) {
            const old = ResourceEntityMapper.entityMaterial.get(entity.materialRef.id)
            delete old[id]
            entity.materialRef = undefined
        }

        if (entity.lightComponent !== undefined || entity.meshComponent !== undefined) {
            LightsAPI.packageLights(false, true)
            VisibilityRenderer.needsUpdate = true
        }
    }


    static parseEntityObject(entity: MutableObject, asNew?: boolean): Entity {
        const parsedEntity = new Entity()
        const keys = Object.keys(entity)

        for (let i = 0; i < keys.length; i++) {
            try {
                const k = keys[i]
                if (k !== "components" && k !== "parent" && k !== "matrix" && !ENTITY_TYPED_ATTRIBUTES.includes(k) && k !== "_props")
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

        parsedEntity.parent = undefined
        parsedEntity.parentCache = entity.parent
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
        VisibilityRenderer.needsUpdate = true
        if (asNew)
            parsedEntity.id = crypto.randomUUID()
        parsedEntity.name = entity.name
        parsedEntity.active = entity.active
        return parsedEntity
    }
}
