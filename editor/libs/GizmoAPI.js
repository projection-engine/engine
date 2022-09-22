import {mat4, quat, vec3} from "gl-matrix"
import TRANSFORMATION_TYPE from "../../../../src/editor/data/TRANSFORMATION_TYPE"

import GizmoSystem from "../services/GizmoSystem";
import CameraAPI from "../../production/apis/camera/CameraAPI";

export default class GizmoAPI {
    static tooltip

    static translateMatrix(entity) {
        if (!GizmoSystem.translation)
            return
        const matrix = mat4.copy([], entity.matrix)
        GizmoAPI.applyTransformation(matrix, entity._rotationQuat, entity._translation, entity._scaling)
        return matrix
    }

    static applyTransformation(matrix, q, t, s){

        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.RELATIVE)
            mat4.fromRotationTranslationScaleOrigin(
                matrix,
                quat.multiply([], GizmoSystem.targetRotation, q),
                vec3.add([], GizmoSystem.translation, t),
                s,
                t
            )
        else {
            matrix[12] += GizmoSystem.translation[0]
            matrix[13] += GizmoSystem.translation[1]
            matrix[14] += GizmoSystem.translation[2]
        }
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
