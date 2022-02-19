import {mat4, quat} from "gl-matrix";

export default class Transformation {
    static transform(translation, rotate, scale) {
        const t = Transformation.translate(translation),
            r = Transformation.rotate(rotate),
            s = Transformation.scale(scale)
        const res = mat4.create()
        mat4.multiply(res, t, r)
        mat4.multiply(res, res, s)
        return Array.from(res)
    }

    static translate(translation) {
        const translationMatrix = mat4.create()
        mat4.translate(translationMatrix, translationMatrix, translation)
        return translationMatrix
    }

    static rotate(rotation) {
        const rotationMatrix = mat4.create()
        const quaternion = quat.create()
        quat.fromEuler(quaternion, rotation[0], rotation[1], rotation[2])
        mat4.fromQuat(rotationMatrix, quaternion)
        return rotationMatrix
    }

    static scale(scaling) {
        const scalingMatrix = mat4.create()
        mat4.scale(scalingMatrix, scalingMatrix, scaling)

        return scalingMatrix
    }
}