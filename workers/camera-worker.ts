import {mat4, quat, vec3} from "gl-matrix";
import copyWithOffset from "../utils/copy-with-offset";
import CameraNotificationDecoder from "../lib/CameraNotificationDecoder";


class CameraWorker {
    static needsUpdate = false
    static translationBuffer: Float32Array
    static rotationBuffer: Float32Array
    static notificationBuffers: Float32Array
    static position: Float32Array
    static viewMatrix: Float32Array
    static projectionMatrix: Float32Array
    static invViewMatrix: Float32Array
    static invProjectionMatrix: Float32Array
    static viewProjectionMatrix: Float32Array
    static staticViewMatrix: Float32Array
    static initialized = false
    static projectionBuffer: Float32Array
    static skyboxProjectionMatrix: Float32Array
    static invSkyboxProjectionMatrix: Float32Array
    static currentTranslation = vec3.create()
    static currentRotation = quat.create()
    static projectionUBOBuffer: Float32Array
    static viewUBOBuffer: Float32Array

    static initialize(data: Float32Array[]) {
        const [
            notificationBuffers,
            position,
            viewMatrix,
            projectionMatrix,
            invViewMatrix,
            invProjectionMatrix,
            staticViewMatrix,
            translationBuffer,
            rotationBuffer,
            skyboxProjectionMatrix,
            invSkyboxProjectionMatrix,
            projectionBuffer,
            viewProjectionMatrix,
            viewUBOBuffer,
            projectionUBOBuffer
        ] = data
        if (CameraWorker.initialized)
            return

        CameraWorker.viewProjectionMatrix = viewProjectionMatrix
        CameraWorker.projectionBuffer = projectionBuffer
        CameraWorker.initialized = true
        CameraWorker.position = position
        CameraWorker.viewMatrix = viewMatrix
        CameraWorker.projectionMatrix = projectionMatrix
        CameraWorker.invViewMatrix = invViewMatrix
        CameraWorker.invProjectionMatrix = invProjectionMatrix
        CameraWorker.staticViewMatrix = staticViewMatrix
        CameraWorker.translationBuffer = translationBuffer
        CameraWorker.rotationBuffer = rotationBuffer
        CameraWorker.notificationBuffers = notificationBuffers
        CameraWorker.skyboxProjectionMatrix = skyboxProjectionMatrix
        CameraWorker.invSkyboxProjectionMatrix = invSkyboxProjectionMatrix
        vec3.copy(CameraWorker.currentTranslation, CameraWorker.translationBuffer)
        quat.copy(CameraWorker.currentRotation, CameraWorker.rotationBuffer)
        CameraWorker.viewUBOBuffer = viewUBOBuffer
        CameraWorker.projectionUBOBuffer = projectionUBOBuffer
        CameraNotificationDecoder.initialize(notificationBuffers)

        mat4.multiply(CameraWorker.viewProjectionMatrix, CameraWorker.projectionMatrix, CameraWorker.viewMatrix)
    }

    static updateProjection() {
        const isOrthographic = CameraNotificationDecoder.projectionType === CameraNotificationDecoder.ORTHOGRAPHIC
        const buffer = CameraWorker.projectionBuffer


        const aR = buffer[3]
        const fov = buffer[2]
        const zFar = buffer[0]
        const zNear = buffer[1]
        const orthographicProjectionSize = buffer[4]
        if (isOrthographic)
            mat4.ortho(CameraWorker.projectionMatrix, -orthographicProjectionSize, orthographicProjectionSize, -orthographicProjectionSize / aR, orthographicProjectionSize / aR, -zFar, zFar)
        else {
            mat4.perspective(CameraWorker.projectionMatrix, fov, aR, zNear, zFar)
            mat4.perspective(CameraWorker.skyboxProjectionMatrix, fov, aR, .1, 1000)
            mat4.invert(CameraWorker.invSkyboxProjectionMatrix, CameraWorker.skyboxProjectionMatrix)
        }

        mat4.invert(CameraWorker.invProjectionMatrix, CameraWorker.projectionMatrix)
        mat4.multiply(CameraWorker.viewProjectionMatrix, CameraWorker.projectionMatrix, CameraWorker.viewMatrix)
        CameraWorker.updateUBO()
    }

