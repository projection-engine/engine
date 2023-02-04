interface WorkerEntity{
    [key:string]:any
    id: string
    changedBuffer: Uint8Array
    previousModelMatrix: Float32Array
    matrix: Float32Array
    parentChangedBuffer?: Uint8Array
    rotationQuaternion: Float32Array
    translation: Float32Array
    scaling: Float32Array
    pivotPoint: Float32Array
    baseTransformationMatrix: Float32Array
    absoluteTranslation: Float32Array
    parentMatrix?: Float32Array
    cullingMetadata: Float32Array
    rotationType: Float32Array
    rotationEuler: Float32Array
    rotationQuaternionFinal: Float32Array
}