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
import UBO from "../instances/UBO";

export default class UberShader {

    static #initialized = false
    static MAX_LIGHTS = 310

    static UBO:UBO
    static #uberSignature = {}
    static get uberSignature() {
        return UberShader.#uberSignature
    }

    static uber?: Shader
    static uberUniforms?: { [key: string]: WebGLUniformLocation }

    static initialize() {
        if (UberShader.#initialized)
            return
        UberShader.#initialized = true
        UberShader.UBO = new UBO(
            "UberShaderSettings",
            [
                {name: "shadowMapsQuantity", type: "float"},
                {name: "shadowMapResolution", type: "float"},
                {name: "lightQuantity", type: "int"},

                {type: "float", name: "SSRFalloff"},
                {type: "float", name: "stepSizeSSR"},
                {type: "float", name: "maxSSSDistance"},
                {type: "float", name: "SSSDepthThickness"},
                {type: "float", name: "SSSEdgeAttenuation"},
                {type: "float", name: "skylightSamples"},
                {type: "float", name: "SSSDepthDelta"},
                {type: "float", name: "SSAOFalloff"},
                {type: "int", name: "maxStepsSSR"},
                {type: "int", name: "maxStepsSSS"},
                {type: "bool", name: "hasSkylight"},
                {type: "bool", name: "hasAmbientOcclusion"},

                {name: "lightPrimaryBuffer", type: "mat4", dataLength: UberShader.MAX_LIGHTS},
                {name: "lightSecondaryBuffer", type: "mat4", dataLength: UberShader.MAX_LIGHTS},
                {name: "lightTypeBuffer", type: "int", dataLength: UberShader.MAX_LIGHTS}
            ]
        )
    }

    static compile(forceCleanShader?: boolean) {

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

            if (!UberShader.uber && !forceCleanShader)
                UberShader.compile(true)
            console.error("Invalid shader", shader.messages)

            return
        }
        if (UberShader.uber)
            GPU.context.deleteProgram(UberShader.uber.program)

        UberShader.uber = shader
        UberShader.uberUniforms = shader.uniformMap
        UberShader.UBO.bindWithShader(shader.program)
    }
}