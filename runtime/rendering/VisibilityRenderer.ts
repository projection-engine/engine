import GPU from "../../GPU";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import Mesh from "../../instances/Mesh";
import CameraAPI from "../../lib/utils/CameraAPI";
import EntityWorkerAPI from "../../lib/utils/EntityWorkerAPI";
import SSAO from "./SSAO";
import {mat4} from "gl-matrix";
import DynamicMap from "../../lib/DynamicMap";

let shader, uniforms, fbo
let viewProjection, previousViewProjection
export default class VisibilityRenderer {
    static meshesToDraw = new DynamicMap()
    static depthSampler
    static entityIDSampler
    static velocitySampler
    static needsUpdate = true
    static needsSSAOUpdate = false
    static FBO

    static initialize() {
        shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.VISIBILITY_BUFFER)
        uniforms = shader.uniformMap
        VisibilityRenderer.FBO = fbo = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.VISIBILITY_BUFFER)

        VisibilityRenderer.depthSampler = fbo.colors[0]
        VisibilityRenderer.entityIDSampler = fbo.colors[1]
        VisibilityRenderer.velocitySampler = fbo.colors[2]

        viewProjection = CameraAPI.viewProjectionMatrix
        previousViewProjection = CameraAPI.previousViewProjectionMatrix
    }

    static execute() {
        if (!VisibilityRenderer.needsUpdate && !EntityWorkerAPI.hasChangeBuffer[0])
            return

        VisibilityRenderer.needsSSAOUpdate = true
        const toRender = VisibilityRenderer.meshesToDraw.array
        const size = toRender.length
        shader.bind()

        GPU.context.uniformMatrix4fv(uniforms.viewProjection, false, viewProjection)
        GPU.context.uniformMatrix4fv(uniforms.previousViewProjection, false, CameraAPI.metadata.cameraMotionBlur ? previousViewProjection : viewProjection)

        mat4.copy(previousViewProjection, viewProjection)

        fbo.startMapping()
        Mesh.finishIfUsed()

        let isAlphaTested = 0, isDoubleSided = false, stateWasCleared = false

        GPU.context.enable(GPU.context.CULL_FACE)
        GPU.context.depthMask(true)

        for (let i = 0; i < size; i++) {
            isAlphaTested = 0
            const entity = toRender[i]
            const mesh = entity.__meshRef
            const material = entity.__materialRef
            if (!entity.active || !mesh || entity.isCulled)
                continue

            if (material) {
                if (material.isSky)
                    continue
                isAlphaTested = material.isAlphaTested ? 1 : 0
                if (material.doubleSided) {
                    GPU.context.disable(GPU.context.CULL_FACE)
                    isDoubleSided = true
                } else if (isDoubleSided) {
                    GPU.context.enable(GPU.context.CULL_FACE)
                    isDoubleSided = false
                }
                stateWasCleared = false
            } else if (!stateWasCleared) {
                stateWasCleared = true
                if (isDoubleSided) {
                    GPU.context.enable(GPU.context.CULL_FACE)
                    isDoubleSided = false
                }
            }

            GPU.context.uniform1i(uniforms.isAlphaTested, isAlphaTested)
            GPU.context.uniform3fv(uniforms.entityID, entity.pickID)
            GPU.context.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            GPU.context.uniformMatrix4fv(uniforms.previousModelMatrix, false, entity.previousModelMatrix)


            mesh.simplifiedDraw()
        }
        fbo.stopMapping()

        SSAO.execute()
    }
}