import {mat4} from "gl-matrix";

export default class Transformation {
    static transform(translation, rotate, scale) {
        const t = Transformation.translate(translation),
            r = Transformation.rotate(rotate),
            s = Transformation.scale(scale)
        const res = mat4.create()
        mat4.multiply(res, t, r)
        mat4.multiply(res, res, s)
        return res
    }

    static translate(translation) {
        const translationMatrix = mat4.create()

        translationMatrix[12] = translation[0]
        translationMatrix[13] = translation[1]
        translationMatrix[14] = translation[2]

        return translationMatrix
    }

    static rotate(rotation) {
        const rotationMatrix = mat4.create()

        mat4.rotate(
            rotationMatrix,
            rotationMatrix,
            rotation[0],
            [1, 0, 0]
        )
        mat4.rotate(
            rotationMatrix,
            rotationMatrix,
            rotation[1],
            [0, 1, 0]
        )
        mat4.rotate(
            rotationMatrix,
            rotationMatrix,
            rotation[2],
            [0, 0, 1]
        )

        return rotationMatrix
    }

    static scale(scaling) {
        const scalingMatrix = mat4.create()
        scalingMatrix[0] = scaling[0]
        scalingMatrix[5] = scaling[1]
        scalingMatrix[10] = scaling[2]


        return scalingMatrix
    }
}