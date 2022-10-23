import MaterialAPI from "../apis/rendering/MaterialAPI";
import Engine from "../../Engine";
import CameraAPI from "../apis/CameraAPI";
import GPUResources from "../../GPUResources";

export default class ForwardPass {
    static execute() {
        const {
            meshes,
            pointLightsQuantity,
            directionalLightsQuantity,
            directionalLightsData,
            dirLightPOV,
            pointLightData
        } = Engine.data
        MaterialAPI.loopMeshes(
            meshes,
            (mat, mesh, meshComponent, current) => {
                if (!mat.isForwardShaded)
                    return


                MaterialAPI.drawMesh(
                    current.id,
                    mesh,
                    mat,
                    meshComponent,
                    {
                    cameraVec: CameraAPI.position,
                    viewMatrix: CameraAPI.viewMatrix,
                    projectionMatrix: CameraAPI.projectionMatrix,
                    transformMatrix: current.matrix,

                    normalMatrix: current.normalMatrix,
                    materialComponent: meshComponent,
                    directionalLightsQuantity,
                    directionalLightsData,
                    dirLightPOV,
                    lightQuantity: pointLightsQuantity,
                    pointLightData
                })

            }
        )
    }
}