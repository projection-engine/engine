
interface SSGISettings {
    blurSamples: number
    blurRadius: number
    stepSize: number
    maxSteps: number
    strength: number
    enabled: boolean
}
interface SSRSettings {
    falloff: number
    stepSize: number
    maxSteps: number
}
interface SSSSettings {
    maxDistance: number
    depthThickness: number
    edgeFalloff: number
    maxSteps: number
    depthDelta: number
}
interface SSAOSettings {
    enabled: boolean
    falloffDistance: number
    blurSamples: number
    maxSamples: number
    bias: number
    power: number
    radius: number
}
interface FXAASettings {
    FXAASpanMax: number
    FXAA: number
    FXAAReduceMin: number
    FXAAReduceMul: number
}


