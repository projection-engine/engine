import {mat4, vec4} from "gl-matrix"
import CameraAPI from "../libs/apis/CameraAPI";

export default class Conversion {
    static toQuadCoord(coords, quadSize) {
        const target = gpu.canvas.getBoundingClientRect()
        const {x, y} = coords
        const {w, h} = quadSize

        const multiplierX = w / target.width
        const multiplierY = h / target.height

        return {
            x:  x * multiplierX - target.left * multiplierX,
            y: h - y * multiplierY + target.top * multiplierY - 1
        }
    }

    static toScreen(x, y){
        const viewMatrix = CameraAPI.viewMatrix,
            projectionMatrix = CameraAPI.projectionMatrix

        // NORMALIZED DEVICE SPACE
        const bBox = gpu.canvas.getBoundingClientRect()
        let xNormalized = ((x - bBox.x)/ bBox.width ) * 2 - 1,
            yNormalized = -((y - bBox.y )/ bBox.height) * 2 + 1

        // HOMOGENEOUS CLIP SPACE
        const homogeneousCoords = [xNormalized, yNormalized, 0, 0]

        // EYE SPACE
        const inverseProjection = mat4.invert([], projectionMatrix)
        const eyeCoords = vec4.transformMat4([], homogeneousCoords, inverseProjection)
        eyeCoords[2] = -1
        eyeCoords[3] = 1

        // WORLD SPACE
        const inverseView = mat4.invert([], viewMatrix)
        return vec4.transformMat4([], eyeCoords, inverseView)
    }
}