import {vec4} from "gl-matrix"
import CameraAPI from "../utils/CameraAPI";

/**
 * @field canvasBBox - Bounding box for canvas; updated on engine resize observer
 */

export default class ConversionAPI {
    static canvasBBox

    static toQuadCoord(coords, quadSize) {
        const target = ConversionAPI.canvasBBox
        const {x, y} = coords
        const {w, h} = quadSize

        const multiplierX = w / target.width
        const multiplierY = h / target.height

        return {
            x: x * multiplierX - target.left * multiplierX,
            y: h - y * multiplierY + target.top * multiplierY - 1
        }
    }

    static toWorldCoordinates(x, y) {

        // NORMALIZED DEVICE SPACE
        const bBox = ConversionAPI.canvasBBox
        let xNormalized = ((x - bBox.x) / bBox.width) * 2 - 1,
            yNormalized = -((y - bBox.y) / bBox.height) * 2 + 1

        // HOMOGENEOUS CLIP SPACE
        const homogeneousCoords = [xNormalized, yNormalized, 0, 0]

        // EYE SPACE

        const eyeCoords = vec4.transformMat4([], homogeneousCoords, CameraAPI.invProjectionMatrix)
        eyeCoords[2] = -1
        eyeCoords[3] = 1

        // WORLD SPACE
        return vec4.transformMat4([], eyeCoords, CameraAPI.invViewMatrix)
    }
    static toLinearWorldCoordinates(x, y) {
        // EYE SPACE

        const eyeCoords = vec4.transformMat4([],  [x, y, 0, 0], CameraAPI.invProjectionMatrix)
        eyeCoords[2] = -1
        eyeCoords[3] = 1

        // WORLD SPACE
        return vec4.transformMat4([], eyeCoords, CameraAPI.invViewMatrix)
    }

    static toScreenCoordinates(vec) {
        const target = [...vec, 1]
        vec4.transformMat4(target, target, CameraAPI.viewMatrix)
        vec4.transformMat4(target, target, CameraAPI.projectionMatrix)

        // NORMALIZED DEVICE SPACE
        const bBox = ConversionAPI.canvasBBox
        const widthHalf = bBox.width / 2
        const heightHalf = bBox.height / 2

        target[0] = ((target[0]/target[3] + 1) * widthHalf);
        target[1] = ((target[1]/target[3] + 1) * heightHalf);

        return [target[0], target[1]]
    }
}