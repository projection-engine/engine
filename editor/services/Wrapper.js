import GridSystem from "./GridSystem"
import IconsSystem from "./IconsSystem"
import GizmoSystem from "./GizmoSystem"
import SelectedSystem from "./SelectedSystem"
import BackgroundSystem from "./BackgroundSystem"
import Engine from "../../production/Engine";
import CameraAPI from "../../production/apis/camera/CameraAPI";
import CollisionMeshInfoSystem from "./CollisionMeshInfoSystem";

export default class Wrapper {
    static execute(isDuringFrameComposition, isDuringBinging) {
        const {selected, iconsVisibility} = Engine.params
        const {cameras} = Engine.data

        if (!isDuringFrameComposition && !isDuringBinging)
            SelectedSystem.drawToBuffer(selected)
        else if (!isDuringFrameComposition) {
            BackgroundSystem.execute()
            GridSystem.execute()
        } else if (isDuringFrameComposition) {

            gpu.enable(gpu.BLEND)
            gpu.blendFunc(gpu.SRC_ALPHA, gpu.ONE_MINUS_SRC_ALPHA)

            SelectedSystem.drawSilhouette(selected)

            gpu.clear(gpu.DEPTH_BUFFER_BIT)
            CollisionMeshInfoSystem.execute(selected)
            if (iconsVisibility) {
                const attr = {
                    viewMatrix: CameraAPI.viewMatrix,
                    cameraPosition: CameraAPI.position,
                    projectionMatrix: CameraAPI.projectionMatrix,
                    translation: [0, 0, 0],
                    sameSize: false,
                    highlight: false
                }
                for (let i = 0; i < cameras.length; i++) {
                    attr.highlight = IconsSystem.selectedMap.get(cameras[i].id) != null
                    attr.transformMatrix = cameras[i].matrix

                    IconsSystem.shader.bindForUse(attr)
                    IconsSystem.cameraMesh.draw()
                }
            }
            gpu.clear(gpu.DEPTH_BUFFER_BIT)
            GizmoSystem.execute()
            IconsSystem.execute(selected)

        }
    }
}