import {mat4, quat} from "gl-matrix"

const toDeg = 57.2957795131

const quaternion = [0, 0, 0, 1]
export default class TransformationAPI {
    static transform(translation, rotate, scale, matrix) {
        quat.normalize(quaternion, rotate.length > 3 ? rotate : quat.fromEuler([], rotate[0] * toDeg, rotate[1] * toDeg, rotate[2] * toDeg))
        if (matrix)
            return mat4.fromRotationTranslationScale(matrix, quaternion, translation, scale)
        return mat4.fromRotationTranslationScale([], quaternion, translation, scale)
    }

    static extractTransformations(mat) {
        return {
            translation: mat4.getTranslation([], mat),
            rotationQuaternion: quat.normalize([], mat4.getRotation([], mat)),
            scaling: mat4.getScaling([], mat)
        }
    }

    static linearInterpolation(target, arr, arr1, t) {
        const out = target || []
        if (arr.length !== arr1.length)
            return out
        for (let i = 0; i < arr.length; i++)
            out[i] = arr[i] * t + arr1[i] * (1 - t)
        return out
    }

    static getEuler(q) {
        const angles = []

        const sinr_cosp = 2 * (q[3] * q[0] + q[1] * q[2])
        const cosr_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1])
        angles[0] = Math.atan2(sinr_cosp, cosr_cosp)

        const sinp = 2 * (q[3] * q[1] - q[2] * q[0])
        if (Math.abs(sinp) >= 1)
            angles[1] = 3.14 * sinp / Math.abs(sinp)
        else
            angles[1] = Math.asin(sinp)

        const siny_cosp = 2 * (q[3] * q[2] + q[0] * q[1])
        const cosy_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2])
        angles[2] = Math.atan2(siny_cosp, cosy_cosp)

        return angles
    }

}