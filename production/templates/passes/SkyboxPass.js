import MaterialController from "../../controllers/MaterialController";
import MATERIAL_RENDERING_TYPES from "../../data/MATERIAL_RENDERING_TYPES";
import RendererController from "../../controllers/RendererController";
import CameraAPI from "../../libs/CameraAPI";
import {mat4} from "gl-matrix";


const SKYBOX_TYPE = MATERIAL_RENDERING_TYPES.SKYBOX
export default class SkyboxPass {
    static isReady = false
    static projectionMatrix = mat4.perspective([], 1.57, 1, .1, 1000)
    static execute() {
        const {
            meshes,
            materials
        } = RendererController.data

        const elapsed = RendererController.params.elapsed
        MaterialController.loopMeshes(
            materials,
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
                MaterialController.drawMesh({
                    mesh,
                    camPosition: CameraAPI.position,
                    viewMatrix: CameraAPI.viewMatrix,
                    projectionMatrix: SkyboxPass.projectionMatrix,
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
            gpu.depthMask(true)
            SkyboxPass.isReady = false
        }
    }
}