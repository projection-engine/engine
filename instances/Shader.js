import SHADOW_METHODS from "../shaders/utils/SHADOW_METHODS.glsl"
import {PBR} from "../shaders/templates/PBR"
import GPU from "../GPU";
import RAY_MARCHER from "../shaders/utils/RAY_MARCHER.glsl"
import ACES from "../shaders/utils/ACES.glsl"
import PARALLAX_OCCLUSION_MAPPING from "../shaders/utils/PARALLAX_OCCLUSION_MAPPING.glsl"
import COMPUTE_TBN from "../shaders/utils/COMPUTE_TBN.glsl"
import SSR from "../shaders/utils/SSR.glsl"
import SSGI from "../shaders/utils/SSGI.glsl"
import SAMPLE_INDIRECT_LIGHT from "../shaders/utils/SAMPLE_INDIRECT_LIGHT.glsl"

const TYPES = {
    "vec2": "uniform2fv",
    "vec3": "uniform3fv",
    "vec4": "uniform4fv",
    "mat3": "uniformMatrix3fv",
    "mat4": "uniformMatrix4fv",
    "float": "uniform1f",
    "int": "uniform1i",
    "sampler2D": "sampler2D",
    "samplerCube": "cubemap",
    "ivec2": "uniform2iv",
    "ivec3": "uniform3iv",
    "bool": "uniform1i"
}

export const METHODS = {

    computeShadows: "//import(computeShadows)",

    distributionGGX: "//import(distributionGGX)",
    geometrySchlickGGX: "//import(geometrySchlickGGX)",
    geometrySmith: "//import(geometrySmith)",
    fresnelSchlick: "//import(fresnelSchlick)",

    computeDirectionalLight: "//import(computeDirectionalLight)",
    computePointLight: "//import(computePointLight)",

    SSR: "//import(SSR)",
    SSGI: "//import(SSGI)",
    computeTBN: "//import(computeTBN)",
    rayMarcher: "//import(rayMarcher)",
    aces: "//import(aces)",
    parallaxOcclusionMapping: "//import(parallaxOcclusionMapping)",
    sampleIndirectLight: "//import(sampleIndirectLight)"
}


function applyMethods(shaderCode) {
    let response = shaderCode

    Object.keys(METHODS).forEach(key => {
        switch (true) {
            case key === "sampleIndirectLight":
                response = response.replaceAll(METHODS[key], SAMPLE_INDIRECT_LIGHT)
                break
            case key === "SSGI":
                response = response.replaceAll(METHODS[key], SSGI)
                break
            case key === "SSR":
                response = response.replaceAll(METHODS[key], SSR)
                break
            case key === "computeTBN":
                response = response.replaceAll(METHODS[key], COMPUTE_TBN)
                break
            case key === "parallaxOcclusionMapping":
                response = response.replaceAll(METHODS[key], PARALLAX_OCCLUSION_MAPPING)
                break
            case key === "rayMarcher":
                response = response.replaceAll(METHODS[key], RAY_MARCHER)
                break
            case key === "aces":
                response = response.replaceAll(METHODS[key], ACES)
                break
            case key === "computeShadows":
                response = response.replaceAll(METHODS[key], SHADOW_METHODS)
                break

            case PBR[key] != null:
                response = response.replaceAll(METHODS[key], PBR[key])
                break
            default:
                console.log(key)
                break
        }
    })
    return response
}


export default class Shader {
    available = false
    static regex = /uniform(\s+)(highp|mediump|lowp)?(\s*)((\w|_)+)((\s|\w|_)*);/gm
    static structRegex = (type) => {
        return new RegExp(`(struct\\s+${type}\\s*\\s*{.+?(?<=}))`, "gs")
    }
    static defineRegex = (global) => {
        return new RegExp("#define(\\s+)((\\w|_)+)(\\s+)(.+)", global ? "gmi" : "mi")
    }
    static regexMatch = /uniform(\s+)(highp|mediump|lowp)?(\s*)((\w|_)+)((\s|\w|_)*);$/m
    static regexArray = (global) => {
        return new RegExp("uniform(\\s+)(highp|mediump|lowp)?(\\s*)((\\w|_)+)((\\s|\\w|_)*)\\[(\\w+)\\](\\s*);$", global ? "gm" : "m")
    }

    uniformMap = {}
    length = 0

    constructor(vertex, fragment, setMessage) {
        let alert = []
        this.program = gpu.createProgram()
        const vCode = this.#compileShader(trimString(vertex), gpu.VERTEX_SHADER, m => alert.push(m))
        const fCode = this.#compileShader(trimString(fragment), gpu.FRAGMENT_SHADER, m => alert.push(m))

        this.uniforms = [...this.#extractUniforms(vCode), ...this.#extractUniforms(fCode)].flat().filter(u => {
            return typeof u.uLocation === "object" || typeof u.uLocations === "object"
        })

        for (let i = 0; i < this.uniforms.length; i++)
            this.uniformMap[this.uniforms[i].name] = this.uniforms[i].uLocation || this.uniforms[i].uLocations


        if (typeof setMessage === "function")
            setMessage({
                error: gpu.getError(),
                messages: alert,
                hasError: alert.length > 0
            })



