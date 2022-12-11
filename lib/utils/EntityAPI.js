import COMPONENTS from "../../static/COMPONENTS.js"
import Engine from "../../Engine";
import QueryAPI from "./QueryAPI";

import ENVIRONMENT from "../../static/ENVIRONMENT";
import TransformationPass from "../../runtime/misc/TransformationPass";
import UIAPI from "../rendering/UIAPI";
import PhysicsAPI from "../rendering/PhysicsAPI";
import Entity from "../../instances/Entity";
import ENTITY_TYPED_ATTRIBUTES from "../../static/ENTITY_TYPED_ATTRIBUTES";
import LightsAPI from "../rendering/LightsAPI";
import MaterialAPI from "../rendering/MaterialAPI";
import VisibilityRenderer from "../../runtime/rendering/VisibilityRenderer";
import GPU from "../../GPU";
import DynamicMap from "../../DynamicMap";
import SpriteRenderer from "../../runtime/rendering/SpriteRenderer";

const COMPONENT_TRIGGER_UPDATE = [COMPONENTS.LIGHT, COMPONENTS.MESH]
export default class EntityAPI {
    static addEntity(entity) {
        let target = entity || new Entity()
        Engine.entitiesMap.set(target.id, target)
        Engine.entities.push(target)

        TransformationPass.removeEntity(target)
        TransformationPass.registerEntity(target)
        EntityAPI.registerEntityComponents(target)
        VisibilityRenderer.needsUpdate = true
        return entity
    }

    static toggleVisibility(entity) {
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

    static linkEntities(child, parent) {

        if (child.parent != null) {
            TransformationPass.updateEntityLinks(child, child.parent)
            child.parent.children = child.parent.children.filter(c => c !== child)
            child.parent = undefined
        }

        if (parent != null) {
            child.parent = parent
            parent.children.push(child)
            TransformationPass.updateEntityLinks(child, parent)
        }

        VisibilityRenderer.needsUpdate = true
    }

    static registerEntityComponents(entity, previouslyRemoved) {
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

    static removeEntity(id) {
        const entity = QueryAPI.getEntityByID(id)
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

        Engine.entitiesMap.delete(id)
        Engine.entities = Engine.entities.filter(e => e.id !== id)

        if (entity.__hasSpotLight)
            LightsAPI.spotLights.delete(entity.id)
        if (entity.__hasDirectionalLight)
            LightsAPI.directionalLights.delete(entity.id)
        if (entity.__hasPointLight)
            LightsAPI.pointLights.delete(entity.id)
        if (entity.__hasSprite)
            SpriteRenderer.sprites.delete(entity.id)
        if (entity.__hasMesh)
            VisibilityRenderer.meshesToDraw.delete(entity.id)

        PhysicsAPI.removeRigidBody(entity)

        TransformationPass.removeEntity(entity)
        UIAPI.deleteUIEntity(entity)
        Engine.queryMap.delete(entity.queryKey)

        if (entity.__materialRef) {
            const old = MaterialAPI.entityMaterial.get(entity.__materialRef.id)
            delete old[entity.id]
            entity.__materialRef = undefined
        }

        if (entity.__hasPointLight || entity.__hasDirectionalLight || entity.__hasSpotLight || entity.__hasMesh) {
            LightsAPI.packageLights(false, true)
            VisibilityRenderer.needsUpdate = true
        }
    }


    static parseEntityObject(entity) {
        const parsedEntity = new Entity(entity.id, entity.name, entity.active)
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
