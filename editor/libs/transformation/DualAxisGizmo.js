import GizmoSystem from "../../services/GizmoSystem";
import AXIS from "../../data/AXIS";
import CameraAPI from "../../../lib/apis/CameraAPI";
import mapGizmoMesh from "../../utils/map-gizmo-mesh";
import getPickerId from "../../../utils/get-picker-id";
import STATIC_MESHES from "../../../static/resources/STATIC_MESHES";
import GPUResources from "../../../GPUResources";
import GizmoAPI from "../GizmoAPI";

export const XZ_ID = getPickerId(AXIS.XZ), XY_ID = getPickerId(AXIS.XY), ZY_ID = getPickerId(AXIS.ZY)
export default class DualAxisGizmo {
    static matrixXZ
    static matrixXY
    static matrixZY

    static gizmos = {
        XY: mapGizmoMesh("XY", "DUAL"),
        XZ: mapGizmoMesh("XZ", "DUAL"),
        ZY: mapGizmoMesh("ZY", "DUAL")
    }

    static drawToBuffer(data) {
        GizmoSystem.toBufferShader.bindForUse({
            ...data,
            transformMatrix: DualAxisGizmo.matrixXY,
            uID: XY_ID,
        })
        GizmoSystem.dualAxisGizmoMesh.draw()
        GizmoSystem.toBufferShader.bindForUse({
            ...data,
            transformMatrix: DualAxisGizmo.matrixXZ,
            uID: XZ_ID,
        })
        GizmoSystem.dualAxisGizmoMesh.draw()
        GizmoSystem.toBufferShader.bindForUse({
            ...data,
            transformMatrix: DualAxisGizmo.matrixZY,
            uID: ZY_ID,
        })
        GizmoSystem.dualAxisGizmoMesh.draw()
    }



    static drawGizmo() {
        if (!GizmoSystem.transformationMatrix)
            return
        gpu.disable(gpu.CULL_FACE)
        const clicked = GizmoSystem.clickedAxis
        const notSelected = !clicked || clicked <= 0
        const gizmos = DualAxisGizmo.gizmos

        if (clicked === AXIS.XY || notSelected) {
            DualAxisGizmo.matrixXY = GizmoAPI.translateMatrix(gizmos.XY)
            DualAxisGizmo.#draw(
                XY_ID,
                AXIS.XY,
                DualAxisGizmo.matrixXY
            )
        }

        if (clicked === AXIS.XZ || notSelected) {
            DualAxisGizmo.matrixXZ = GizmoAPI.translateMatrix(gizmos.XZ)
            DualAxisGizmo.#draw(
                XZ_ID,
                AXIS.XZ,
                DualAxisGizmo.matrixXZ
            )
        }

        if (clicked === AXIS.ZY || notSelected) {
            DualAxisGizmo.matrixZY = GizmoAPI.translateMatrix(gizmos.ZY)
            DualAxisGizmo.#draw(
                ZY_ID,
                AXIS.ZY,
                DualAxisGizmo.matrixZY
            )

        }
        gpu.enable(gpu.CULL_FACE)
    }

    static #draw(uID, axis, transformMatrix, isSurface = false) {
        GizmoSystem.gizmoShader.bindForUse({
            viewMatrix: CameraAPI.viewMatrix,
            transformMatrix,
            isDualAxis: true,
            projectionMatrix: CameraAPI.projectionMatrix,
            camPos: CameraAPI.position,
            translation: GizmoSystem.translation,
            axis: isSurface ? undefined : axis,
            selectedAxis: GizmoSystem.clickedAxis,
            uID,
            cameraIsOrthographic: CameraAPI.isOrthographic,
            isSurface
        })
        if (!isSurface)
            GizmoSystem.dualAxisGizmoMesh.draw()
        else
            GPUResources.meshes.get(STATIC_MESHES.PRODUCTION.PLANE).draw()
    }
}