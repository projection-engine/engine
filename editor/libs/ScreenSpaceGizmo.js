import Gizmo from "./Gizmo";
import GizmoSystem from "../services/GizmoSystem";
import AXIS from "../data/AXIS";
import ConversionAPI from "../../production/apis/ConversionAPI";
import {vec3} from "gl-matrix";
import CameraAPI from "../../production/apis/CameraAPI";
import getPickerId from "../../production/utils/get-picker-id";


const PICK_ID_SS_GIZMO = getPickerId(1)
export default class ScreenSpaceGizmo {
    static cameraDistance
    static mouseDelta = {x: 0, y: 0}


    static onMouseMove(event, damping = 1, gridStep = .001) {
        if (GizmoSystem.clickedAxis < 0)
            return [0, 0, 0]


        const cameraDistance = ScreenSpaceGizmo.cameraDistance
        const mouseAcceleration = (cameraDistance ** 2) * damping
        const mD = ScreenSpaceGizmo.mouseDelta
        mD.x += event.movementX * mouseAcceleration
        mD.y += event.movementY * mouseAcceleration
        const screenSpacePosition = ConversionAPI.toWorldCoordinates(mD.x, mD.y).slice(0, 3)
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

    static onMouseDown(event) {
        ScreenSpaceGizmo.cameraDistance = vec3.length(vec3.sub([], GizmoSystem.translation, CameraAPI.position))
        const mD = ScreenSpaceGizmo.mouseDelta
        mD.x = event.clientX
        mD.y = event.clientY
    }

    static onMouseUp() {
        const mD = ScreenSpaceGizmo.mouseDelta
        mD.x = 0
        mD.y = 0
    }

    static drawGizmo() {
        if (!GizmoSystem.transformationMatrix)
            return
        Gizmo.drawGizmo(GizmoSystem.screenSpaceMesh, GizmoSystem.transformationMatrix, AXIS.SCREEN_SPACE, PICK_ID_SS_GIZMO, GizmoSystem.translation, GizmoSystem.clickedAxis)
    }
}