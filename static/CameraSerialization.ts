import CameraEffectsSerialization from "./CameraEffectsSerialization";

interface CameraSerialization {
    rotationSmoothing: number,
    translationSmoothing: number,
    metadata: CameraEffectsSerialization,
    rotation: number[],
    translation: number[]
}

export default CameraSerialization