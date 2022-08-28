import EditorRenderer from "../../EditorRenderer";
import Gizmo from "./libs/Gizmo";
import GizmoSystem from "../../services/GizmoSystem";
import AXIS from "./AXIS";
import Conversion from "../../../production/services/Conversion";
import {mat4, quat, vec3} from "gl-matrix";
import CameraAPI from "../../../production/libs/apis/CameraAPI";
import mapEntity from "./utils/map-entity";
import COMPONENTS from "../../../production/data/COMPONENTS";
import TRANSFORMATION_TYPE from "../../../../../data/misc/TRANSFORMATION_TYPE";
import getPickerId from "../../../production/utils/get-picker-id";

export const XZ_ID = getPickerId(AXIS.XZ), XY_ID = getPickerId(AXIS.XY), ZY_ID = getPickerId(AXIS.ZY)
export default class DualAxisGizmo {
    static matrixXZ
    static matrixXY
    static matrixZY
    static cameraDistance
    static mouseX
    static mouseY
    static gizmos = {
        XY: mapEntity("XY", "DUAL"),
        XZ: mapEntity("XZ", "DUAL"),
        ZY: mapEntity("ZY", "DUAL")
    }

    static onMouseMove(event) {

    }

    static onMouseDown(event) {

    }

    static onMouseUp() {

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

    static #translateMatrix(entity) {

        if (!GizmoSystem.translation)
            return
        const matrix = entity.transformationMatrix.slice(0)

        const translation = entity.translation,
            rotationQuaternion = entity.rotationQuaternion,
            scale = entity.scaling
        const translated = GizmoSystem.translation
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.RELATIVE)
            mat4.fromRotationTranslationScaleOrigin(
                matrix,
                quat.multiply([], GizmoSystem.targetRotation, rotationQuaternion),
                vec3.add([], translated, translation),
                scale,
                translation
            )
        else {
            matrix[12] += translated[0]
            matrix[13] += translated[1]
            matrix[14] += translated[2]
        }


        return matrix
    }

    static drawGizmo() {
        if (!GizmoSystem.transformationMatrix)
            return
        const clicked = GizmoSystem.clickedAxis
        const notSelected = !clicked || clicked <= 0
        const gizmos = DualAxisGizmo.gizmos
        if (clicked === AXIS.XY || notSelected) {
            DualAxisGizmo.matrixXY = DualAxisGizmo.#translateMatrix(gizmos.XY)
            DualAxisGizmo.#draw(
                XY_ID,
                AXIS.XY,
                DualAxisGizmo.matrixXY
            )
        }

        if (clicked === AXIS.XZ || notSelected) {
            DualAxisGizmo.matrixXZ = DualAxisGizmo.#translateMatrix(gizmos.XZ)
            DualAxisGizmo.#draw(
                XZ_ID,
                AXIS.XZ,
                DualAxisGizmo.matrixXZ
            )
        }

        if (clicked === AXIS.ZY || notSelected) {
            DualAxisGizmo.matrixZY = DualAxisGizmo.#translateMatrix(gizmos.ZY)
            DualAxisGizmo.#draw(
                ZY_ID,
                AXIS.ZY,
                DualAxisGizmo.matrixZY
            )
        }
    }

    static #draw(uID, axis, transformMatrix) {
        GizmoSystem.gizmoShader.bindForUse({
            viewMatrix: CameraAPI.viewMatrix,
            transformMatrix,
            isDualAxis: true,
            projectionMatrix: CameraAPI.projectionMatrix,
            camPos: CameraAPI.position,
            translation: GizmoSystem.translation,
            axis,
            selectedAxis: GizmoSystem.clickedAxis,
            uID,
            cameraIsOrthographic: CameraAPI.isOrthographic
        })
        GizmoSystem.dualAxisGizmoMesh.draw()
    }
}