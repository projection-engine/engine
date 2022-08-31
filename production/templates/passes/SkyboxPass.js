import MaterialRenderer from "../../libs/MaterialRenderer";
import MATERIAL_RENDERING_TYPES from "../../data/MATERIAL_RENDERING_TYPES";
import RendererController from "../../controllers/RendererController";
import CameraAPI from "../../libs/apis/CameraAPI";


const SKYBOX_TYPE = MATERIAL_RENDERING_TYPES.SKYBOX
export default class SkyboxPass {
    static isReady = false

    static execute() {
        const {
            meshes,
            materials
        } = RendererController.data

        const elapsed = RendererController.params.elapsed


        MaterialRenderer.loopMeshes(
            materials,
            meshes,
            (mat, mesh, meshComponent, current) => {

                if (mat.shadingType !== SKYBOX_TYPE)
                    return
                if (!SkyboxPass.isReady) {
                    SkyboxPass.isReady = true
                    gpu.depthMask(true)
                    gpu.disable(gpu.CULL_FACE)
                    gpu.disable(gpu.DEPTH_TEST)
                }
                MaterialRenderer.drawMesh({
                    mesh,
                    camPosition: CameraAPI.position,
                    viewMatrix: CameraAPI.viewMatrix,
                    projectionMatrix: CameraAPI.projectionMatrix,
                    transformMatrix: current.transformationMatrix,
                    material: mat,
                    normalMatrix: meshComponent.normalMatrix,
                    materialComponent: meshComponent,

                    elapsed
                }, true)
            }
        )
        if (SkyboxPass.isReady) {
            gpu.enable(gpu.DEPTH_TEST)
            gpu.enable(gpu.CULL_FACE)
            gpu.depthMask(false)
            SkyboxPass.isReady = false
        }
    }
}