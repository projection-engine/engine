import MaterialUniform from "./MaterialUniform";

interface MaterialSettings {
    isSky: boolean
    doubleSided: boolean
    ssrEnabled: boolean
    isAlphaTested: boolean
}

interface MaterialInformation {
    functionDeclaration: string
    uniformsDeclaration: string
    uniformsData: MaterialUniform[]
    settings: MaterialSettings
}

export default MaterialInformation