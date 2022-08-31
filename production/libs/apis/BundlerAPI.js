import COMPONENTS from "../../data/COMPONENTS"
import toObject from "../../utils/to-object"
import {packageDirectionalLights, packagePointLights} from "../../utils/package-lights";
import materialEntityMapper from "../../utils/material-entity-mapper";
import RendererController from "../../controllers/RendererController";
import Component from "../../templates/Component";
import ConsoleAPI from "./ConsoleAPI";
import QueryAPI from "./QueryAPI";
import InputEventsAPI from "./InputEventsAPI";
import CameraAPI from "./CameraAPI";
import SpecularProbePass from "../../templates/passes/SpecularProbePass";
import DiffuseProbePass from "../../templates/passes/DiffuseProbePass";


export default class BundlerAPI {


    static build(params) {
        const renderer = window.renderer,
            materials = [...renderer.materials, RendererController.fallbackMaterial]
        const entities = Array.from(RendererController.entitiesMap.values())

        const attributes = {...params}
        const data = {

            pointLights: [],
            meshes: [],
            directionalLights: [],
            specularProbes: [],
            cameras: [],
            diffuseProbes: [],

            materials: toObject(materials),
            materialEntityMap: materialEntityMapper(entities, materials)
        }

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i]
            RendererController.queryMap.set(entity.queryKey, entity)
            if (entity.components[COMPONENTS.POINT_LIGHT])
                data.pointLights.push(entity)
            if (entity.components[COMPONENTS.MESH])
                data.meshes.push(entity)
            if (entity.components[COMPONENTS.DIRECTIONAL_LIGHT])
                data.directionalLights.push(entity)
            if (entity.components[COMPONENTS.PROBE] && entity.components[COMPONENTS.PROBE].specularProbe)
                data.specularProbes.push(entity)
            if (entity.components[COMPONENTS.CAMERA])
                data.cameras.push(entity)
            if (entity.components[COMPONENTS.PROBE] && !entity.components[COMPONENTS.PROBE].specularProbe)
                data.diffuseProbes.push(entity)
        }

        RendererController.params = attributes
        RendererController.data = data

        renderer.entities = entities


        BundlerAPI.updateCamera()
        BundlerAPI.removeUnusedProbes()
        BundlerAPI.packageLights()
        RendererController.then = performance.now()
    }

    // TODO - REMOVE THIS METHOD
    static updateCamera() {
        const params = RendererController.params
        CameraAPI.metadata.zNear = params.zNear
        CameraAPI.metadata.zFar = params.zFar
        CameraAPI.metadata.fov = params.fov

        CameraAPI.metadata.distortion = params.distortion
        CameraAPI.metadata.distortionStrength = params.distortionStrength
        CameraAPI.metadata.chromaticAberration = params.chromaticAberration
        CameraAPI.metadata.chromaticAberrationStrength = params.chromaticAberrationStrength
        CameraAPI.metadata.filmGrain = params.filmGrain
        CameraAPI.metadata.filmGrainStrength = params.filmGrainStrength
        CameraAPI.metadata.bloom = params.bloom
        CameraAPI.metadata.bloomStrength = params.bloomStrength
        CameraAPI.metadata.bloomThreshold = params.bloomThreshold
        CameraAPI.metadata.gamma = params.gamma
        CameraAPI.metadata.exposure = params.exposure

        const bBox = window.gpu.canvas.getBoundingClientRect()
        CameraAPI.metadata.aspectRatio = bBox.width / bBox.height
        CameraAPI.updateProjection()
    }

    static removeUnusedProbes() {
        const renderer = window.renderer,
            data = RendererController.data,
            entities = renderer.entities



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
