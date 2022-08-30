import Gizmo from "./libs/Gizmo";
import GizmoSystem from "../../services/GizmoSystem";
import AXIS from "../../data/AXIS";
import Conversion from "../../../production/libs/Conversion";
import {vec3} from "gl-matrix";
import CameraAPI from "../../../production/libs/apis/CameraAPI";
import getPickerId from "../../../production/utils/get-picker-id";
import STATIC_MESHES from "../../../static/STATIC_MESHES";
import GPU from "../../../production/controllers/GPU";


const PICK_ID_SS_GIZMO = getPickerId(1)
export default class ScreenSpaceGizmo {
    static cameraDistance
    static mouseX = 0
    static mouseY = 0

    static onMouseMove(event, damping = 1, gridStep = .001) {
        if (GizmoSystem.clickedAxis < 0)
            return [0, 0, 0]
        const cameraDistance = ScreenSpaceGizmo.cameraDistance
        ScreenSpaceGizmo.mouseX += event.movementX
        ScreenSpaceGizmo.mouseY += event.movementY

        const mouseAcceleration = (cameraDistance ** 2) * damping
        const screenSpacePosition = Conversion.toWorldCoordinates(ScreenSpaceGizmo.mouseX * mouseAcceleration, ScreenSpaceGizmo.mouseY * mouseAcceleration).slice(0, 3)
        vec3.scale(screenSpacePosition, screenSpacePosition, 1 / cameraDistance)
        for (let i = 0; i < 3; i++)
            screenSpacePosition[i] = Math.round(screenSpacePosition[i] / gridStep) * gridStep
        ScreenSpaceGizmo.mapToAxis(screenSpacePosition)

        return screenSpacePosition
    }

    static mapToAxis(vec) {
        const axis = GizmoSystem.clickedAxis
        if (axis < 0) {
            vec[0] = 0
            vec[1] = 0
            vec[2] = 0
        }
        switch (axis) {
            case AXIS.X:
                vec[1] = 0
                vec[2] = 0
                break
            case AXIS.Y:
                vec[0] = 0
                vec[2] = 0
                break
            case AXIS.Z:
                vec[0] = 0
                vec[1] = 0
                break
            case AXIS.XZ:
                vec[1] = 0
                break
            case AXIS.XY:
                vec[2] = 0
                break
            case AXIS.ZY:
                vec[0] = 0
                break
        }
    }

    static onMouseDown() {
        const translation = GizmoSystem.mainEntity.translation
        const coords = Conversion.toScreenCoordinates([translation[0], translation[1], translation[2]])

        ScreenSpaceGizmo.mouseX = coords[0]
        ScreenSpaceGizmo.mouseY = coords[1]
        ScreenSpaceGizmo.cameraDistance = vec3.length(vec3.sub([], GizmoSystem.translation, CameraAPI.position))
    }

    static onMouseUp() {
        ScreenSpaceGizmo.mouseX = 0
        ScreenSpaceGizmo.mouseY = 0
    }

    static drawGizmo() {
        if (!GizmoSystem.transformationMatrix)
            return
        Gizmo.drawGizmo(GPU.meshes.get(STATIC_MESHES.CUBE), GizmoSystem.transformationMatrix, AXIS.SCREEN_SPACE, PICK_ID_SS_GIZMO, GizmoSystem.translation, GizmoSystem.clickedAxis)
    }
}