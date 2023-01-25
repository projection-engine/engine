import CameraEffectsSerialization from "./CameraEffectsSerialization";

interface CameraSerialization {
    translationSmoothing: number,
    metadata: CameraEffectsSerialization,
    rotation: number[],
    translation: number[]
}

export default CameraSerialization