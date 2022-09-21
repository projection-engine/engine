import COMPONENTS from "../../static/COMPONENTS.json"
import {packageDirectionalLights, packagePointLights} from "../utils/package-lights";
import Engine from "../Engine";
import Component from "../components/Component";
import ConsoleAPI from "./ConsoleAPI";
import QueryAPI from "./utils/QueryAPI";
import InputEventsAPI from "./utils/InputEventsAPI";
import CameraAPI from "./camera/CameraAPI";
import SpecularProbePass from "../passes/rendering/SpecularProbePass";
import DiffuseProbePass from "../passes/rendering/DiffuseProbePass";
import ENVIRONMENT from "../../static/ENVIRONMENT";
import PhysicsPass from "../passes/math/PhysicsPass";
import WorkerController from "../workers/WorkerController";
import UIAPI from "./UIAPI";
import {TransformationAPI} from "../../production";


let lightTimeout
export default class EntityAPI {
    static lightsChanged = []

    static addEntity(entity) {
        Engine.entitiesMap.set(entity.id, entity)
        Engine.entities.push(entity)
        WorkerController.registerEntity(entity)
        EntityAPI.registerEntityComponents(entity)
    }

    static linkEntities(child, parent) {
        if (child.parent != null) {
            WorkerController.updateEntityLinks(child, child.parent)
            child.parent.children = child.parent.children.filter(c => c !== child)
            child.parent = undefined
        }
        if (parent != null) {
            child.parent = parent
            parent.children.push(child)
            WorkerController.updateEntityLinks(child, parent)
        }
    }

    static registerEntityComponents(entity) {
        if (Engine.environment !== ENVIRONMENT.DEV)
            PhysicsPass.registerRigidBody(entity)
        const data = Engine.data
        Engine.queryMap.set(entity.queryKey, entity)


        let placementMap = Engine.dataEntity.get(entity.id) || {}
        if (Object.keys(placementMap).length > 0)
            Object.keys(placementMap).forEach(k => Engine.data[k] = Engine.data[k].filter(e => e !== entity))
        if (entity.components.get(COMPONENTS.POINT_LIGHT)) {
            data.pointLights.push(entity)
            placementMap.pointLights = true
        }
        if (entity.components.get(COMPONENTS.MESH)) {
            data.meshes.push(entity)
            placementMap.meshes = true
        }
        if (entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT)) {
            data.directionalLights.push(entity)
            placementMap.directionalLights = true
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

        Engine.dataEntity.set(entity.id, placementMap)
        if (entity.components.get(COMPONENTS.POINT_LIGHT) != null || entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT) != null)
            EntityAPI.packageLights()
    }

    static removeEntity(id) {
        const entity = Engine.entitiesMap.get(id)
        if (!entity)
            return
        const placementMap = Engine.dataEntity.get(id)
        Object.keys(placementMap).forEach(k => Engine.data[k] = Engine.data[k].filter(e => e !== entity))

        Engine.entitiesMap.delete(id)
        Engine.entities = Engine.entities.filter(e => e.id !== id)

        PhysicsPass.removeRigidBody(entity)
        EntityAPI.#removeUnusedProbes(entity)
        if (entity.components.get(COMPONENTS.POINT_LIGHT) != null || entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT) != null)
            EntityAPI.packageLights()

        WorkerController.removeEntity(entity)
        UIAPI.deleteUIEntity(entity)
        Engine.queryMap.delete(entity.queryKey)
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
        if (force) {
            packagePointLights(keepOld)
            packageDirectionalLights(keepOld)
            return
        }
        clearTimeout(lightTimeout)
        lightTimeout = setTimeout(() => {
            packagePointLights(keepOld)
            packageDirectionalLights(keepOld)
        }, 50)

    }

    static linkScript(data, entity, scriptID, src) {
        const found = entity.scripts.findIndex(s => s.id === scriptID)
        try {
            const generator = new Function("UIAPI, TransformationAPI, EntityAPI, InputEventsAPI, ConsoleAPI, Component, COMPONENTS, CameraAPI, QueryAPI", data.toString())

            try {
                const Instance = generator(UIAPI, TransformationAPI, EntityAPI, InputEventsAPI, ConsoleAPI, Component, COMPONENTS, CameraAPI, QueryAPI)
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
