import GPU from "../GPU";
import Engine from "../Engine";
import DEBUG_FRAG from "../shaders/uber-shader/UBER-MATERIAL-DEBUG.frag";
import BASIS_FRAG from "../shaders/uber-shader/UBER-MATERIAL-BASIS.frag";
import VERTEX_SHADER from "../shaders/uber-shader/UBER-MATERIAL.vert";
import StaticShaders from "../lib/StaticShaders";
import Shader from "../instances/Shader";
import MutableObject from "../MutableObject";
import LightsAPI from "../lib/utils/LightsAPI";
import SceneRenderer from "../runtime/SceneRenderer";

export default class UberShader {
    static #uberSignature = {}
    static get uberSignature() {
        return UberShader.#uberSignature
    }

    static uber?: Shader
    static uberUniforms?: { [key: string]: WebGLUniformLocation }

    static compile(forceCleanShader?: boolean) {
        const OLD = UberShader.uber
        UberShader.uber = undefined
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

            if (!OLD && !forceCleanShader)
                UberShader.compile(true)
            console.error("Invalid shader", shader.messages)
            UberShader.uber = OLD
            return
        }
        if (OLD)
            GPU.context.deleteProgram(OLD.program)

        UberShader.uber = shader
        UberShader.uberUniforms = shader.uniformMap

        LightsAPI.lightsMetadataUBO.bindWithShader(shader.program)
        LightsAPI.lightsUBOA.bindWithShader(shader.program)
        LightsAPI.lightsUBOB.bindWithShader(shader.program)
        LightsAPI.lightsUBOC.bindWithShader(shader.program)
        if (SceneRenderer.UBO !== undefined)
            SceneRenderer.UBO.bindWithShader(shader.program)

    }
}