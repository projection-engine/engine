import {mat4, vec3} from "gl-matrix"
import PostProcessing from "./PostProcessing";
import COMPONENTS from "../../../static/COMPONENTS.json";
import Engine from "../../Engine";
import ENVIRONMENT from "../../../static/ENVIRONMENT";
import SkyboxPass from "../../passes/rendering/SkyboxPass";

export default class CameraAPI {
    static isOrthographic = false
    static metadata = new PostProcessing()
    static position = vec3.create()
    static viewMatrix = mat4.create()
    static projectionMatrix = mat4.create()
    static invViewMatrix = mat4.create()
    static invProjectionMatrix = mat4.create()
    static staticViewMatrix = mat4.create()

    static updateProjection(orthoSize = CameraAPI.metadata.size) {
        const aR = CameraAPI.metadata.aspectRatio
        if (CameraAPI.isOrthographic)
            mat4.ortho(CameraAPI.projectionMatrix, -orthoSize, orthoSize, -orthoSize / aR, orthoSize / aR, CameraAPI.metadata.zNear, CameraAPI.metadata.zFar)
        else
            mat4.perspective(CameraAPI.projectionMatrix, CameraAPI.metadata.fov, aR, CameraAPI.metadata.zNear, CameraAPI.metadata.zFar)

        mat4.invert(CameraAPI.invProjectionMatrix, CameraAPI.projectionMatrix)
        SkyboxPass.projectionMatrix = mat4.perspective([], CameraAPI.metadata.fov, aR, .1, 1000)
    }

    static #updateStaticViewMatrix() {
        const matrix = mat4.copy(CameraAPI.staticViewMatrix, CameraAPI.viewMatrix)
        matrix[12] = matrix[13] = matrix[14] = 0
        return matrix
    }

    static directTransformation(translation, rotation) {
        mat4.fromRotationTranslation(CameraAPI.invViewMatrix, rotation, translation)
        mat4.invert(CameraAPI.viewMatrix, CameraAPI.invViewMatrix)

        const m = CameraAPI.invViewMatrix
        CameraAPI.position[0] = m[12]
        CameraAPI.position[1] = m[13]
        CameraAPI.position[2] = m[14]
        CameraAPI.#updateStaticViewMatrix()
    }

    static sphericalTransformation(rotationVec, radius, centerOn) {
        const [yaw, pitch] = rotationVec

        const cosPitch = Math.cos(pitch)

        CameraAPI.position[0] = radius * cosPitch * Math.cos(yaw) + centerOn[0]
        CameraAPI.position[1] = radius * Math.sin(pitch) + centerOn[1]
        CameraAPI.position[2] = radius * cosPitch * Math.sin(yaw) + centerOn[2]
        mat4.lookAt(CameraAPI.viewMatrix, CameraAPI.position, centerOn, [0, 1, 0])
        mat4.invert(CameraAPI.invViewMatrix, CameraAPI.viewMatrix)
        CameraAPI.#updateStaticViewMatrix()

        if (CameraAPI.isOrthographic)
            CameraAPI.updateProjection(radius)

    }

    static updateViewTarget(entity) {
        if (!entity?.components || Engine.environment === ENVIRONMENT.DEV)
            return
        const cameraObj = entity.components.get(COMPONENTS.CAMERA)

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

