import EditorRenderer from "../../EditorRenderer";
import Gizmo from "./libs/Gizmo";
import GizmoSystem from "../../services/GizmoSystem";
import AXIS from "./AXIS";
import Conversion from "../../../production/services/Conversion";
import {vec3} from "gl-matrix";
import CameraAPI from "../../../production/libs/apis/CameraAPI";


const PICK_ID_SS_GIZMO = [0, 0, 0]
export default class ScreenSpaceGizmo {
    static cameraDistance
    static mouseX
    static mouseY

    static onMouseMove(event) {
        if (ScreenSpaceGizmo.cameraDistance == null)
            ScreenSpaceGizmo.cameraDistance = vec3.length(vec3.sub([], GizmoSystem.translation, CameraAPI.position))
        ScreenSpaceGizmo.mouseX += event.movementX
        ScreenSpaceGizmo.mouseY += event.movementY

        const mouseAcceleration = ScreenSpaceGizmo.cameraDistance ** 2
        const screenSpacePosition = Conversion.toScreen(ScreenSpaceGizmo.mouseX * mouseAcceleration, ScreenSpaceGizmo.mouseY * mouseAcceleration).slice(0, 3)
        vec3.scale(screenSpacePosition, screenSpacePosition, 1 / ScreenSpaceGizmo.cameraDistance)
        return screenSpacePosition
    }

    static onMouseDown(event) {
        const bBox = gpu.canvas.getBoundingClientRect()
        ScreenSpaceGizmo.mouseX = event.offsetX - bBox.width / 2
        ScreenSpaceGizmo.mouseY = event.offsetY - bBox.height / 2
    }

    static onMouseUp() {
        ScreenSpaceGizmo.cameraDistance = undefined
    }

    static drawGizmo() {
        if (!GizmoSystem.transformationMatrix)
            return
        const cube = EditorRenderer.cubeMesh
        gpu.bindVertexArray(cube.VAO)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, cube.indexVBO)
        cube.vertexVBO.enable()

        Gizmo.drawGizmo(cube, GizmoSystem.transformationMatrix, AXIS.SCREEN_SPACE, PICK_ID_SS_GIZMO, GizmoSystem.translation, GizmoSystem.clickedAxis)

        cube.vertexVBO.disable()
        gpu.bindVertexArray(null)
    }
}