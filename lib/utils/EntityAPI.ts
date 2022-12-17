import COMPONENTS from "../../static/COMPONENTS.js"
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
import VisibilityRenderer from "../../runtime/rendering/VisibilityRenderer";
import GPU from "../GPU";
import SpriteRenderer from "../../runtime/rendering/SpriteRenderer";
import MutableObject from "../../MutableObject";
import {v4} from "uuid";

const COMPONENT_TRIGGER_UPDATE = [COMPONENTS.LIGHT, COMPONENTS.MESH]
export default class EntityAPI {
    static addEntity(entity?: Entity): Entity {
        let target = entity || new Entity()

        Engine.entitiesMap.set(target.id, target)
        Engine.entities.push(target)

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
            needsVisibilityUpdate = needsVisibilityUpdate || entity.__hasMesh
            needsLightUpdate = needsLightUpdate || entity.__hasMesh || entity.__hasLight
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

        if (entity.__hasLight)
            LightsAPI.lights.add(entity.id, entity)
        if (entity.__hasSprite)
            SpriteRenderer.sprites.add(entity.id, entity)
        if (entity.__hasMesh) {
            VisibilityRenderer.meshesToDraw.add(entity.id, entity)
            MaterialAPI.updateMap(entity.components.get(COMPONENTS.MESH))
        }


        if (COMPONENT_TRIGGER_UPDATE.indexOf(previouslyRemoved) || !!COMPONENT_TRIGGER_UPDATE.find(v => entity.components.get(v) != null))
            LightsAPI.packageLights(false, true)
        VisibilityRenderer.needsUpdate = true
    }

    static removeEntity(id: string): void {
        const entity = QueryAPI.getEntityByID(id)
        if (entity === undefined)
            return

        if (GPU.activeSkylightEntity === entity)
            GPU.activeSkylightEntity = undefined

        if (!Engine.isDev)
            for (let i = 0; i < entity.scripts.length; i++) {
                const scr = entity.scripts[i]
                if (scr && scr.onDestruction)
                    scr.onDestruction()
            }

        Engine.entitiesMap.delete(id)
        Engine.entities = Engine.entities.filter(e => e.id !== id)


        if (entity.__hasLight)
            LightsAPI.lights.delete(entity.id)
        if (entity.__hasSprite)
            SpriteRenderer.sprites.delete(entity.id)
        if (entity.__hasMesh)
            VisibilityRenderer.meshesToDraw.delete(entity.id)

        PhysicsAPI.removeRigidBody(entity)

        EntityWorkerAPI.removeEntity(entity)
        UIAPI.deleteUIEntity(entity)
        Engine.queryMap.delete(entity.queryKey)

        if (entity.__materialRef) {
            const old = MaterialAPI.entityMaterial.get(entity.__materialRef.id)
            delete old[entity.id]
            entity.__materialRef = undefined
        }

        if (entity.__hasLight || entity.__hasMesh) {
            LightsAPI.packageLights(false, true)
            VisibilityRenderer.needsUpdate = true
        }
    }


    static parseEntityObject(entity: MutableObject, asNew?: boolean): Entity {
        const parsedEntity = new Entity(asNew ? v4() : entity.id, entity.name, entity.active)
        const keys = Object.keys(entity)

        for (let i = 0; i < keys.length; i++) {
            const k = keys[i]
            if (k !== "components" && k !== "parent" && k !== "matrix" && !ENTITY_TYPED_ATTRIBUTES.includes(k) && k !== "_props")
                parsedEntity[k] = entity[k]
        }

        for (let i = 0; i < ENTITY_TYPED_ATTRIBUTES.length; i++) {
            const key = ENTITY_TYPED_ATTRIBUTES[i]
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
                let componentValue = keys[i]
                if (componentValue.includes("__") || componentValue.includes("#") || componentValue === "_props" || componentValue === "_name")
                    continue
                if (k === COMPONENTS.MESH && (componentValue === "_meshID" || componentValue === "_materialID")) {
                    component[componentValue.replace("_", "")] = entity.components[k][componentValue]
                } else
                    component[componentValue] = entity.components[k][componentValue]
            }
        }
        parsedEntity.changed = true
        VisibilityRenderer.needsUpdate = true

        return parsedEntity
    }
}
