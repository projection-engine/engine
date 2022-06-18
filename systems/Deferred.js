import System from "../basic/System"
import FramebufferInstance from "../instances/FramebufferInstance"
import COMPONENTS from "../templates/COMPONENTS"
import Renderer from "../Renderer"
import Forward from "./Forward"
import SYSTEMS from "../templates/SYSTEMS"
import ShaderInstance from "../instances/ShaderInstance"
import * as shaderCode from "../shaders/mesh/DEFERRED.glsl"

export default class Deferred extends System {
    lastMaterial

    constructor(gpu, resolution = {w: window.screen.width, h: window.screen.height}) {
        super()
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, resolution.w, resolution.h)
        this.frameBuffer
            .texture({attachment: 0, precision: this.gpu.RGBA32F, format: this.gpu.RGBA, type: this.gpu.FLOAT})
            .texture({attachment: 1})
            .texture({attachment: 2})
            .texture({attachment: 3})
            .texture({attachment: 4})
            .depthTest()

        this.deferredShader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment, gpu)
    }

    execute(options, systems, data) {
        super.execute()
        const {
            meshes,
            skybox,
            materials,
            meshSources
        } = data

        const {
            elapsed,
            camera,
            fallbackMaterial,
            brdf
        } = options
        this.frameBuffer.startMapping()
        this.lastMaterial = undefined
        const l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m]
            const mesh = meshSources[current.components[COMPONENTS.MESH].meshID]
            if (mesh !== undefined) {
                const t = current.components[COMPONENTS.TRANSFORM]
                const currentMaterial = materials[current.components[COMPONENTS.MATERIAL].materialID]

                let mat = currentMaterial && currentMaterial.ready ? currentMaterial : fallbackMaterial
                if (!mat || !mat.ready)
                    mat = fallbackMaterial
                const ambient = Renderer.getEnvironment(current, skybox)
                Forward.drawMesh({
                    mesh,
                    camPosition: camera.position,
                    viewMatrix: camera.viewMatrix,
                    projectionMatrix: camera.projectionMatrix,
                    transformMatrix: t.transformationMatrix,
                    material: mat,
                    normalMatrix: current.components[COMPONENTS.MESH].normalMatrix,
                    materialComponent: current.components[COMPONENTS.MATERIAL],
                    brdf,

                    elapsed,
                    ambient,
                    lastMaterial: this.lastMaterial,
                    gpu: this.gpu,
                    onlyForward: false
                })
            }
        }

        this.gpu.cullFace(this.gpu.BACK)
        this.gpu.bindVertexArray(null)
        this.frameBuffer.stopMapping()
    }

    drawBuffer(options, systems, data){
        if (this.aoTexture === undefined && systems[SYSTEMS.AO])
            this.aoTexture = systems[SYSTEMS.AO].texture
        const {
            pointLightsQuantity,
            maxTextures,
            directionalLightsData,
            dirLightPOV,
            pointLightData
        } = data
        const {
            ao,
            camera,
            pcfSamples
        } = options
        const shadowMapSystem = systems[SYSTEMS.SHADOWS]


        this.deferredShader.use()
        this.deferredShader.bindForUse({
            screenSpaceReflections:  systems[SYSTEMS.SSGI].ssColor,
            positionSampler: this.frameBuffer.colors[0],
            normalSampler: this.frameBuffer.colors[1],
            albedoSampler: this.frameBuffer.colors[2],
            behaviourSampler: this.frameBuffer.colors[3],
            ambientSampler: this.frameBuffer.colors[4],
            shadowMapTexture: shadowMapSystem?.shadowsFrameBuffer?.depthSampler,
            aoSampler: this.aoTexture,

            shadowCube0: shadowMapSystem?.cubeMaps[0]?.texture,
            shadowCube1: shadowMapSystem?.cubeMaps[1]?.texture,

            cameraVec: camera.position,
            settings: [
                maxTextures, shadowMapSystem.maxResolution, shadowMapSystem ? 0 : 1,
                shadowMapSystem.maxResolution / shadowMapSystem.resolutionPerTexture, pointLightsQuantity, ao ? 1 : 0,
                pcfSamples, 0, 0
            ],
            directionalLightsData,
            dirLightPOV,
            pointLightData
        })
        this.frameBuffer.draw()
    }
}