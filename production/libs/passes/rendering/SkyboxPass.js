import COMPONENTS from "../../../data/COMPONENTS"
import MaterialRenderer from "../../../services/MaterialRenderer";
import MATERIAL_RENDERING_TYPES from "../../../data/MATERIAL_RENDERING_TYPES";
import RendererController from "../../../RendererController";
import CameraAPI from "../../apis/CameraAPI";


const SKYBOX_TYPE = MATERIAL_RENDERING_TYPES.SKYBOX
export default class SkyboxPass {
    isReady = false

    execute( ) {
        const {
            meshes,
            materials
        } = RendererController.data

        const elapsed = RendererController.params.elapsed


        this.lastMaterial = undefined
        MaterialRenderer.loopMeshes(
            materials,
            meshes,
            (mat, mesh, meshComponent, current) => {

                if (mat.shadingType !== SKYBOX_TYPE)
                    return
                if (!this.isReady) {
                    this.isReady = true
                    gpu.depthMask(true)
                    gpu.disable(gpu.CULL_FACE)
                    gpu.disable(gpu.DEPTH_TEST)
                }
                const transformationComponent = current.components[COMPONENTS.TRANSFORM]
                MaterialRenderer.drawMesh({
                    mesh,
                    camPosition: CameraAPI.position,
                    viewMatrix: CameraAPI.viewMatrix,
                    projectionMatrix: CameraAPI.projectionMatrix,
                    transformMatrix: transformationComponent.transformationMatrix,
                    material: mat,
                    normalMatrix: meshComponent.normalMatrix,
                    materialComponent: meshComponent,

                    elapsed
                }, true)
            }
        )
        if (this.isReady) {
            gpu.enable(gpu.DEPTH_TEST)
            gpu.enable(gpu.CULL_FACE)
            gpu.depthMask(false)
            this.isReady = false
        }
    }
}