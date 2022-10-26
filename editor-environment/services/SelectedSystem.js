import COMPONENTS from "../../static/COMPONENTS.js"
import CameraAPI from "../../api/CameraAPI";
import GPUResources from "../../GPUResources";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import QueryAPI from "../../api/utils/QueryAPI";
import GPUController from "../../GPUController";


export default class SelectedSystem {
    static shaderSilhouette
    static shader
    static frameBuffer
    static silhouetteSampler

    static initialize() {

        SelectedSystem.frameBuffer = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.EDITOR.OUTLINE).texture({
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

        SelectedSystem.frameBuffer.startMapping()
        for (let m = 0; m < length; m++) {
            const current = QueryAPI.getEntityByID(selected[m])
            if (!current || !current.active)
                continue
            const components = current.components

            const mMeshID = components.get(COMPONENTS.MESH)?.meshID
            const tTerrainID = components.get(COMPONENTS.TERRAIN)?.terrainID

            const mesh = GPUResources.meshes.get(mMeshID || tTerrainID)
            if (!mesh)
                continue
            SelectedSystem.shader.bindForUse({
                meshIndex: m,
                projectionMatrix: CameraAPI.projectionMatrix,
                transformMatrix: current.matrix,
                viewMatrix: CameraAPI.viewMatrix,

            })
            mesh.draw()
        }
        SelectedSystem.frameBuffer.stopMapping()

    }

    static drawSilhouette(selected) {
        const length = selected.length
        if (length > 0) {
            SelectedSystem.shaderSilhouette.bindForUse({
                silhouette: SelectedSystem.silhouetteSampler
            })
            GPUResources.quad.draw()
        }
    }
}