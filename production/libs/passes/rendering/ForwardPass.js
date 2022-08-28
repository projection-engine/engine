import COMPONENTS from "../../../data/COMPONENTS"
import MaterialRenderer from "../../../services/MaterialRenderer";
import LoopAPI from "../../apis/LoopAPI";
import RendererController from "../../../RendererController";
import CameraAPI from "../../apis/CameraAPI";

let aoTexture
export default class ForwardPass {

    execute() {
        if (aoTexture === undefined)
            aoTexture = LoopAPI.renderMap.get("ao").texture

        const {
            meshes,
            materials,
            pointLightsQuantity,
            maxTextures,
            directionalLightsData,
            dirLightPOV,
            pointLightData
        } = RendererController.data

        const elapsed = RendererController.params.elapsed



        MaterialRenderer.loopMeshes(
            materials,
            meshes,
            (mat, mesh, meshComponent, current) => {
                if (!mat.isForwardShaded)
                    return

                const ambient = MaterialRenderer.getEnvironment(current)
                MaterialRenderer.drawMesh({
                    mesh,
                    camPosition: CameraAPI.position,
                    viewMatrix: CameraAPI.viewMatrix,
                    projectionMatrix: CameraAPI.projectionMatrix,
                    transformMatrix: current.transformationMatrix,
                    material: mat,
                    normalMatrix: meshComponent.normalMatrix,
                    materialComponent: meshComponent,
                    directionalLightsQuantity: maxTextures,
                    directionalLightsData,
                    dirLightPOV,
                    pointLightsQuantity,
                    pointLightData,
                    elapsed,
                    ambient,

                    ao: aoTexture
                })

            }
        )
    }
}