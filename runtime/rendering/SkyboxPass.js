import MaterialAPI from "../../lib/rendering/MaterialAPI";
import CameraAPI from "../../lib/utils/CameraAPI";


export default class SkyboxPass {
    static isReady = false
    static hasRendered = false

    static execute() {
        const mats = MaterialAPI.staticShadedEntities
        for (let i = 0; i < mats.length; i++) {
            if (!SkyboxPass.isReady) {
                SkyboxPass.isReady = true
                gpu.depthMask(false)
                gpu.disable(gpu.CULL_FACE)
                gpu.disable(gpu.DEPTH_TEST)
            }
            const current = mats[i]
            const entity = current.entity
            if (!entity.active)
                continue
            const material = current.material
            const mesh = current.mesh
            material.use({
                skyboxProjectionMatrix: CameraAPI.skyboxProjectionMatrix,
                transformMatrix: current.matrix
            })
            mesh.draw()
        }

        if (SkyboxPass.isReady) {
            SkyboxPass.hasRendered = true
            gpu.enable(gpu.DEPTH_TEST)
            gpu.enable(gpu.CULL_FACE)
            gpu.depthMask(true)
            SkyboxPass.isReady = false
        } else if (SkyboxPass.hasRendered)
            SkyboxPass.hasRendered = false
    }
}