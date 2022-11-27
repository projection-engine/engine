import GPU from "../../GPU";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import Engine from "../../Engine";
import Mesh from "../../instances/Mesh";
import CameraAPI from "../../lib/utils/CameraAPI";
import TransformationPass from "../misc/TransformationPass";

let shader, uniforms, fbo
export default class VisibilityBuffer {
    static depthEntityIDSampler
    static velocitySampler
    static needsUpdate = true

    static initialize() {
        shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.VISIBILITY_BUFFER)
        uniforms = shader.uniformMap
        fbo = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.VISIBILITY_BUFFER)

        VisibilityBuffer.depthEntityIDSampler = fbo.colors[0]
        VisibilityBuffer.velocitySampler = fbo.colors[1]

    }

    static execute() {
        if(!VisibilityBuffer.needsUpdate && !TransformationPass.hasChangeBuffer[0])
            return

        const toRender = Engine.data.meshes
        const size = toRender.length
        const meshes = GPU.meshes
        const materials = GPU.materials
        shader.bind()

        gpu.uniformMatrix4fv(uniforms.viewProjection, false, CameraAPI.viewProjectionMatrix)
        fbo.startMapping()
        Mesh.finishIfUsed()
        let isAlphaTested = 0
        for (let i = 0; i < size; i++) {
            isAlphaTested = 0
            const entity = toRender[i]
            const mesh = meshes.get(entity.__meshID)
            entity.__meshRef = mesh

            if (!entity.active || !mesh)
                continue
            if (entity.__materialID) {
                const material = materials.get(entity.__materialID)
                entity.__materialRef = material
                if (material && material.isAlphaTested)
                    isAlphaTested = 1
            }

            gpu.uniform1i(uniforms.isAlphaTested, isAlphaTested)
            gpu.uniform3fv(uniforms.entityID, entity.pickID)
            gpu.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            gpu.uniformMatrix4fv(uniforms.previousModelMatrix, false, entity.previousModelMatrix)

            mesh.simplifiedDraw()
        }

        fbo.stopMapping()
    }
}