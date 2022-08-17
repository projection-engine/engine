import COMPONENTS from "../../../data/COMPONENTS"
import MaterialRenderer from "../../../services/MaterialRenderer";
import MATERIAL_RENDERING_TYPES from "../../../data/MATERIAL_RENDERING_TYPES";
import Renderer from "../../../Renderer";


const SKYBOX_TYPE = MATERIAL_RENDERING_TYPES.SKYBOX
export default class SkyboxPass {
    lastMaterial
    isReady = false

    execute( ) {
        const {
            meshes,
            materials
        } = Renderer.data

        const {
            elapsed,
            camera
        } = Renderer.params


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
                    camPosition: camera.position,
                    viewMatrix: camera.viewMatrix,
                    projectionMatrix: camera.projectionMatrix,
                    transformMatrix: transformationComponent.transformationMatrix,
                    material: mat,
                    normalMatrix: meshComponent.normalMatrix,
                    materialComponent: meshComponent,

                    elapsed,
                    lastMaterial: this.lastMaterial
                }, true)

                this.lastMaterial = mat?.id
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