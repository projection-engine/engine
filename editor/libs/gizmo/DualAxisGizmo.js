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
        EditorRenderer.planeMesh.draw()
        GizmoSystem.toBufferShader.bindForUse({
            ...data,
            transformMatrix: DualAxisGizmo.matrixXZ,
            uID: XZ_ID,
        })
        EditorRenderer.planeMesh.draw()
        GizmoSystem.toBufferShader.bindForUse({
            ...data,
            transformMatrix: DualAxisGizmo.matrixZY,
            uID: ZY_ID,
        })
        EditorRenderer.planeMesh.draw()
    }

    static #translateMatrix(comp) {

        if (!GizmoSystem.translation)
            return
        const matrix = comp.transformationMatrix.slice(0)

        const translation = comp.translation,
            rotationQuat = comp.rotationQuat,
            scale = comp.scaling
        const translated = GizmoSystem.translation
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.RELATIVE)
            mat4.fromRotationTranslationScaleOrigin(
                matrix,
                quat.multiply([], GizmoSystem.targetRotation, rotationQuat),
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
            DualAxisGizmo.matrixXY = DualAxisGizmo.#translateMatrix(gizmos.XY.components[COMPONENTS.TRANSFORM])
            DualAxisGizmo.#draw(
                XY_ID,
                AXIS.XY,
                DualAxisGizmo.matrixXY
            )
        }

        if (clicked === AXIS.XZ || notSelected) {
            DualAxisGizmo.matrixXZ = DualAxisGizmo.#translateMatrix(gizmos.XZ.components[COMPONENTS.TRANSFORM])
            DualAxisGizmo.#draw(
                XZ_ID,
                AXIS.XZ,
                DualAxisGizmo.matrixXZ
            )
        }

        if (clicked === AXIS.ZY || notSelected) {
            DualAxisGizmo.matrixZY = DualAxisGizmo.#translateMatrix(gizmos.ZY.components[COMPONENTS.TRANSFORM])
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
        EditorRenderer.planeMesh.draw()
    }
}