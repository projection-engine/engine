import GPU from "../../GPU";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import Engine from "../../Engine";
import Mesh from "../../instances/Mesh";
import CameraAPI from "../../lib/utils/CameraAPI";
import TransformationPass from "../misc/TransformationPass";
import SSAO from "./SSAO";
import {mat4} from "gl-matrix";

let shader, uniforms, fbo
let viewProjection, previousViewProjection
export default class VisibilityBuffer {
    static depthSampler
    static entityIDSampler
    static velocitySampler
    static needsUpdate = true
    static needsSSAOUpdate = false

    static initialize() {
        shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.VISIBILITY_BUFFER)
        uniforms = shader.uniformMap
        fbo = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.VISIBILITY_BUFFER)

        VisibilityBuffer.depthSampler = fbo.colors[0]
        VisibilityBuffer.entityIDSampler = fbo.colors[1]
        VisibilityBuffer.velocitySampler = fbo.colors[2]

        viewProjection = CameraAPI.viewProjectionMatrix
        previousViewProjection = CameraAPI.previousViewProjectionMatrix
    }

    static execute() {
        if (!VisibilityBuffer.needsUpdate && !TransformationPass.hasChangeBuffer[0])
            return

        VisibilityBuffer.needsSSAOUpdate = true
        const toRender = Engine.data.meshes
        const size = toRender.length
        const meshes = GPU.meshes
        shader.bind()

        gpu.uniformMatrix4fv(uniforms.viewProjection, false, viewProjection)
        gpu.uniformMatrix4fv(uniforms.previousViewProjection, false, CameraAPI.metadata.cameraMotionBlur ? previousViewProjection : viewProjection)

        mat4.copy(previousViewProjection, viewProjection)

        fbo.startMapping()
        Mesh.finishIfUsed()

        let isAlphaTested = 0, isDoubleSided = false, stateWasCleared = false

        gpu.enable(gpu.CULL_FACE)
        gpu.depthMask(true)

        for (let i = 0; i < size; i++) {
            isAlphaTested = 0
            const entity = toRender[i]
            const mesh = meshes.get(entity.__meshID)
            entity.__meshRef = mesh

            if (!entity.active || !mesh)
                continue
            if (entity.__materialID) {
                const material = entity.__materialRef

                if (material) {
                    if (material.isSky)
                        continue
                    isAlphaTested = material.isAlphaTested ? 1 : 0
                    if (material.doubleSided) {
                        gpu.disable(gpu.CULL_FACE)
                        isDoubleSided = true
                    } else if (isDoubleSided) {
                        gpu.enable(gpu.CULL_FACE)
                        isDoubleSided = false
                    }
                    stateWasCleared = false
                } else if (!stateWasCleared) {
                    stateWasCleared = true
                    if (isDoubleSided) {
                        gpu.enable(gpu.CULL_FACE)
                        isDoubleSided = false
                    }
                }
            }

            gpu.uniform1i(uniforms.isAlphaTested, isAlphaTested)
            gpu.uniform3fv(uniforms.entityID, entity.pickID)
            gpu.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            gpu.uniformMatrix4fv(uniforms.previousModelMatrix, false, entity.previousModelMatrix)


            mesh.simplifiedDraw()
        }
        fbo.stopMapping()

        SSAO.execute()
    }
}