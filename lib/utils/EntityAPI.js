import COMPONENTS from "../../static/COMPONENTS.js"
import Engine from "../../Engine";
import QueryAPI from "./QueryAPI";
import SpecularProbePass from "../../runtime/rendering/SpecularProbePass";
import DiffuseProbePass from "../../runtime/rendering/DiffuseProbePass";
import ENVIRONMENT from "../../static/ENVIRONMENT";
import TransformationPass from "../../runtime/misc/TransformationPass";
import UIAPI from "../rendering/UIAPI";
import PhysicsAPI from "../rendering/PhysicsAPI";
import Entity from "../../instances/Entity";
import CubeMapAPI from "../rendering/CubeMapAPI";
import ENTITY_TYPED_ATTRIBUTES from "../../static/ENTITY_TYPED_ATTRIBUTES";
import LightsAPI from "../rendering/LightsAPI";
import MaterialAPI from "../rendering/MaterialAPI";
import MeshComponent from "../../templates/components/MeshComponent";


export default class EntityAPI {

    static addEntity(entity) {
        let target = entity || new Entity()
        Engine.entitiesMap.set(target.id, target)
        Engine.entities.push(target)

        TransformationPass.removeEntity(target)
        TransformationPass.registerEntity(target)
        EntityAPI.registerEntityComponents(target)

        return entity
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
    }

    static registerEntityComponents(entity) {
        if (Engine.environment !== ENVIRONMENT.DEV)
            PhysicsAPI.registerRigidBody(entity)
        const data = Engine.data
        Engine.queryMap.set(entity.queryKey, entity)


        let placementMap = Engine.dataEntity.get(entity.id) || {}
        if (Object.keys(placementMap).length > 0)
            Object.keys(placementMap).forEach(k => Engine.data[k] = Engine.data[k].filter(e => e !== entity))
        if (entity.components.get(COMPONENTS.POINT_LIGHT)) {
            data.pointLights.push(entity)
            placementMap.pointLights = true
        }
        if (entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT)) {
            data.directionalLights.push(entity)
            placementMap.directionalLights = true
        }

        if (entity.components.get(COMPONENTS.MESH)) {
            data.meshes.push(entity)
            MeshComponent.updateMap(entity.components.get(COMPONENTS.MESH))
            placementMap.meshes = true
        }

        if (entity.components.get(COMPONENTS.PROBE) && entity.components.get(COMPONENTS.PROBE).specularProbe) {
            data.specularProbes.push(entity)
            placementMap.specularProbes = true
        }
        if (entity.components.get(COMPONENTS.CAMERA)) {
            data.cameras.push(entity)
            placementMap.cameras = true
        }
        if (entity.components.get(COMPONENTS.PROBE) && !entity.components.get(COMPONENTS.PROBE).specularProbe) {
            data.diffuseProbes.push(entity)
            placementMap.diffuseProbes = true
        }
        if (entity.components.get(COMPONENTS.SPRITE)) {
            data.sprites.push(entity)
            placementMap.sprites = true
        }
        if (UIAPI.uiMountingPoint != null)
            UIAPI.createUIEntity(entity)

        if (!entity.components.get(COMPONENTS.PROBE))
            EntityAPI.#removeUnusedProbes(entity)

        if (entity.components.get(COMPONENTS.TERRAIN) != null) {
            data.terrain.push(entity)
            placementMap.terrain = true
        }

        Engine.dataEntity.set(entity.id, placementMap)
        if (entity.components.get(COMPONENTS.POINT_LIGHT) || entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT) || entity.components.get(COMPONENTS.MESH))
            LightsAPI.packageLights(false, true)
    }

    static removeEntity(id) {
        const entity = QueryAPI.getEntityByID(id)
        if (!entity)
            return

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
        EntityAPI.#removeUnusedProbes(entity)

        TransformationPass.removeEntity(entity)
        UIAPI.deleteUIEntity(entity)
        Engine.queryMap.delete(entity.queryKey)

        const meshComponent = entity.components.get(COMPONENTS.MESH)
        if (meshComponent && meshComponent.__mapSource.index !== undefined)
            MaterialAPI[meshComponent.__mapSource.type] = MaterialAPI[meshComponent.__mapSource.type].filter(e => e.entity !== entity)
        if (entity.components.get(COMPONENTS.POINT_LIGHT) || entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT) || entity.components.get(COMPONENTS.MESH))
            LightsAPI.packageLights(false, true)
    }


    static #removeUnusedProbes(entity) {
        const specularProbes = SpecularProbePass.specularProbes
        const diffuseProbes = DiffuseProbePass.diffuseProbes
        const s = SpecularProbePass.probes
        const d = DiffuseProbePass.probes

        if (specularProbes[entity.id] != null) {
            delete s[entity.id]
            CubeMapAPI.delete(specularProbes[entity.id])
            delete specularProbes[entity.id]
        }

        if (diffuseProbes[entity.id] != null) {
            delete d[entity.id]
            CubeMapAPI.delete(diffuseProbes[entity.id])
            delete diffuseProbes[entity.id]
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
            if (k === COMPONENTS.DIRECTIONAL_LIGHT)
                component.changed = true
        }
        parsedEntity.changed = true
        return parsedEntity
    }
}
