import MaterialController from "../../controllers/MaterialController";
import RendererController from "../../controllers/RendererController";
import CameraAPI from "../../libs/CameraAPI";

export default class ForwardPass {
    static execute() {
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


        MaterialController.loopMeshes(
            materials,
            meshes,
            (mat, mesh, meshComponent, current) => {
                if (!mat.isForwardShaded)
                    return

                const ambient = MaterialController.getEnvironment(current)
                MaterialController.drawMesh({
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
                    ambient
                })

            }
        )
    }
}