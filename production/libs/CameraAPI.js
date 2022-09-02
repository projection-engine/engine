import {mat4} from "gl-matrix"
import CameraPostProcessing from "../templates/CameraPostProcessing";
import COMPONENTS from "../data/COMPONENTS";
import RendererController from "../controllers/RendererController";
import ENVIRONMENT from "../data/ENVIRONMENT";

export default class CameraAPI extends CameraPostProcessing {
    static isOrthographic = false
    static metadata = new CameraPostProcessing()
    static position = [0, 0, 0]
    static viewMatrix = mat4.create()
    static projectionMatrix = mat4.create()
    static invViewMatrix = mat4.create()
    static invProjectionMatrix = mat4.create()

    static updateProjection(orthoSize = CameraAPI.metadata.size) {
        const aR = CameraAPI.metadata.aspectRatio
        if (CameraAPI.isOrthographic)
            mat4.ortho(CameraAPI.projectionMatrix, -orthoSize, orthoSize, -orthoSize / aR, orthoSize / aR, CameraAPI.metadata.zNear, CameraAPI.metadata.zFar)
        else
            mat4.perspective(CameraAPI.projectionMatrix, CameraAPI.metadata.fov, aR, CameraAPI.metadata.zNear, CameraAPI.metadata.zFar)

        mat4.invert(CameraAPI.invProjectionMatrix, CameraAPI.projectionMatrix)
    }

    static get staticViewMatrix() {
        const matrix = [...CameraAPI.viewMatrix]
        matrix[12] = matrix[13] = matrix[14] = 0
        return matrix
    }

    static directTransformation(translation, rotation) {
        mat4.fromRotationTranslation(CameraAPI.invViewMatrix, rotation, translation)
        mat4.invert(CameraAPI.viewMatrix, CameraAPI.invViewMatrix)

        const m = CameraAPI.invViewMatrix
        CameraAPI.position = [m[12], m[13], m[14]]
    }

    static sphericalTransformation(rotationVec, radius, centerOn) {
        const [yaw, p] = rotationVec
        let pitch = p
        if (pitch >= Math.PI/2)
            pitch = 1.57
        if (pitch <= -Math.PI/2)
            pitch = -1.57

        const cosPitch = Math.cos(pitch)
        const position = []
        position[0] = radius * cosPitch * Math.cos(yaw) + centerOn[0]
        position[1] = radius * Math.sin(pitch) + centerOn[1]
        position[2] = radius * cosPitch * Math.sin(yaw) + centerOn[2]

        mat4.lookAt(CameraAPI.viewMatrix, position, centerOn, [0, 1, 0])
        mat4.invert(CameraAPI.invViewMatrix, CameraAPI.viewMatrix)

        const m = CameraAPI.invViewMatrix
        CameraAPI.position = [m[12], m[13], m[14]]

        if (CameraAPI.isOrthographic)
            CameraAPI.updateProjection(radius)
    }

    static updateViewTarget(entity) {

        if (!entity?.components || RendererController.environment === ENVIRONMENT.DEV)
            return
        const cameraObj = entity.components[COMPONENTS.CAMERA]

        if (!cameraObj)
            return
        CameraAPI.directTransformation(entity.translation, entity.rotationQuaternion)
        CameraAPI.metadata.zFar = cameraObj.zFar
        CameraAPI.metadata.zNear = cameraObj.zNear
        CameraAPI.metadata.fov = cameraObj.fov
        CameraAPI.metadata.aspectRatio = cameraObj.aspectRatio
        CameraAPI.metadata.distortion = cameraObj.distortion
        CameraAPI.metadata.distortionStrength = cameraObj.distortionStrength
        CameraAPI.metadata.chromaticAberration = cameraObj.chromaticAberration
        CameraAPI.metadata.chromaticAberrationStrength = cameraObj.chromaticAberrationStrength
        CameraAPI.metadata.filmGrain = cameraObj.filmGrain
        CameraAPI.metadata.filmGrainStrength = cameraObj.filmGrainStrength
        CameraAPI.metadata.bloom = cameraObj.bloom
        CameraAPI.metadata.bloomStrength = cameraObj.bloomStrength
        CameraAPI.metadata.bloomThreshold = cameraObj.bloomThreshold
        CameraAPI.metadata.gamma = cameraObj.gamma
        CameraAPI.metadata.exposure = cameraObj.exposure
        CameraAPI.isOrthographic = cameraObj.ortho
        CameraAPI.metadata.size = cameraObj.size

        CameraAPI.updateProjection()
    }
}