    static updateStaticViewMatrix() {
        const matrix = mat4.copy(CameraWorker.staticViewMatrix, CameraWorker.viewMatrix)
        matrix[12] = matrix[13] = matrix[14] = 0
        return matrix
    }


    static updateView() {
        mat4.fromRotationTranslation(CameraWorker.invViewMatrix, CameraWorker.currentRotation, CameraWorker.currentTranslation)
        mat4.invert(CameraWorker.viewMatrix, CameraWorker.invViewMatrix)
        const m = CameraWorker.invViewMatrix
        CameraWorker.position[0] = m[12]
        CameraWorker.position[1] = m[13]
        CameraWorker.position[2] = m[14]

        mat4.multiply(CameraWorker.viewProjectionMatrix, CameraWorker.projectionMatrix, CameraWorker.viewMatrix)
        CameraWorker.updateUBO()
        CameraWorker.updateStaticViewMatrix()
    }
static updateUBO(){
    const V = CameraWorker.viewUBOBuffer
    copyWithOffset(V, CameraWorker.viewProjectionMatrix, 0)
    copyWithOffset(V, CameraWorker.viewMatrix, 16)
    copyWithOffset(V, CameraWorker.invViewMatrix, 32)
    copyWithOffset(V, CameraWorker.position, 48)

    const P = CameraWorker.projectionUBOBuffer
    copyWithOffset(P, CameraWorker.projectionMatrix, 0)
    copyWithOffset(P, CameraWorker.invProjectionMatrix, 16)
}
    static execute() {
        const didViewChange = CameraNotificationDecoder.viewNeedsUpdate === 1
        CameraWorker.needsUpdate = CameraWorker.needsUpdate || didViewChange
        const elapsed = CameraNotificationDecoder.elapsed
        CameraNotificationDecoder.hasChangedView = 0
        CameraNotificationDecoder.hasChangedProjection = 0

        if (CameraWorker.needsUpdate) {
            const tSmoothing = CameraNotificationDecoder.translationSmoothing
            const incrementTranslation = tSmoothing === 0 ? 1 : 1 - Math.pow(.001, elapsed * tSmoothing)

            const lengthTranslationPrev = vec3.length(CameraWorker.currentTranslation)
            vec3.lerp(CameraWorker.currentTranslation, CameraWorker.currentTranslation, CameraWorker.translationBuffer, incrementTranslation)
            const lengthTranslationAfter = vec3.length(CameraWorker.currentTranslation)
            const lengthRotationPrev = quat.length(CameraWorker.currentRotation)
            quat.copy(CameraWorker.currentRotation, CameraWorker.rotationBuffer)
            const lengthRotationAfter = quat.length(CameraWorker.currentRotation)

            const offsetRotation = Math.abs(lengthRotationPrev - lengthRotationAfter)
            const offsetTranslation = Math.abs(lengthTranslationPrev - lengthTranslationAfter)
            if (offsetRotation > 0 || offsetTranslation > 1e-6) {
                CameraWorker.updateView()
                CameraNotificationDecoder.viewNeedsUpdate = 0
                CameraNotificationDecoder.hasChangedView = 1
            } else {
                CameraWorker.needsUpdate = false
                CameraNotificationDecoder.viewNeedsUpdate = 0
                CameraNotificationDecoder.hasChangedView = 0
            }
        }

        const cameraIsOrthographic = CameraNotificationDecoder.projectionType === CameraNotificationDecoder.ORTHOGRAPHIC
        if (CameraNotificationDecoder.projectionNeedsUpdate === 1 || cameraIsOrthographic && didViewChange) {
            CameraWorker.updateProjection()
            CameraNotificationDecoder.hasChangedProjection = 1
            CameraNotificationDecoder.hasChangedView = 1
            CameraNotificationDecoder.projectionNeedsUpdate = 0
        }

    }
}

self.onmessage = (event) => {
    if (!CameraWorker.initialized)
        CameraWorker.initialize(<Float32Array[]>event.data)
    CameraWorker.execute()
}