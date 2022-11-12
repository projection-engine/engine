import {glMatrix, mat3, mat4, quat, vec2, vec3, vec4} from "gl-matrix"

const toDeg = 57.2957795131
const quaternion = quat.create()

export default class TransformationAPI {
    static utils = glMatrix
    static mat4 = mat4
    static mat3 = mat3
    static quat = quat
    static vec3 = vec3
    static vec2 = vec2
    static vec4 = vec4

    static transformMovable(movable) {
        const translation = movable._translation,rotate = movable._rotationQuat, scale = movable._scaling, matrix = movable.matrix
        TransformationAPI.quat.normalize(quaternion, rotate.length > 3 ? rotate : TransformationAPI.quat.fromEuler([], rotate[0] * toDeg, rotate[1] * toDeg, rotate[2] * toDeg))
        if (matrix)
            return TransformationAPI.mat4.fromRotationTranslationScale(matrix, quaternion, translation, scale)
        return TransformationAPI.mat4.fromRotationTranslationScale([], quaternion, translation, scale)
    }




}