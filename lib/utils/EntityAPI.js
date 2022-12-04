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
import VisibilityBuffer from "../../runtime/rendering/VisibilityBuffer";
import GPU from "../../GPU";


export default class EntityAPI {

    static addEntity(entity) {
        let target = entity || new Entity()
        Engine.entitiesMap.set(target.id, target)
        Engine.entities.push(target)

        TransformationPass.removeEntity(target)
        TransformationPass.registerEntity(target)
        EntityAPI.registerEntityComponents(target)
        VisibilityBuffer.needsUpdate = true
        return entity
    }

    static toggleVisibility(entity) {
        const loopHierarchy = (entity, newValue) => {
            for (let i = 0; i < entity.children.length; i++)
                loopHierarchy(entity.children[i], newValue)
            entity.active = newValue
        }
        loopHierarchy(entity, !entity.active)
        LightsAPI.packageLights(false, false)
        VisibilityBuffer.needsUpdate = true
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
        VisibilityBuffer.needsUpdate = true
    }

    static registerEntityComponents(entity) {
        if (Engine.environment !== ENVIRONMENT.DEV)
            PhysicsAPI.registerRigidBody(entity)
        const data = Engine.data
        Engine.queryMap.set(entity.queryKey, entity)


        let placementMap = Engine.dataEntity.get(entity.id) || {}
        if (Object.keys(placementMap).length > 0)
            Object.keys(placementMap).forEach(k => Engine.data[k] = Engine.data[k].filter(e => e !== entity))

        if (entity.components.get(COMPONENTS.POINT_LIGHT) && !placementMap.pointLights) {
            data.pointLights.push(entity)
            placementMap.pointLights = true
        }
        if (entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT) && !placementMap.pointLights) {
            data.directionalLights.push(entity)
            placementMap.directionalLights = true
        }

        if (entity.components.get(COMPONENTS.SPOTLIGHT) && !placementMap.pointLights) {
            data.spotLights.push(entity)
            placementMap.spotLights = true
        }

        if (entity.components.get(COMPONENTS.MESH) && !placementMap.pointLights) {
            data.meshes.push(entity)
            MaterialAPI.updateMap(entity.components.get(COMPONENTS.MESH))
            placementMap.meshes = true
        }

        if (entity.components.get(COMPONENTS.CAMERA) && !placementMap.pointLights) {
            data.cameras.push(entity)
            placementMap.cameras = true
        }

        if (entity.components.get(COMPONENTS.SKYLIGHT) && !placementMap.pointLights) {
            data.skylights.push(entity)
            placementMap.skylights = true
        }

        if (entity.components.get(COMPONENTS.SPRITE) && !placementMap.pointLights) {
            data.sprites.push(entity)
            placementMap.sprites = true
        }

        if (UIAPI.uiMountingPoint != null)
            UIAPI.createUIEntity(entity)

        if (entity.components.get(COMPONENTS.TERRAIN) != null && !placementMap.pointLights) {
            data.terrain.push(entity)
            placementMap.terrain = true
        }


        Engine.dataEntity.set(entity.id, placementMap)
        if (entity.components.get(COMPONENTS.POINT_LIGHT) || entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT) || entity.components.get(COMPONENTS.MESH))
            LightsAPI.packageLights(false, true)
        VisibilityBuffer.needsUpdate = true
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

        const placementMap = Engine.dataEntity.get(id)
        Object.keys(placementMap).forEach(k => Engine.data[k] = Engine.data[k].filter(e => e !== entity))

        Engine.entitiesMap.delete(id)
        Engine.entities = Engine.entities.filter(e => e.id !== id)

        PhysicsAPI.removeRigidBody(entity)

        TransformationPass.removeEntity(entity)
        UIAPI.deleteUIEntity(entity)
        Engine.queryMap.delete(entity.queryKey)

        if (entity.__materialRef) {
            const old = MaterialAPI.entityMaterial.get(entity.__materialRef.id)
            delete old[entity.id]
            entity.__materialRef = undefined
        }

        if (entity.components.get(COMPONENTS.POINT_LIGHT) || entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT) || entity.components.get(COMPONENTS.MESH))
            LightsAPI.packageLights(false, true)
        VisibilityBuffer.needsUpdate = true
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
            if (k === COMPONENTS.DIRECTIONAL_LIGHT)
                component.changed = true
        }
        parsedEntity.changed = true
        VisibilityBuffer.needsUpdate = true

        return parsedEntity
    }
}
