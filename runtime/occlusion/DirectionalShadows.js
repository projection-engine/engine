import COMPONENTS from "../../static/COMPONENTS.js"
import Engine from "../../Engine";
import GPU from "../../GPU";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import GBuffer from "../renderers/GBuffer";
import GPUAPI from "../../api/GPUAPI";
import LightsAPI from "../../api/LightsAPI";


let lightsToUpdate
export default class DirectionalShadows {
    static changed = false
    static resolutionPerTexture = 1024
    static maxResolution = 4096
    static shadowMapShader
    static shadowsFrameBuffer
    static lightsToUpdate = []
    static atlasRatio = 0
    static sampler

    static initialize() {
        DirectionalShadows.allocateData()

        lightsToUpdate = DirectionalShadows.lightsToUpdate
    }

    static allocateData() {
        if (DirectionalShadows.shadowsFrameBuffer)
            GPUAPI.destroyFramebuffer(STATIC_FRAMEBUFFERS.SHADOWS)
        DirectionalShadows.shadowsFrameBuffer = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SHADOWS, DirectionalShadows.maxResolution, DirectionalShadows.maxResolution).depthTexture()
        DirectionalShadows.sampler = DirectionalShadows.shadowsFrameBuffer.depthSampler
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
        LightsAPI.directionalLightsUBO.bind()
        LightsAPI.directionalLightsUBO.updateData("shadowMapsQuantity", new Float32Array([shadowAtlasQuantity]))
        LightsAPI.directionalLightsUBO.updateData("shadowMapResolution", new Float32Array([DirectionalShadows.maxResolution]))
        LightsAPI.directionalLightsUBO.unbind()
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
            const mesh = GPU.meshes.get(meshComponent.meshID)
            if (!mesh || !meshComponent.castsShadows || !current.active)
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