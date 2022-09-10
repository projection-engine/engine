import * as shaderCode from "../templates/SELECTED.glsl"
import COMPONENTS from "../../production/data/COMPONENTS"
import Engine from "../../production/Engine";
import CameraAPI from "../../production/apis/CameraAPI";
import GPU from "../../production/GPU";
import STATIC_SHADERS from "../../static/STATIC_SHADERS";
import STATIC_FRAMEBUFFERS from "../../static/STATIC_FRAMEBUFFERS";
import QuadAPI from "../../production/apis/QuadAPI";


export default class SelectedSystem {
    static shaderSilhouette
    static shader
    static frameBuffer
    static silhouetteSampler

    static initialize() {
        SelectedSystem.shaderSilhouette = GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.SILHOUETTE, shaderCode.vertexSilhouette, shaderCode.fragmentSilhouette)
        SelectedSystem.shader = GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.SILHOUETTE_OUTLINE, shaderCode.vertex, shaderCode.fragment)
        SelectedSystem.frameBuffer = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.EDITOR.OUTLINE).texture({
            precision: gpu.R16F,
            format: gpu.RED,
            type: gpu.FLOAT
        })
        SelectedSystem.silhouetteSampler = SelectedSystem.frameBuffer.colors[0]
    }

    static drawToBuffer(selected) {
        const length = selected.length
        if (length === 0)
            return

        gpu.disable(gpu.DEPTH_TEST)
        SelectedSystem.frameBuffer.startMapping()
        for (let m = 0; m < length; m++) {
            const current = Engine.entitiesMap.get(selected[m])
            if (!current || !current.active)
                continue
            const mesh = GPU.meshes.get(current.components[COMPONENTS.MESH]?.meshID)
            if (!mesh)
                continue
            SelectedSystem.shader.bindForUse({
                projectionMatrix: CameraAPI.projectionMatrix,
                transformMatrix: current.transformationMatrix,
                viewMatrix: CameraAPI.viewMatrix
            })
            mesh.draw()
        }
        SelectedSystem.frameBuffer.stopMapping()
        gpu.enable(gpu.DEPTH_TEST)

    }

    static drawSilhouette(selected) {
        const length = selected.length
        if (length > 0) {
            SelectedSystem.shaderSilhouette.bindForUse({
                silhouette: SelectedSystem.silhouetteSampler
            })
            QuadAPI.draw()
        }
    }
}