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

function toObject(classes) {
    const res = {}, s = classes.length
    for (let i = 0; i < s; i++)
        res[classes[i].id] = classes[i]

    return res
}

export default class BundlerAPI {

    static addEntity(entity) {
        Engine.entitiesMap.set(entity.id, entity)
        Engine.entities.push(entity)
        PhysicsPass.registerRigidBody(entity)

        const data = Engine.data
        Engine.queryMap.set(entity.queryKey, entity)
        let onMap = Engine.dataEntity.get(entity.id) || {}
        if (entity.components.get(COMPONENTS.POINT_LIGHT)) {
            data.pointLights.push(entity)
            onMap.pointLights = true
        }
        if (entity.components.get(COMPONENTS.MESH)) {
            data.meshes.push(entity)
            onMap.meshes = true
        }
        if (entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT)) {
            data.directionalLights.push(entity)
            onMap.directionalLights = true
        }
        if (entity.components.get(COMPONENTS.PROBE) && entity.components.get(COMPONENTS.PROBE).specularProbe) {
            data.specularProbes.push(entity)
            onMap.specularProbes = true
        }
        if (entity.components.get(COMPONENTS.CAMERA)) {
            data.cameras.push(entity)
            onMap.cameras = true
        }
        if (entity.components.get(COMPONENTS.PROBE) && !entity.components.get(COMPONENTS.PROBE).specularProbe) {
            data.diffuseProbes.push(entity)
            onMap.diffuseProbes = true
        }
        if (entity.components.get(COMPONENTS.SPRITE)) {
            data.sprites.push(entity)
            onMap.sprites = true
        }


        Engine.dataEntity.set(entity.id, onMap)
        if (entity.components.get(COMPONENTS.POINT_LIGHT) != null || entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT) != null)
            BundlerAPI.packageLights()

        WorkerController.registerEntity(entity)
    }

    static removeEntity(id) {

        const entity = Engine.entitiesMap.get(id)
        console.log(id, entity)
        if(!entity)
            return
        const onMap = Engine.dataEntity.get(id)
        Object.keys(onMap).forEach(k => Engine.data[k] = Engine.data[k].filter(e => e !== entity))

        Engine.entitiesMap.delete(id)
        Engine.entities = Engine.entities.filter(e => e.id !== id)

        PhysicsPass.removeRigidBody(entity)

        BundlerAPI.removeUnusedProbes()
        if (entity.components.get(COMPONENTS.POINT_LIGHT) != null || entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT) != null)
            BundlerAPI.packageLights()

        WorkerController.removeEntity(entity)
    }


    static removeUnusedProbes() {
        const data = Engine.data,
            entities = Engine.entities

        const sP = toObject(data.specularProbes), dP = toObject(data.diffuseProbes)
        const specularProbes = SpecularProbePass.specularProbes
        const diffuseProbes = DiffuseProbePass.diffuseProbes
        const s = SpecularProbePass.probes
        const d = DiffuseProbePass.probes

        Object.keys(specularProbes).forEach(k => {
            if (!sP[k]) {
                const entity = entities.find(e => e.id === k)
                if (!entity) {
                    specularProbes[k].delete()
                    delete specularProbes[k]
                }
                delete s[k]
            }
        })

        Object.keys(diffuseProbes).forEach(k => {
            if (!dP[k]) {
                const entity = entities.find(e => e.id === k)
                if (!entity) {
                    diffuseProbes[k].delete()
                    delete diffuseProbes[k]
                }
                delete d[k]
            }
        })
    }

    static packageLights(keepOld) {
        packagePointLights(keepOld)
        packageDirectionalLights(keepOld)
    }

    static linkScript(data, entity, scriptID, src) {
        const found = entity.scripts.findIndex(s => s.id === scriptID)
        try {
            const generator = new Function("InputEventsAPI, ConsoleAPI, Component, COMPONENTS, CameraAPI, QueryAPI", data.toString())
            try {

                const Instance = generator(InputEventsAPI, ConsoleAPI, Component, COMPONENTS, CameraAPI, QueryAPI)
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
                ConsoleAPI.error(`${runtimeError.name}: ${runtimeError.message}. (${src})`)
                return false
            }
        } catch (syntaxError) {
            ConsoleAPI.error(`${syntaxError.name}: ${syntaxError.message}. (${src})`)
            console.error(syntaxError)
            return false
        }
    }

    static framebufferToImage(fbo, w = 300, h = 300) {
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const context = canvas.getContext("2d")
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, fbo)
        let data = new Float32Array(w * h * 4)
        gpu.readPixels(0, 0, w, h, gpu.RGBA, gpu.FLOAT, data)
        for (let i = 0; i < data.length; i += 4) {
            data[i] *= 255
            data[i + 1] *= 255
            data[i + 2] *= 255
            data[i + 3] = 255
        }

        const imageData = context.createImageData(w, h)
        imageData.data.set(data)
        context.putImageData(imageData, 0, 0)
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null)
        data = canvas.toDataURL()
        return data
    }
}
