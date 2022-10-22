import GridSystem from "./GridSystem"
import IconsSystem from "./IconsSystem"
import GizmoSystem from "./GizmoSystem"
import SelectedSystem from "./SelectedSystem"
import BackgroundSystem from "./BackgroundSystem"
import Engine from "../../Engine";
import CameraAPI from "../../lib/apis/CameraAPI";
import CollisionVisualizationSystem from "./CollisionVisualizationSystem";
import CameraTracker from "../libs/CameraTracker";
import TransformationAPI from "../../lib/apis/math/TransformationAPI";

const CAMERA_SCALE = [0.8578777313232422, 0.5202516317367554, 0.2847398519515991]
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
            CollisionVisualizationSystem.execute(selected)
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
                        current.cacheIconMatrix = TransformationAPI.mat4.fromRotationTranslationScale([], current._rotationQuat, current._translation, CAMERA_SCALE)

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