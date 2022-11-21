import GPU from "../../GPU";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import Engine from "../../Engine";
import COMPONENTS from "../../static/COMPONENTS";

let shader, uniforms, fbo
export default class VisibilityBuffer {
    static positionSampler
    static uvSampler
    static entityIDSampler
    static normalSampler
    static buffer
    static materialsToRender = new Array(1000)
    static materialMaxOffset = 0

    static initialize() {
        shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.VISIBILITY_BUFFER)
        uniforms = shader.uniformMap

        fbo = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.VISIBILITY_BUFFER)

        VisibilityBuffer.positionSampler = fbo.colors[0]
        VisibilityBuffer.normalSampler = fbo.colors[1]
        VisibilityBuffer.entityIDSampler = fbo.colors[2]
        VisibilityBuffer.uvSampler = fbo.colors[3]
        VisibilityBuffer.buffer = fbo
    }

    static execute() {
        const toRender = Engine.data.meshes
        const size = toRender.length
        shader.bind()
        fbo.startMapping()
        let internalOffset = 0, previousMaterial = -1
        for (let i = 0; i < size; i++) {
            const entity = toRender[i]
            const meshComponent = entity.components.get(COMPONENTS.MESH)
            const mesh = GPU.meshes.get(meshComponent?.meshID)
            const material = GPU.materials.get(meshComponent?.materialID)

            if (!meshComponent || !mesh || !entity.active || !material?.bindID)
                continue

            const currentMaterial = material.bindID
            if (previousMaterial < 0 || previousMaterial !== currentMaterial) {
                VisibilityBuffer.materialsToRender[internalOffset] = material
                internalOffset++
            }
            previousMaterial = currentMaterial

            gpu.uniform3fv(uniforms.entityID, entity.pickID)
            gpu.uniform1i(uniforms.materialID, currentMaterial)
            gpu.uniformMatrix4fv(uniforms.transformationMatrix, false, entity.matrix)

            mesh.draw()
        }
        VisibilityBuffer.materialMaxOffset = internalOffset
        fbo.stopMapping()
    }
}