        this.length = this.uniforms.length
    }

    #compileShader(shaderCode, shaderType, pushMessage) {
        const bundledCode = applyMethods(shaderCode)

        const shader = gpu.createShader(shaderType)
        gpu.shaderSource(shader, bundledCode)
        gpu.compileShader(shader)
        let compiled = gpu.getShaderParameter(shader, gpu.COMPILE_STATUS)

        if (!compiled) {
            console.log(shaderCode)
            console.error(gpu.getShaderInfoLog(shader))
            pushMessage(gpu.getShaderInfoLog(shader))
            this.available = false
        } else {
            gpu.attachShader(this.program, shader)
            gpu.linkProgram(this.program)

            this.available = true
        }
        return bundledCode
    }

    #extractUniforms(code) {
        let uniformObjects = []
        const uniforms = code.match(Shader.regex)
        if (uniforms)
            uniforms.forEach(u => {
                const match = u.match(Shader.regexMatch)
                if (!match)
                    return;
                const type = match[4]
                const name = match[6].replace(" ", "").trim()

                if (TYPES[type] != null) {
                    uniformObjects.push({
                        type,
                        name,
                        uLocation: gpu.getUniformLocation(this.program, name)
                    })
                    return
                }
                let struct = code.match(Shader.structRegex(type))
                const reg = /^(\s*)(\w+)(\s*)((\w|_)+)/m
                if (!struct)
                    return
                struct = struct[0].split("\n").filter(e => Object.keys(TYPES).some(v => e.includes(v)))
                uniformObjects.push(
                    ...struct.map(s => {
                        const current = s.match(reg)
                        if (current) {
                            return {
                                type: current[2],
                                name: current[4],
                                parent: name,
                                uLocation: gpu.getUniformLocation(this.program, name + "." + current[4])
                            }
                        }
                    }).filter(e => e !== undefined)
                )
            })
        const arrayUniforms = code.match(Shader.regexArray(true))
        const definitions = code.match(Shader.defineRegex(true))
        if (arrayUniforms)
            arrayUniforms.forEach(u => {
                const match = u.match(Shader.regexArray(false))

                if (!match)
                    return
                const type = match[4]
                const name = match[6].replace(" ", "")
                const define = definitions.find(d => d.includes(match[8]))?.match(Shader.defineRegex(false))

                if (!define) return;
                const arraySize = parseInt(define[5])
                if (TYPES[type] !== undefined) {
                    uniformObjects.push({
                        type,
                        name,
                        arraySize,
                        uLocations: (new Array(arraySize).fill(null)).map((_, i) => gpu.getUniformLocation(this.program, name + `[${i}]`))
                    })
                    return
                }
                let struct = code.match(Shader.structRegex(type))
                const reg = /^(\s*)(\w+)(\s*)((\w|_)+)/m

                if (!struct)
                    return;
                struct = struct[0].split("\n").filter(e => Object.keys(TYPES).some(v => e.includes(v)))
                uniformObjects.push(
                    ...struct.map(s => {
                        const current = s.match(reg)
                        if (!current)
                            return
                        return {
                            type: current[2],
                            name: current[4],
                            parent: name,
                            arraySize,
                            uLocations: (new Array(arraySize).fill(null)).map((_, i) => gpu.getUniformLocation(this.program, name + `[${i}]` + "." + current[4]))
                        }
                    }).filter(e => e !== undefined)
                )
            })

        return uniformObjects
    }
    bind(){
        if (GPU.activeShader !== this.program)
            gpu.useProgram(this.program)
        GPU.activeShader = this.program
    }

    bindForUse(data) {
        if (GPU.activeShader !== this.program)
            gpu.useProgram(this.program)

        GPU.activeShader = this.program
        let currentSamplerIndex = 0
        const increase = () => currentSamplerIndex++
        for (let v = 0; v < this.length; v++) {
            const current = this.uniforms[v]
            if (current.uLocations != null) {
                const dataAttr = current.parent !== undefined ? data[current.parent] : data[current.name]
                if (!dataAttr)
                    continue
                for (let i = 0; i < current.uLocations.length; i++) {
                    const u = current.uLocations[i]
                    const d = dataAttr[i]
                    if (current.parent)
                        Shader.bind(u, d[current.name], current.type, currentSamplerIndex, increase)
                    else
                        Shader.bind(u, d, current.type, currentSamplerIndex, increase)
                }
            } else {
                const dataAttribute = current.parent !== undefined ? data[current.parent][current.name] : data[current.name]
                Shader.bind(current.uLocation, dataAttribute, current.type, currentSamplerIndex, increase)
            }
        }

    }

    static bind(uLocation, data, type, currentSamplerIndex, increaseIndex) {

        switch (type) {
            case "float":
            case "int":
            case "vec2":
            case "vec3":
            case "vec4":
            case "ivec2":
            case "ivec3":
            case "bool":

                if (data == null)
                    return
                gpu[TYPES[type]](uLocation, data)
                break
            case "mat3":
                if (data == null)
                    return
                gpu.uniformMatrix3fv(uLocation, false, data)
                break
            case "mat4":
                if (data == null)
                    return
                gpu.uniformMatrix4fv(uLocation, false, data)
                break
            case "samplerCube":
                gpu.activeTexture(gpu.TEXTURE0 + currentSamplerIndex)
                gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, data)
                gpu.uniform1i(uLocation, currentSamplerIndex)
                increaseIndex()
                break
            case "sampler2D":
                gpu.activeTexture(gpu.TEXTURE0 + currentSamplerIndex)
                gpu.bindTexture(gpu.TEXTURE_2D, data)
                gpu.uniform1i(uLocation, currentSamplerIndex)
                increaseIndex()
                break
            default:
                break
        }

    }


}

export function trimString(str) {
    return str.replaceAll(/^(\s*)/gm, "").replaceAll(/^\s*\n/gm, "")
}