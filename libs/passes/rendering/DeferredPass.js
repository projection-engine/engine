import FramebufferInstance from "../../instances/FramebufferInstance"
import COMPONENTS from "../../../data/COMPONENTS"
import ShaderInstance from "../../instances/ShaderInstance"
import * as shaderCode from "../../../data/shaders/DEFERRED.glsl"
import MaterialRenderer from "../../../services/MaterialRenderer";
import EngineLoop from "../../loop/EngineLoop";

let shadowMapSystem, aoTexture, ssGISystem, ssrSystem
export default class DeferredPass {
    lastMaterial
    constructor( resolution = {w: window.screen.width, h: window.screen.height}) {
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
        const {
            meshes,
            materials,
            meshesMap
        } = data

        const {
            elapsed,
            camera
        } = options
        this.frameBuffer.startMapping()

        this.lastMaterial = undefined
        MaterialRenderer.loopMeshes(
            meshesMap,
            materials,
            meshes,
            (mat, mesh, meshComponent, current) => {

                if (!mat.isDeferredShaded)
                    return
                const transformationComponent = current.components[COMPONENTS.TRANSFORM]
                const ambient = MaterialRenderer.getEnvironment(current)
                MaterialRenderer.drawMesh({
                    mesh,
                    camPosition: camera.position,
                    viewMatrix: camera.viewMatrix,
                    projectionMatrix: camera.projectionMatrix,
                    transformMatrix: transformationComponent.transformationMatrix,
                    material: mat,
                    normalMatrix: meshComponent.normalMatrix,
                    materialComponent: meshComponent,
                    elapsed,
                    ambient,
                    lastMaterial: this.lastMaterial,
                    onlyForward: false
                })
                this.lastMaterial = mat?.id
            }
        )
        this.frameBuffer.stopMapping()

    }

    drawBuffer(options, data, entities, onWrap){
        if (aoTexture === undefined) {
            aoTexture = EngineLoop.renderMap.get("ao").texture
            ssGISystem = EngineLoop.renderMap.get("ssGI")
            ssrSystem = EngineLoop.renderMap.get("ssr")
            shadowMapSystem = EngineLoop.renderMap.get("shadowMap")
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

        onWrap()

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

            shadowCube0: shadowMapSystem?.specularProbes[0]?.texture,
            shadowCube1: shadowMapSystem?.specularProbes[1]?.texture,

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