import COMPONENTS from "../../../data/COMPONENTS"
import MaterialRenderer from "../../../services/MaterialRenderer";
import EngineLoop from "../../loop/EngineLoop";
import MATERIAL_RENDERING_TYPES from "../../../data/MATERIAL_RENDERING_TYPES";

let aoTexture
const SKYBOX_TYPE = MATERIAL_RENDERING_TYPES.SKYBOX
export default class SkyboxPass {
    lastMaterial

    execute(options, data) {
        if (aoTexture === undefined)
            aoTexture = EngineLoop.renderMap.get("ao").texture

        const {
            meshes,
            materials,
            meshesMap,

        } = data

        const {
            elapsed,
            camera
        } = options

        this.lastMaterial = undefined
        MaterialRenderer.loopMeshes(
            meshesMap,
            materials,
            meshes,
            (mat, mesh, meshComponent, current) => {
                // window.gpu.depthMask(false)
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
                // window.gpu.depthMask(true)
            }
        )
    }
}