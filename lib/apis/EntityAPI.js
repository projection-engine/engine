import COMPONENTS from "../../static/COMPONENTS.js"
import {packageDirectionalLights, packagePointLights} from "../../utils/package-lights";
import Engine from "../../Engine";
import Component from "../components/Component";
import ConsoleAPI from "./ConsoleAPI";
import QueryAPI from "./utils/QueryAPI";
import InputEventsAPI from "./utils/InputEventsAPI";
import CameraAPI from "./CameraAPI";
import SpecularProbePass from "../passes/SpecularProbePass";
import DiffuseProbePass from "../passes/DiffuseProbePass";
import ENVIRONMENT from "../../static/ENVIRONMENT";
import MovementWorker from "../../workers/movement/MovementWorker";
import UIAPI from "./UIAPI";
import DeferredPass from "../passes/DeferredPass";
import PhysicsAPI from "./PhysicsAPI";
import Entity from "../instances/Entity";
import TransformationAPI from "./math/TransformationAPI";


let lightTimeout
export default class EntityAPI {

    static addEntity(entity) {
        let target = entity || new Entity()
        Engine.entitiesMap.set(target.id, target)
        Engine.entities.push(target)

        MovementWorker.removeEntity(target)
        MovementWorker.registerEntity(target)
        EntityAPI.registerEntityComponents(target)

        return entity
    }

    static linkEntities(child, parent) {
        if (child.parent != null) {
            MovementWorker.updateEntityLinks(child, child.parent)
            child.parent.children = child.parent.children.filter(c => c !== child)
            child.parent = undefined
        }
        if (parent != null) {
            child.parent = parent
            parent.children.push(child)
            MovementWorker.updateEntityLinks(child, parent)
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

        MovementWorker.removeEntity(entity)
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
            specularProbes[entity.id].delete()
            delete specularProbes[entity.id]
        }

        if (diffuseProbes[entity.id] != null) {
            delete d[entity.id]
            diffuseProbes[entity.id].delete()
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

            const U = DeferredPass.deferredUniforms
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
            const generator = new Function("PhysicsAPI, UIAPI, TransformationAPI, EntityAPI, InputEventsAPI, ConsoleAPI, Component, COMPONENTS, CameraAPI, QueryAPI", data.toString())

            try {
                const Instance = generator(PhysicsAPI, UIAPI, TransformationAPI, EntityAPI, InputEventsAPI, ConsoleAPI, Component, COMPONENTS, CameraAPI, QueryAPI)
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


}
