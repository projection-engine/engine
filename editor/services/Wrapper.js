import GridSystem from "./GridSystem"
import IconsSystem from "./IconsSystem"
import GizmoSystem from "./GizmoSystem"
import SelectedSystem from "./SelectedSystem"
import BackgroundSystem from "./BackgroundSystem"
import Engine from "../../production/Engine";
import CameraAPI from "../../production/apis/CameraAPI";
import CollisionMeshInfoSystem from "./CollisionMeshInfoSystem";
import {TransformationAPI} from "../../production";
import CameraTracker from "../libs/CameraTracker";

export default class Wrapper {
    static execute(isDuringFrameComposition, isDuringBinging) {
        const {selected, iconsVisibility} = Engine.params
        const {cameras} = Engine.data
        CameraTracker.updateFrame()
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
                    const current = cameras[i]
                    if (!current.active)
                        continue
                    attr.highlight = IconsSystem.selectedMap.get(current.id) != null
                    if (current.__changedBuffer[1] === 1 || !current.cacheIconMatrix)
                        current.cacheIconMatrix = TransformationAPI.transform(current._translation, current._rotationQuat, [0.8578777313232422, 0.5202516317367554, 0.2847398519515991])

                    attr.transformMatrix = current.cacheIconMatrix
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