import * as smShaders from "../../templates/shaders/SHADOW_MAP.glsl"
import CubeMap from "../instances/CubeMap"
import {mat4, vec3} from "gl-matrix"
import COMPONENTS from "../../static/COMPONENTS.js"
import EntityAPI from "../apis/EntityAPI";
import Engine from "../../Engine";
import GPUResources from "../../GPUResources";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import PointLightComponent from "../components/rendering/PointLightComponent";
import DeferredPass from "./DeferredPass";
import GPUController from "../../GPUController";
import DirectionalLightComponent from "../components/rendering/DirectionalLightComponent";


let lightsToUpdate
export default class DirectionalShadows {
    static changed = false
    static resolutionPerTexture = 1024
    static maxResolution = 4096
    static shadowMapShader
    static shadowsFrameBuffer
    static lightsToUpdate = []
    static atlasRatio = 0

    static initialize() {
        DirectionalShadows.allocateData()
        DirectionalShadows.shadowMapShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.DIRECT_SHADOWS, smShaders.vertex, smShaders.fragment)
        lightsToUpdate = DirectionalShadows.lightsToUpdate
    }

    static allocateData() {
        if (DirectionalShadows.shadowsFrameBuffer)
            GPUController.destroyFramebuffer(STATIC_FRAMEBUFFERS.SHADOWS)
        DirectionalShadows.shadowsFrameBuffer = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.SHADOWS, DirectionalShadows.maxResolution, DirectionalShadows.maxResolution)
        DirectionalShadows.shadowsFrameBuffer.depthTexture()
        DeferredPass.deferredUniforms.shadowMapTexture = DirectionalShadows.shadowsFrameBuffer.depthSampler
    }

    static allocateBuffers(shadowAtlasQuantity, shadowMapResolution) {
        if (DirectionalShadows.maxResolution !== shadowMapResolution && shadowMapResolution) {
            DirectionalShadows.maxResolution = shadowMapResolution
            DirectionalShadows.allocateData()
            DirectionalShadows.changed = true
        }

        if (DirectionalShadows.maxResolution / shadowAtlasQuantity !== DirectionalShadows.resolutionPerTexture && shadowAtlasQuantity) {
            DirectionalShadows.resolutionPerTexture = DirectionalShadows.maxResolution / shadowAtlasQuantity
            DirectionalShadows.changed = true
        }
        DirectionalShadows.atlasRatio = DirectionalShadows.maxResolution / DirectionalShadows.resolutionPerTexture
    }


    static execute() {
        if (!DirectionalShadows.changed && lightsToUpdate.length === 0)
            return;
        gpu.cullFace(gpu.FRONT)
        let currentColumn = 0, currentRow = 0

        DirectionalShadows.shadowsFrameBuffer.startMapping()
        gpu.enable(gpu.SCISSOR_TEST)
        const size = DirectionalShadows.atlasRatio ** 2
        for (let face = 0; face < size; face++) {
            if (face < lightsToUpdate.length) {
                const currentLight = lightsToUpdate[face]

                gpu.viewport(
                    currentColumn * DirectionalShadows.resolutionPerTexture,
                    currentRow * DirectionalShadows.resolutionPerTexture,
                    DirectionalShadows.resolutionPerTexture,
                    DirectionalShadows.resolutionPerTexture
                )
                gpu.scissor(
                    currentColumn * DirectionalShadows.resolutionPerTexture,
                    currentRow * DirectionalShadows.resolutionPerTexture,
                    DirectionalShadows.resolutionPerTexture,
                    DirectionalShadows.resolutionPerTexture
                )
                gpu.clear(gpu.DEPTH_BUFFER_BIT)

                currentLight.atlasFace = [currentColumn, 0]
                DirectionalShadows.loopMeshes(DirectionalShadows.shadowMapShader, currentLight.lightView, currentLight.lightProjection)
            }
            if (currentColumn > DirectionalShadows.atlasRatio) {
                currentColumn = 0
                currentRow += 1
            } else
                currentColumn += 1
        }
        gpu.disable(gpu.SCISSOR_TEST)
        DirectionalShadows.shadowsFrameBuffer.stopMapping()
        gpu.cullFace(gpu.BACK)
        DirectionalShadows.changed = false
        lightsToUpdate.length = 0
    }

    static loopMeshes(shader, view, projection, lightPosition, shadowClipNearFar) {
        const meshes = Engine.data.meshes
        const l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m], meshComponent = current.components.get(COMPONENTS.MESH)
            const mesh = GPUResources.meshes.get(meshComponent.meshID)
            if (!mesh || !meshComponent.castsShadows)
                continue
            shader.bindForUse({
                shadowClipNearFar,
                viewMatrix: view,
                transformMatrix: current.matrix,
                projectionMatrix: projection,

                lightPosition
            })
            mesh.draw()
        }
    }

}