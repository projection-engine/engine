import GPU from "../GPU";
import Engine from "../Engine";
// @ts-ignore
import DEBUG_FRAG from "../shaders/uber-shader/UBER-MATERIAL-DEBUG.frag";
// @ts-ignore
import BASIS_FRAG from "../shaders/uber-shader/UBER-MATERIAL-BASIS.frag";
// @ts-ignore
import VERTEX_SHADER from "../shaders/uber-shader/UBER-MATERIAL.vert";
import StaticShaders from "../lib/StaticShaders";
import Shader from "../instances/Shader";
import LightsAPI from "../lib/utils/LightsAPI";
import SceneRenderer from "../runtime/SceneRenderer";

export default function compileUberShader(forceCleanShader?: boolean) {
    const methodsToLoad = ["switch (materialID) {"], uniformsToLoad = []

    if (!forceCleanShader)
        GPU.materials.forEach(mat => {
            const declaration = [`case ${mat.bindID}: {`, mat.functionDeclaration, "break;", "}", ""]
            methodsToLoad.push(declaration.join("\n"))
            uniformsToLoad.push(mat.uniformsDeclaration)
        })
    methodsToLoad.push(`
            default:
                N = normalVec;
                break;
            }
        `)

    let fragment = Engine.developmentMode ? DEBUG_FRAG : BASIS_FRAG
    fragment = fragment.replace("//--UNIFORMS--", uniformsToLoad.join("\n"))
    fragment = fragment.replace("//--MATERIAL_SELECTION--", methodsToLoad.join("\n"))

    const shader = new Shader(VERTEX_SHADER, fragment)

    if (shader.messages.hasError) {
        if (!StaticShaders.uber)
            compileUberShader(true)
        console.error("Invalid shader", shader.messages)
        console.error("Invalid shader", shader.messages)
        return
    } else if (StaticShaders.uber)
        GPU.context.deleteProgram(StaticShaders.uber.program)

    LightsAPI.lightsMetadataUBO.bindWithShader(shader.program)
    LightsAPI.lightsUBOA.bindWithShader(shader.program)
    LightsAPI.lightsUBOB.bindWithShader(shader.program)
    LightsAPI.lightsUBOC.bindWithShader(shader.program)
    SceneRenderer.UBO.bindWithShader(shader.program)
    StaticShaders.uber = shader
    StaticShaders.uberUniforms = shader.uniformMap
}
