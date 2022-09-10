import MaterialController from "../controllers/MaterialController";
import Engine from "../Engine";
import CameraAPI from "../apis/CameraAPI";
import GPU from "../GPU";

export default class ForwardPass {
    static execute() {
        const materials = GPU.materials
        const {
            meshes,
            pointLightsQuantity,
            maxTextures,
            directionalLightsData,
            dirLightPOV,
            pointLightData
        } = Engine.data

        const elapsed = Engine.params.elapsed


        MaterialController.loopMeshes(
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