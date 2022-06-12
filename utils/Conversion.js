import {mat4, vec4} from "gl-matrix"
import {rotateY} from "../../components/viewport/transformCamera"

export default class Conversion {
    static toQuadCoord(coords, quadSize, canvas) {
        const target = canvas.getBoundingClientRect()
        const {x, y} = coords
        const {w, h} = quadSize

        const multiplierX = w / target.width
        const multiplierY = h / target.height

        return {
            x: x * multiplierX,
            y: h - y * multiplierY + target.top * multiplierY - 1
        }
    }

    static toScreen(x, y, canvas, camera){
        const viewMatrix = camera.viewMatrix,
            projectionMatrix = camera.projectionMatrix

        // NORMALIZED DEVICE SPACE
        const bBox = canvas.getBoundingClientRect()
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