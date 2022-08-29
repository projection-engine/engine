import Gizmo from "./libs/Gizmo";
import GizmoSystem from "../../services/GizmoSystem";
import AXIS from "../../data/AXIS";
import Conversion from "../../../production/services/Conversion";
import {vec3} from "gl-matrix";
import CameraAPI from "../../../production/libs/apis/CameraAPI";
import getPickerId from "../../../production/utils/get-picker-id";
import STATIC_MESHES from "../../../static/STATIC_MESHES";
import GPU from "../../../production/GPU";


const PICK_ID_SS_GIZMO = getPickerId(1)
export default class ScreenSpaceGizmo {
    static cameraDistance
    static mouseX = 0
    static mouseY= 0

    static onMouseMove(event, damping = 1, gridStep=.001) {
        if (ScreenSpaceGizmo.cameraDistance == null)
            ScreenSpaceGizmo.cameraDistance = vec3.length(vec3.sub([], GizmoSystem.translation, CameraAPI.position))
        ScreenSpaceGizmo.mouseX += event.movementX
        ScreenSpaceGizmo.mouseY += event.movementY

        const mouseAcceleration = (ScreenSpaceGizmo.cameraDistance ** 2) * damping
        const screenSpacePosition = Conversion.toScreen(ScreenSpaceGizmo.mouseX * mouseAcceleration, ScreenSpaceGizmo.mouseY * mouseAcceleration).slice(0, 3)
        for(let i = 0; i < 3; i++)
            screenSpacePosition[i] = Math.round(screenSpacePosition[i] / gridStep) * gridStep
        ScreenSpaceGizmo.mapToAxis(screenSpacePosition)

        return screenSpacePosition
    }

    static mapToAxis(vec){
        switch (GizmoSystem.clickedAxis){
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

    static onMouseDown(event) {
        ScreenSpaceGizmo.mouseX = event.clientX
        ScreenSpaceGizmo.mouseY = event.clientY

    }

    static onMouseUp() {
        ScreenSpaceGizmo.cameraDistance = undefined
        ScreenSpaceGizmo.mouseX = 0
        ScreenSpaceGizmo.mouseY = 0
    }

    static drawGizmo() {
        if (!GizmoSystem.transformationMatrix)
            return
        Gizmo.drawGizmo(GPU.meshes.get(STATIC_MESHES.CUBE), GizmoSystem.transformationMatrix, AXIS.SCREEN_SPACE, PICK_ID_SS_GIZMO, GizmoSystem.translation, GizmoSystem.clickedAxis)
    }
}