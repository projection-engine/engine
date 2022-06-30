import System from "../../basic/System"
import FramebufferInstance from "../../instances/FramebufferInstance"
import COMPONENTS from "../../templates/COMPONENTS"
import ForwardPass from "./ForwardPass"
import ShaderInstance from "../../instances/ShaderInstance"
import * as shaderCode from "../../shaders/mesh/DEFERRED.glsl"
import ENVIRONMENT from "../../ENVIRONMENT"

let shadowMapSystem, aoTexture, ssGISystem, ssrSystem
export default class DeferredPass extends System {
    lastMaterial
    constructor( resolution = {w: window.screen.width, h: window.screen.height}) {
        super()
        this.frameBuffer = new FramebufferInstance( resolution.w, resolution.h)
        this.frameBuffer
            .texture({attachment: 0, precision: window.gpu.RGBA32F, format: window.gpu.RGBA, type: window.gpu.FLOAT})
            .texture({attachment: 1})
            .texture({attachment: 2})
            .texture({attachment: 3})
            .texture({attachment: 4})
            .depthTest()

        this.deferredShader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment)
        this.deferredFBO = (new FramebufferInstance(resolution.w, resolution.h)).texture()
        this.toScreenShader = new ShaderInstance(shaderCode.vertex, shaderCode.toScreen)
    }

    drawFrame(){
        this.toScreenShader.use()
        this.toScreenShader.bindForUse({
            uSampler: this.deferredFBO.colors[0]
        })
        this.deferredFBO.draw()
    }
    execute(options, data) {
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
                const ambient = window.renderer.getEnvironment(current, skybox)
                ForwardPass.drawMesh({
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
                    onlyForward: false
                })
            }
        }
        window.gpu.bindVertexArray(null)
        this.frameBuffer.stopMapping()

    }

    drawBuffer(options, data, entities, entitiesMap, onWrap){
        if (aoTexture === undefined) {
            aoTexture = window.renderer.renderingPass.ao.texture
            ssGISystem = window.renderer.renderingPass.ssGI
            ssrSystem = window.renderer.renderingPass.ssr
            shadowMapSystem = window.renderer.renderingPass.shadowMap
        }
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
            pcfSamples,
            ssr,
            ssgi
        } = options

        
        this.deferredFBO.startMapping()
        if (onWrap && window.renderer.environment !== ENVIRONMENT.PROD)
            onWrap.execute(options, data, entities, entitiesMap, false)

        this.deferredShader.use()
        this.deferredShader.bindForUse({
            screenSpaceGI: ssgi ? ssGISystem.color : undefined,
            screenSpaceReflections:ssr ? ssrSystem.color : undefined,
            positionSampler: this.frameBuffer.colors[0],
            normalSampler: this.frameBuffer.colors[1],
            albedoSampler: this.frameBuffer.colors[2],
            behaviourSampler: this.frameBuffer.colors[3],
            ambientSampler: this.frameBuffer.colors[4],
            shadowMapTexture: shadowMapSystem?.shadowsFrameBuffer?.depthSampler,
            aoSampler: aoTexture,

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

        this.deferredFBO.draw()
        this.deferredFBO.stopMapping()
    }
}