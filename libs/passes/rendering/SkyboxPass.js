import COMPONENTS from "../../../data/COMPONENTS"
import MaterialRenderer from "../../../services/MaterialRenderer";
import MATERIAL_RENDERING_TYPES from "../../../data/MATERIAL_RENDERING_TYPES";


const SKYBOX_TYPE = MATERIAL_RENDERING_TYPES.SKYBOX
export default class SkyboxPass {
    lastMaterial

    execute(options, data) {
        const {
            meshes,
            materials,
            meshesMap,
        } = data

        const {
            elapsed,
            camera
        } = options

        window.gpu.depthMask(true)
        window.gpu.disable(window.gpu.CULL_FACE)
        window.gpu.disable(window.gpu.DEPTH_TEST)
        this.lastMaterial = undefined
        MaterialRenderer.loopMeshes(
            meshesMap,
            materials,
            meshes,
            (mat, mesh, meshComponent, current) => {

                if (mat.shadingType !== SKYBOX_TYPE)
                    return
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
        window.gpu.enable(window.gpu.DEPTH_TEST)
        window.gpu.enable(window.gpu.CULL_FACE)
        window.gpu.depthMask(false)
    }
}