import {mat4} from "gl-matrix"

export default class RootCameraInstance {
    position = [0, 10, 0]
    rotation = [0, 0, 0, 1]
    zNear = .1
    zFar = 1000
    fov = Math.PI / 2
    aspectRatio = 1
    viewMatrix = mat4.create()
    projectionMatrix = mat4.create()
    centerOn = [0, 0, 0]


    distortion = false
    distortionStrength = 1
    chromaticAberration = false
    chromaticAberrationStrength = 1

    filmGrain = false
    filmGrainStrength =1
    bloom = false
    bloomStrength = 1
    bloomThreshold = .75
    gamma = 2.2
    exposure = 1
    ortho = false
    size = 100

    constructor() {
        this.updateProjection()
        this.updateViewMatrix()
    }


    updateProjection() {
        if (this.ortho)
            mat4.ortho(this.projectionMatrix, -this.size, this.size, -this.radius / this.aspectRatio, this.size / this.aspectRatio, this.zNear, this.zFar)
        else
            mat4.perspective(this.projectionMatrix, this.fov, this.aspectRatio, this.zNear, this.zFar)
    }

    getNotTranslatedViewMatrix() {
        let m = [...this.viewMatrix].flat()
        m[12] = m[13] = m[14] = 0
        return m
    }

    updateViewMatrix() {
        mat4.fromRotationTranslation(this.viewMatrix, this.rotation, this.position)
        mat4.invert(this.viewMatrix, this.viewMatrix)
    }

    updateViewTarget(cameraObj, transformation){
        this.position = transformation.translation
        this.rotation = transformation.rotationQuat

        this.zFar = cameraObj.zFar
        this.zNear = cameraObj.zNear

        this.fov = cameraObj.fov
        this.aspectRatio = cameraObj.aspectRatio
        this.distortion =   cameraObj.distortion
        this.distortionStrength = cameraObj.distortionStrength
        this.chromaticAberration = cameraObj.chromaticAberration
        this.chromaticAberrationStrength = cameraObj.chromaticAberrationStrength

        this.filmGrain = cameraObj.filmGrain
        this.filmGrainStrength = cameraObj.filmGrainStrength
        this.bloom = cameraObj.bloom
        this.bloomStrength = cameraObj.bloomStrength
        this.bloomThreshold = cameraObj.bloomThreshold
        this.gamma = cameraObj.gamma
        this.exposure = cameraObj.exposure
        this.ortho = cameraObj.ortho
        this.size = cameraObj.size

        this.updateViewMatrix()
        this.updateProjection()
    }
}

