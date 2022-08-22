import MaterialInstance from "../../production/libs/instances/MaterialInstance"

export default async function parseMaterialObject({cubeMapShader, shader, vertexShader, uniforms, uniformData, settings}, id) {
    let newMat
    await new Promise(resolve => {
        newMat = new MaterialInstance({
            vertex: vertexShader,
            fragment: shader,
            cubeMapShaderCode: cubeMapShader?.code,
            onCompiled: () => resolve(),
            settings,
            uniformData,
            id
        })
    })
    newMat.uniforms = uniforms
    return newMat

}