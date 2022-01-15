import {linearAlgebraMath} from "pj-math";
import {mat4} from "gl-matrix";


export default class Transformation {
    lastRotation = {xR: 0, yR: 0, zR: 0}
    lastTranslation = {xT: 0, yT: 0, zT: 0}
    lastScaling = {xS: 1, yS: 1, zS: 1}
    transformationMatrix = mat4.create()

    // S -> R -> T
    updateTranslation(
        xT = this.lastTranslation.xT,
        yT = this.lastTranslation.yT,
        zT = this.lastTranslation.zT,
        nativeEvent = false
    ) {
        if (!nativeEvent) {
            this.transformationMatrix = Array.from(mat4.create())
            this.updateScaling(undefined, undefined, undefined, true)
            this.updateRotation(undefined, undefined, undefined, true)
        }

        const currentTranslation = {xT: parseFloat(xT), yT: parseFloat(yT), zT: parseFloat(zT)}

        this.transformationMatrix[12] = currentTranslation.xT
        this.transformationMatrix[13] = currentTranslation.yT
        this.transformationMatrix[14] = currentTranslation.zT

        if (!nativeEvent) {
            this.lastTranslation = currentTranslation
            this._updateNormalMatrix()
        }
    }

    updateScaling(
        xS = this.lastScaling.xS,
        yS = this.lastScaling.yS,
        zS = this.lastScaling.zS,
        nativeEvent = false
    ) {
        if (!nativeEvent)
            this.transformationMatrix = Array.from(mat4.create())
        const currentScaling = {xS: parseFloat(xS), yS: parseFloat(yS), zS: parseFloat(zS)}

        this.transformationMatrix[0] *= currentScaling.xS
        this.transformationMatrix[5] *= currentScaling.yS
        this.transformationMatrix[10] *= currentScaling.zS

        if (!nativeEvent) {
            this.updateRotation(undefined, undefined, undefined, true)
            this.updateTranslation(undefined, undefined, undefined, true)

            this.lastScaling = currentScaling
            this._updateNormalMatrix()
        }
    }

    updateRotation(
        xR = this.lastRotation.xR,
        yR = this.lastRotation.yR,
        zR = this.lastRotation.zR,
        nativeEvent = false
    ) {

        if (!nativeEvent) {
            this.transformationMatrix = Array.from(mat4.create())
            this.updateScaling(undefined, undefined, undefined, true)
        }

        const currentRotation = {
            xR: parseFloat(xR),
            yR: parseFloat(yR),
            zR: parseFloat(zR)
        }

        mat4.rotate(
            this.transformationMatrix,
            this.transformationMatrix,
            currentRotation.xR,
            [1, 0, 0]
        )

        mat4.rotate(
            this.transformationMatrix,
            this.transformationMatrix,
            currentRotation.yR,
            [0, 1, 0]
        )

        mat4.rotate(
            this.transformationMatrix,
            this.transformationMatrix,
            currentRotation.zR,
            [0, 0, 1]
        )

        if (!nativeEvent) {
            this.updateTranslation(undefined, undefined, undefined, true)
            this.lastRotation = currentRotation
            this._updateNormalMatrix()
        }
    }

    _updateNormalMatrix() {
        this.normalMatrix = linearAlgebraMath.normalMatrix(Array.from(this.transformationMatrix))
    }
}