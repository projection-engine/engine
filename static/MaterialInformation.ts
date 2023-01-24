import MaterialUniform from "./MaterialUniform";

interface MaterialSettings {
    renderingMode: number
    doubleSided: boolean
    ssrEnabled: boolean
}

interface MaterialInformation {
    functionDeclaration: string
    uniformsDeclaration: string
    uniformValues: MaterialUniform[]
    settings: MaterialSettings
    executionSignature:string
}

export default MaterialInformation