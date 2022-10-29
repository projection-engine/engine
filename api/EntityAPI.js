import COMPONENTS from "../static/COMPONENTS.js"
import {packageDirectionalLights, packagePointLights} from "../utils/package-lights";
import Engine from "../Engine";
import Component from "../templates/components/Component";
import ConsoleAPI from "./ConsoleAPI";
import QueryAPI from "./utils/QueryAPI";
import InputEventsAPI from "./utils/InputEventsAPI";
import CameraAPI from "./CameraAPI";
import SpecularProbePass from "../runtime/renderers/SpecularProbePass";
import DiffuseProbePass from "../runtime/renderers/DiffuseProbePass";
import ENVIRONMENT from "../static/ENVIRONMENT";
import TransformationPass from "../runtime/TransformationPass";
import UIAPI from "./UIAPI";
import GBuffer from "../runtime/renderers/GBuffer";
import PhysicsAPI from "./PhysicsAPI";
import Entity from "../instances/Entity";
import TransformationAPI from "./math/TransformationAPI";
import CubeMapAPI from "./CubeMapAPI";
import GPUController from "../GPUController";
import GPUResources from "../GPUResources";
import ENTITY_TYPED_ATTRIBUTES from "../static/ENTITY_TYPED_ATTRIBUTES";


let lightTimeout
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
            EntityAPI.packageLights(false, true)
    }

    static removeEntity(id) {
        const entity = QueryAPI.getEntityByID(id)
        if (!entity)
            return
        const placementMap = Engine.dataEntity.get(id)
        Object.keys(placementMap).forEach(k => Engine.data[k] = Engine.data[k].filter(e => e !== entity))

        Engine.entitiesMap.delete(id)
        Engine.entities = Engine.entities.filter(e => e.id !== id)

        PhysicsAPI.removeRigidBody(entity)
        EntityAPI.#removeUnusedProbes(entity)

        TransformationPass.removeEntity(entity)
        UIAPI.deleteUIEntity(entity)
        Engine.queryMap.delete(entity.queryKey)

        if (entity.components.get(COMPONENTS.POINT_LIGHT) || entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT) || entity.components.get(COMPONENTS.MESH))
            EntityAPI.packageLights(false, true)
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

    static packageLights(keepOld, force) {
        const updateDeferred = () => {
            const {
                directionalLightsData,
                dirLightPOV,
                pointLightData
            } = Engine.data

            const U = GBuffer.deferredUniforms
            U.directionalLightsData = directionalLightsData
            U.dirLightPOV = dirLightPOV
            U.pointLightData = pointLightData
        }
        if (force) {
            packagePointLights(keepOld)
            packageDirectionalLights(keepOld)
            updateDeferred()
            return
        }
        clearTimeout(lightTimeout)
        lightTimeout = setTimeout(() => {
            packagePointLights(keepOld)
            packageDirectionalLights(keepOld)
            updateDeferred()

        }, 50)

    }


    static linkScript(data, entity, scriptID) {
        const found = entity.scripts.findIndex(s => s.id === scriptID)
        try {
            const generator = new Function("GPUResources, GPUController, PhysicsAPI, UIAPI, TransformationAPI, EntityAPI, InputEventsAPI, ConsoleAPI, Component, COMPONENTS, CameraAPI, QueryAPI", data.toString())

            try {
                const Instance = generator(GPUResources, GPUController, PhysicsAPI, UIAPI, TransformationAPI, EntityAPI, InputEventsAPI, ConsoleAPI, Component, COMPONENTS, CameraAPI, QueryAPI)
                const newClass = new Instance(entity)
                newClass.entity = entity

                if (found > -1) {
                    const ref = entity.scripts[found]
                    Object.entries(ref).forEach(([key, value]) => {
                        if (typeof value !== "function")
                            newClass[key] = value
                    })
                    entity.scripts[found] = newClass
                } else
                    entity.scripts.push(newClass)

                newClass.id = scriptID
                return true
            } catch (runtimeError) {
                console.error(runtimeError)
                return false
            }
        } catch (syntaxError) {
            console.error(syntaxError)
            return false
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
                const componentValue = keys[i]
                if (componentValue.includes("__") || componentValue.includes("#") || componentValue === "_props" || componentValue === "_name")
                    continue
                component[componentValue] = entity.components[k][componentValue]
            }
            if (k === COMPONENTS.DIRECTIONAL_LIGHT)
                component.changed = true
        }
        parsedEntity.changed = true
        return parsedEntity
    }
}
