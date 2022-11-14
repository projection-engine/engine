import MaterialAPI from "../../lib/rendering/MaterialAPI";
import Engine from "../../Engine";
import CameraAPI from "../../lib/utils/CameraAPI";

export default class ForwardRenderer {
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

                    transformMatrix: current.matrix,

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