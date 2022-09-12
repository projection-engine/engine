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
    static totalMoved = [0,0,0]

    static onMouseMove(event, damping = 1, gridStep = .001) {
        if (GizmoSystem.clickedAxis < 0)
            return [0, 0, 0]

        const cameraDistance = ScreenSpaceGizmo.cameraDistance ** 2
        const mouseAcceleration = cameraDistance * damping
        const mD = ScreenSpaceGizmo.mouseDelta
        const mY = -event.movementY * 2, mX = event.movementX
        const x = Math.sign(mX) * mD.x + mX * mouseAcceleration
        const y = Math.sign(mY) * mD.y + mY * mouseAcceleration
        const ssP = ConversionAPI.toLinearWorldCoordinates(x, y).slice(0, 3)
        for (let i = 0; i < 3; i++)
            ssP[i] = (Math.round(ssP[i] / gridStep) * gridStep) * damping / cameraDistance
        ScreenSpaceGizmo.mapToAxis(ssP)
        vec3.add(ScreenSpaceGizmo.totalMoved,ScreenSpaceGizmo.totalMoved, ssP )

        return ssP
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

    static onMouseDown( ) {
        ScreenSpaceGizmo.cameraDistance = Math.min(Math.max(vec3.length(vec3.sub([], GizmoSystem.translation, CameraAPI.position)), 50), 150)

        const b = gpu.canvas.getBoundingClientRect()
        ScreenSpaceGizmo.mouseDelta.x = b.width / 2
        ScreenSpaceGizmo.mouseDelta.y = b.height / 2
    }


    static drawGizmo() {
        if (!GizmoSystem.transformationMatrix)
            return
        Gizmo.drawGizmo(GizmoSystem.screenSpaceMesh, GizmoSystem.transformationMatrix, AXIS.SCREEN_SPACE, PICK_ID_SS_GIZMO, GizmoSystem.translation, GizmoSystem.clickedAxis)
    }
}