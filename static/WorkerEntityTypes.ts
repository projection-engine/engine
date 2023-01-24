interface WorkerEntity{
    [key:string]:any
    id: string
    __changedBuffer: Uint8Array
    previousModelMatrix: Float32Array
    matrix: Float32Array
    parentChangedBuffer?: Float32Array
    _rotationQuat: Float32Array
    _translation: Float32Array
    _scaling: Float32Array
    pivotPoint: Float32Array
    baseTransformationMatrix: Float32Array
    absoluteTranslation: Float32Array
    parentMatrix?: Float32Array
    cullingMetadata: Float32Array
}