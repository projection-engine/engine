import MaterialUniform from "./MaterialUniform";

interface MaterialSettings {
    isSky: boolean
    doubleSided: boolean
    ssrEnabled: boolean
    isAlphaTested: boolean
    flatShading:boolean
}

interface MaterialInformation {
    functionDeclaration: string
    uniformsDeclaration: string
    uniformValues: MaterialUniform[]
    settings: MaterialSettings
    executionSignature:string
}

export default MaterialInformation