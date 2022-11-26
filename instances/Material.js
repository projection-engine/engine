import {v4} from "uuid"
import MaterialAPI from "../lib/rendering/MaterialAPI";
import GPUAPI from "../lib/rendering/GPUAPI";
import DEFAULT_VERTEX from "../shaders/uber-shader/UBER-MATERIAL.vert"
import VERTEX_SHADER from "../shaders/uber-shader/UBER-MATERIAL.vert"
import GPU from "../GPU";
import STATIC_SHADERS from "../static/resources/STATIC_SHADERS";
import GENERIC_FRAG_SHADER from "../shaders/uber-shader/UBER-MATERIAL-GENERIC.frag"
import BASIS_FRAG from "../shaders/uber-shader/UBER-MATERIAL-BASIS.frag"
import ConsoleAPI from "../lib/utils/ConsoleAPI";
import SceneRenderer from "../runtime/rendering/SceneRenderer";

export default class Material {
    static #uberShader
    static #fallbackUberShader
    static #useFallback = true
    static #initialized = false

    static compileUberShader() {
        if(Material.#uberShader)
            GPUAPI.destroyShader(STATIC_SHADERS.UBER_SHADER)
        const methodsToLoad = ["switch (materialID) {"], uniformsToLoad = []

        GPU.materials.forEach(mat => {
            console.log(mat)
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
        let fragment = BASIS_FRAG
        fragment = fragment.replace("//--UNIFORMS--", uniformsToLoad.join("\n"))
        fragment = fragment.replace("//--MATERIAL_SELECTION--", methodsToLoad.join("\n"))

        console.trace(fragment)
        console.trace(methodsToLoad, uniformsToLoad)

        const shader = GPUAPI.allocateShader(STATIC_SHADERS.UBER_SHADER, VERTEX_SHADER, fragment)
        if (shader.messages.hasError) {
            SceneRenderer.shader = Material.uberShader
            ConsoleAPI.error("Invalid shader", shader.messages)
            console.error("Invalid shader", shader.messages)
            return
        }

        Material.#uberShader = shader
        Material.#useFallback = false

        SceneRenderer.shader = Material.uberShader
    }

    static initialize() {
        if (Material.#initialized || !window.gpu)
            return
        Material.#initialized = true
        Material.#fallbackUberShader = GPUAPI.allocateShader(STATIC_SHADERS.FALLBACK_UBER_SHADER, DEFAULT_VERTEX, GENERIC_FRAG_SHADER)
        window.c = () => Material.compileUberShader()
        SceneRenderer.shader = Material.uberShader
    }

    static forceFallbackShader() {
        Material.#useFallback = true
        SceneRenderer.shader = Material.uberShader
    }

    static get uberShader() {
        if (Material.#useFallback)
            return Material.#fallbackUberShader
        return Material.#uberShader
    }

    #ready = false
    #id = ""
    #uniformValues = {}
    #uniforms = []
    #functionDeclaration
    #uniformsDeclaration
    texturesInUse = {}
    isAlphaTested = false
    depthMask = true
    cullFace = true
    noDepthTest
    bindID = -1

    constructor(id) {
        this.#id = id ? id : v4()
    }

    get id() {
        return this.#id
    }

    get ready() {
        return this.#ready
    }

    get uniforms() {
        return this.#uniforms
    }
    get uniformValues() {
        return this.#uniformValues
    }
    get functionDeclaration() {
        return this.#functionDeclaration
    }

    get uniformsDeclaration() {
        return this.#uniformsDeclaration
    }

    updateMaterialDeclaration(functionDeclaration, uniforms) {
        this.#functionDeclaration = functionDeclaration
        this.#uniformsDeclaration = uniforms
    }

    async updateUniformGroup(uniforms) {
        this.#uniforms = uniforms
        await MaterialAPI.updateMaterialUniforms(this)
    }

    async updateUniformAttribute(key, data) {
        const ind = this.#uniforms.findIndex(d => d.key === key)
        if (ind === -1)
            return false
        try {
            if(this.#uniforms[ind]) {
                this.#uniforms[ind] = data
                await MaterialAPI.updateMaterialUniforms(this)
                return true
            }
        } catch (err) {
            ConsoleAPI.error(err)
        }
        return false
    }
}
