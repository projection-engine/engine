import {v4} from "uuid"
import MATERIAL_RENDERING_TYPES from "../static/MATERIAL_RENDERING_TYPES";
import MaterialAPI from "../lib/rendering/MaterialAPI";
import {DEFAULT_MATRICES} from "../static/SIMPLE_MATERIAL_UNIFORMS";
import GPUAPI from "../lib/rendering/GPUAPI";
import LightsAPI from "../lib/rendering/LightsAPI";
import DEFAULT_VERTEX from "../shaders/uber-shader/UBER-MATERIAL.vert"
import GPU from "../GPU";
import STATIC_SHADERS from "../static/resources/STATIC_SHADERS";
import GENERIC_FRAG_SHADER from "../shaders/uber-shader/UBER-MATERIAL-GENERIC.frag"
import BASIS_FRAG_SHADER from "../shaders/uber-shader/UBER-MATERIAL-BASIS.frag"
import VERTEX_SHADER from "../shaders/uber-shader/UBER-MATERIAL.vert"
import ConsoleAPI from "../lib/utils/ConsoleAPI";

/**
 * cullFace: 0 = BACK, 1 = FRONT, OTHER = NONE
 */
export default class Material {
    static #uberShader
    static #fallbackUberShader
    static #useFallback = true
    static #initialized = false

    static compileUberShader() {
        const methodsToLoad = [], uniformsToLoad = []

        GPU.materials.forEach(mat => {
            methodsToLoad.push(mat.functionDeclaration)
            uniformsToLoad.push(mat.uniformsDeclaration)
        })

        const shader = GPUAPI.allocateShader(STATIC_SHADERS.UBER_SHADER, VERTEX_SHADER,)
        if (!shader.messages.hasError) {
            ConsoleAPI.error("Invalid shader", shader.messages)
            console.error("Invalid shader", shader.messages)
            return
        }
        Material.#uberShader = shader
        Material.#useFallback = false
    }

    static initialize() {
        if (Material.#initialized || !window.gpu)
            return
        Material.#initialized = true
        Material.#fallbackUberShader = GPUAPI.allocateShader(STATIC_SHADERS.FALLBACK_UBER_SHADER, DEFAULT_VERTEX, GENERIC_FRAG_SHADER)
    }

    static forceFallbackShader() {
        Material.#useFallback = true
    }

    static get uberShader() {
        if (Material.#useFallback)
            return Material.#fallbackUberShader
        return Material.#uberShader
    }

    #ready = false
    #id = ""
    #uniformMetadata = []
    #functionDeclaration
    #uniformsDeclaration

    isAlphaTested = false
    cullFace = 0
    noDepthTest

    constructor(id) {
        this.#id = id ? id : v4()
    }

    get id() {
        return this.#id
    }

    get ready() {
        return this.#ready
    }

    get uniformMetadata() {
        return this.#uniformMetadata
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

    async updateUniformGroup(uniformMetadata) {
        this.#uniformMetadata = uniformMetadata
        this.#ready = false
        await MaterialAPI.updateMaterialUniforms(this)
        this.#ready = true
    }

    async updateUniformAttribute(key, data) {
        const ind = this.#uniformMetadata.findIndex(d => d.key === key)
        if (ind === -1)
            return false
        try {
            this.#uniformMetadata[ind] = data
            await MaterialAPI.updateMaterialUniforms(this)
            return true
        } catch (err) {
            ConsoleAPI.error(err)
            return false
        }
    }
}
