import * as shaderCode from "../shaders/SELECTED.glsl"
import COMPONENTS from "../../static/COMPONENTS.json"
import CameraAPI from "../../production/apis/CameraAPI";
import GPU from "../../production/GPU";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import QueryAPI from "../../production/apis/utils/QueryAPI";


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
            const current = QueryAPI.getEntityByID(selected[m])
            if (!current || !current.active)
                continue
            const components = current.components

            const mMeshID = components.get(COMPONENTS.MESH)?.meshID
            const tTerrainID = components.get(COMPONENTS.TERRAIN)?.terrainID

            const mesh = GPU.meshes.get(mMeshID || tTerrainID)
            if (!mesh)
                continue
            SelectedSystem.shader.bindForUse({
                projectionMatrix: CameraAPI.projectionMatrix,
                transformMatrix: current.matrix,
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
            GPU.quad.draw()
        }
    }
}