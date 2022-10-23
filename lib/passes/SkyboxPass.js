import MaterialAPI from "../apis/rendering/MaterialAPI";
import MATERIAL_RENDERING_TYPES from "../../static/MATERIAL_RENDERING_TYPES";
import Engine from "../../Engine";
import CameraAPI from "../apis/CameraAPI";


const SKYBOX_TYPE = MATERIAL_RENDERING_TYPES.SKYBOX
export default class SkyboxPass {
    static isReady = false
    static hasRendered = false

    static execute() {
        const {
            meshes
        } = Engine.data

        MaterialAPI.loopMeshes(
            meshes,
            (mat, mesh, meshComponent, current) => {

                if (mat.shadingType !== SKYBOX_TYPE)
                    return
                if (!SkyboxPass.isReady) {
                    SkyboxPass.isReady = true
                    gpu.depthMask(false)
                    gpu.disable(gpu.CULL_FACE)
                    gpu.disable(gpu.DEPTH_TEST)
                }
                MaterialAPI.drawMesh(
                    current.id,
                    mesh,
                    mat,
                    meshComponent,
                    {
                        cameraVec: CameraAPI.position,
                        viewMatrix: CameraAPI.viewMatrix,
                        projectionMatrix: CameraAPI.skyboxProjectionMatrix,
                        transformMatrix: current.matrix,
                        normalMatrix: current.normalMatrix,
                        materialComponent: meshComponent
                    }, true)

            }
        )
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