interface CameraEffectsSerialization{
    zNear:number
    zFar:number
    fov:number
    aspectRatio:number
    size:number
    focusDistanceDOF:number
    apertureDOF:number
    focalLengthDOF:number
    samplesDOF:number
    filmGrainStrength:number
    vignetteStrength:number
    bloomThreshold:number
    bloomQuality:number
    bloomOffset:number
    gamma:number
    exposure:number
    chromaticAberrationStrength:number
    distortionStrength:number
    cameraMotionBlur:boolean
    DOF:boolean
    bloom:boolean
    filmGrain:boolean
    vignetteEnabled:boolean
    chromaticAberration:boolean
    distortion:boolean
}
export default CameraEffectsSerialization