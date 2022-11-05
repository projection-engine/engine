import {v4} from "uuid"
import MATERIAL_RENDERING_TYPES from "../static/MATERIAL_RENDERING_TYPES";
import MaterialAPI from "../api/rendering/MaterialAPI";
import {DEFAULT_MATRICES} from "../static/SIMPLE_MATERIAL_UNIFORMS";
import GPUAPI from "../api/GPUAPI";
import CameraAPI from "../api/CameraAPI";
import LightsAPI from "../api/LightsAPI";

export default class Material {
    ready = false
    uniformData = {}
    uniforms = []
    #settings = {}
    hasCubeMap = false
    shadingType = MATERIAL_RENDERING_TYPES.DEFERRED
    isForwardShaded = false
    isDeferredShaded = true
    texturesInUse = {}
    updateTexture = {}
    instances = new Map()


    constructor({
                    vertex,
                    fragment,
                    uniformData,
                    settings,
                    id,
                    onCompiled,
                    cubeMapShaderCode
                }) {

        this.id = id ? id : v4().toString()
        this.settings = settings
        this.shader = [fragment, vertex, uniformData, onCompiled]
        if (cubeMapShaderCode !== undefined && cubeMapShaderCode !== null)
            this.cubeMapShader = [cubeMapShaderCode, vertex]
        else
            this.hasCubeMap = false
    }

    set settings(settings) {
        if (settings) {
            this.#settings = settings
            this.shadingType = settings.shadingType
            this.isForwardShaded = settings.shadingType === MATERIAL_RENDERING_TYPES.FORWARD || settings.shadingType === MATERIAL_RENDERING_TYPES.UNLIT
            this.isDeferredShaded = settings.shadingType === MATERIAL_RENDERING_TYPES.DEFERRED
        }
    }

    get settings() {
        return this.#settings
    }

    set cubeMapShader([shader, vertexShader]) {
        const v = shader !== undefined && shader !== null
        if (v) {
            this._cubeMapShader = GPUAPI.allocateShader(this.id + "-CUBE-MAP", vertexShader, shader)
            this.hasCubeMap = v
        }
    }

    get shader() {
        return this._shader
    }

    set shader([shader, vertexShader, u, onCompiled, settings]) {
        const uniformData = [...DEFAULT_MATRICES]
        if (u)
            uniformData.push(...u)
        if (this.ready)
            this.delete()
        this.ready = false
        this.settings = settings
        let message

        GPUAPI.destroyShader(this.id)
        GPUAPI.destroyShader(this.id + "-CUBE-MAP")

        this._shader = GPUAPI.allocateShader(this.id, vertexShader, shader)
        CameraAPI.UBO.bindWithShader(this._shader.program)
        if (this.shadingType === MATERIAL_RENDERING_TYPES.FORWARD) {
            LightsAPI.pointLightsUBO.bindWithShader(this._shader.program)
            LightsAPI.directionalLightsUBO.bindWithShader(this._shader.program)
        }
        MaterialAPI.updateMaterialUniforms(uniformData, this).then(() => {
            if (onCompiled)
                onCompiled(message)
            this.ready = true
            this.instances.forEach(matInstance => {
                matInstance.uniformData = this.uniformData
            })
        })
    }

    use(additionalUniforms = {}, isCubeMap = false, uniforms = this.uniformData) {
        const shader = isCubeMap ? this._cubeMapShader : this._shader

        if (shader) {
            Object.assign(uniforms, additionalUniforms)
            shader.bindForUse(uniforms)
        }
    }

    delete() {
        try {
            gpu.deleteProgram(this._shader.program)
            Object.values(this.uniformData).map(d => {
                if (d instanceof WebGLTexture)
                    gpu.deleteTexture(d)
            })
            Object.values(this.texturesInUse).forEach(t => {
                if (t && t.texture instanceof WebGLTexture)
                    gpu.deleteTexture(t.texture)
            })
            this.texturesInUse = {}
        } catch (err) {
            console.error(err)
        }
    }
}
