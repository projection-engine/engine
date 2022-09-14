import {mat4, quat, vec3} from "gl-matrix"
import TRANSFORMATION_TYPE from "../../../../src/editor/data/TRANSFORMATION_TYPE"

import INFORMATION_CONTAINER from "../../../../src/editor/data/INFORMATION_CONTAINER"
import EngineStore from "../../../../src/editor/stores/EngineStore";

import GizmoSystem from "../services/GizmoSystem";
import AXIS from "../data/AXIS";
import ScreenSpaceGizmo from "./ScreenSpaceGizmo";
import DualAxisGizmo from "./DualAxisGizmo";
import {ConversionAPI} from "../../production";
import CameraAPI from "../../production/apis/camera/CameraAPI";

export default class GizmoAPI {
    static tooltip

    static translateMatrix(entity) {
        if (!GizmoSystem.translation)
            return
        const matrix = entity.matrix.slice(0)

        const translation = entity.translation,
            rotationQuaternion = entity.rotationQuaternion,
            scale = entity.scaling
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.RELATIVE)
            mat4.fromRotationTranslationScaleOrigin(
                matrix,
                quat.multiply([], GizmoSystem.targetRotation, rotationQuaternion),
                vec3.add([], GizmoSystem.translation, translation),
                scale,
                translation
            )
        else {
            matrix[12] += GizmoSystem.translation[0]
            matrix[13] += GizmoSystem.translation[1]
            matrix[14] += GizmoSystem.translation[2]
        }
        return matrix
    }

    static drawGizmo(mesh, transformMatrix, axis, uID) {
        GizmoSystem.gizmoShader.bindForUse({
            viewMatrix: CameraAPI.viewMatrix,
            transformMatrix,
            projectionMatrix: CameraAPI.projectionMatrix,
            camPos: CameraAPI.position,
            translation: GizmoSystem.translation,
            axis,
            selectedAxis: GizmoSystem.clickedAxis,
            uID,
            cameraIsOrthographic: CameraAPI.isOrthographic
        })
        mesh.draw()
    }
}
