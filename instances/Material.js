import {v4} from "uuid"
import MaterialAPI from "../lib/rendering/MaterialAPI";
import GPUAPI from "../lib/rendering/GPUAPI";
import VERTEX_SHADER from "../shaders/uber-shader/UBER-MATERIAL.vert"
import GPU from "../lib/GPU";
import STATIC_SHADERS from "../static/resources/STATIC_SHADERS";
import BASIS_FRAG from "../shaders/uber-shader/UBER-MATERIAL-BASIS.frag"
import DEBUG_FRAG from "../shaders/uber-shader/UBER-MATERIAL-DEBUG.frag"

import ConsoleAPI from "../lib/utils/ConsoleAPI";
import SceneRenderer from "../runtime/rendering/SceneRenderer";
import Engine from "../Engine";

export default class Material {
    static #uberShader
    static #initialized = false

    static compileUberShader(forceCleanShader) {
        if (Material.#uberShader)
            GPUAPI.destroyShader(STATIC_SHADERS.UBER_SHADER)
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

        const shader = GPUAPI.allocateShader("TEMP_SHADER", VERTEX_SHADER, fragment)

        if (shader.messages.hasError) {
            if (!Material.#uberShader) {
                Material.compileUberShader(true)
            }
            ConsoleAPI.error("Invalid shader", shader.messages)
            console.error("Invalid shader", shader.messages)
            return
        } else {
            GPU.shaders.delete("TEMP_SHADER")
            GPU.shaders.set(STATIC_SHADERS.UBER_SHADER, shader)
        }

        Material.#uberShader = shader

        SceneRenderer.shader = Material.uberShader
    }

    static initialize() {
        if (Material.#initialized || !window.gpu)
            return
        Material.#initialized = true
        Material.compileUberShader()
        SceneRenderer.shader = Material.uberShader
    }

    static get uberShader() {
        return Material.#uberShader
    }

    #id = ""
    #uniformValues = {}
    #uniforms = []
    #functionDeclaration
    #uniformsDeclaration
    texturesInUse = {}
    isAlphaTested = false
    ssrEnabled = false
    isSky = false
    doubleSided = false

    bindID = -1

    constructor(id) {
        this.#id = id ? id : v4()
    }

    get id() {
        return this.#id
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
            if (this.#uniforms[ind]) {
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
