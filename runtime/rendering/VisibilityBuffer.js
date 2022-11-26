import GPU from "../../GPU";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import Engine from "../../Engine";

let shader, uniforms, fbo
export default class VisibilityBuffer {
    static depthEntityIDSampler
    static velocitySampler
    static buffer

    static initialize() {
        shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.VISIBILITY_BUFFER)
        uniforms = shader.uniformMap
        fbo = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.VISIBILITY_BUFFER)

        VisibilityBuffer.depthEntityIDSampler = fbo.colors[0]
        VisibilityBuffer.velocitySampler = fbo.colors[1]
        VisibilityBuffer.buffer = fbo
    }

    static execute() {
        const toRender = Engine.data.meshes
        const size = toRender.length
        const meshes = GPU.meshes
        const materials = GPU.materials
        shader.bind()

        fbo.startMapping()

        for (let i = 0; i < size; i++) {
            const entity = toRender[i]
            const mesh = meshes.get(entity.__meshID)
            entity.__meshRef = mesh

            if (!entity.active || !mesh)
                continue
            if (entity.__materialID) {
                const material = materials.get(entity.__materialID)
                entity.__materialRef = material
                if (material && material.isAlphaTested)
                    continue
            }

            gpu.uniform3fv(uniforms.entityID, entity.pickID)
            gpu.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            gpu.uniformMatrix4fv(uniforms.previousModelMatrix, false, entity.previousModelMatrix)

            mesh.simplifiedDraw()
        }

        fbo.stopMapping()
    }
}