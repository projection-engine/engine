import Shadows from "../../templates/shaders/templates/SHADOWS"
import * as PROBES from "../../templates/shaders/templates/PROBES"
import {PBR} from "../../templates/shaders/templates/PBR"
import GPU from "../../GPU";


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
    distributionGGX: "@import(distributionGGX)",
    geometrySchlickGGX: "@import(geometrySchlickGGX)",
    geometrySmith: "@import(geometrySmith)",
    fresnelSchlick: "@import(fresnelSchlick)",
    fresnelSchlickRoughness: "@import(fresnelSchlickRoughness)",
    computeDirectionalLight: "@import(computeDirectionalLight)",
    computePointLight: "@import(computePointLight)",


    calculateShadows: "@import(calculateShadows)",

    ambient: "@import(ambient)",
    forwardAmbient: "@import(forwardAmbient)",
    ambientUniforms: "@import(ambientUniforms)"
}


function applyMethods(shaderCode) {
    let response = shaderCode

    Object.keys(METHODS).forEach(key => {
        if (key === "calculateShadows")
            response = response.replaceAll(METHODS[key], Shadows)
        if (key === "ambient")
            response = response.replaceAll(METHODS[key], PROBES.deferredAmbient)
        if (key === "forwardAmbient")
            response = response.replaceAll(METHODS[key], PROBES.forwardAmbient)

        if (key === "ambientUniforms")
            response = response.replaceAll(METHODS[key], PROBES.UNIFORMS)
        if (PBR[key])
            response = response.replaceAll(METHODS[key], PBR[key])
    })

    return response
}


export default class ShaderController {
    available = false
    regex = /uniform(\s+)(highp|mediump|lowp)?(\s*)((\w|_)+)((\s|\w|_)*);/gm
    structRegex = (type) => {
        return new RegExp(`(struct\\s+${type}\\s*\\s*{.+?(?<=}))`, "gs")
    }
    defineRegex = (global) => {
        return new RegExp("#define(\\s+)((\\w|_)+)(\\s+)(.+)", global ? "gmi" : "mi")
    }
    regexMatch = /uniform(\s+)(highp|mediump|lowp)?(\s*)((\w|_)+)((\s|\w|_)*);$/m
    regexArray = (global) => {
        return new RegExp("uniform(\\s+)(highp|mediump|lowp)?(\\s*)((\\w|_)+)((\\s|\\w|_)*)\\[(\\w+)\\](\\s*);$", global ? "gm" : "m")
    }
    length = 0

    constructor(vertex, fragment, setMessage) {
        let alert = []
        this.program = gpu.createProgram()
        const vCode = this.#compileShader(trimString(vertex), gpu.VERTEX_SHADER, m => alert.push(m))
        const fCode = this.#compileShader(trimString(fragment), gpu.FRAGMENT_SHADER, m => alert.push(m))

        this.uniforms = [...this.#extractUniforms(vCode), ...this.#extractUniforms(fCode)].flat()
        if (typeof setMessage === "function")
            setMessage({
                error: gpu.getError(),
                messages: alert,
                hasError: alert.length > 0
            })
        this.uniforms = this.uniforms.filter(u => {
            return typeof u.uLocation === "object" || typeof u.uLocations === "object"
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
        const uniforms = code.match(this.regex)
        if (uniforms) {
            uniforms.forEach(u => {
                const match = u.match(this.regexMatch)
                if (match) {
                    const type = match[4]
                    const name = match[6].replace(" ", "").trim()

                    if (TYPES[type] !== undefined) {
                        uniformObjects.push({
                            type,
                            name,
                            uLocation: gpu.getUniformLocation(this.program, name)
                        })
                    } else {
                        let struct = code.match(this.structRegex(type))
                        const reg = /^(\s*)(\w+)(\s*)((\w|_)+)/m

                        if (struct) {
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
                        }
                    }
                }
            })
        }
        const arrayUniforms = code.match(this.regexArray(true))
        const definitions = code.match(this.defineRegex(true))

        if (arrayUniforms)
            arrayUniforms.forEach(u => {
                const match = u.match(this.regexArray(false))

                if (match) {
                    const type = match[4]
                    const name = match[6].replace(" ", "")
                    const define = definitions.find(d => d.includes(match[8]))?.match(this.defineRegex(false))

                    if (define !== undefined) {
                        const arraySize = parseInt(define[5])
                        if (TYPES[type] !== undefined) {
                            uniformObjects.push({
                                type,
                                name,
                                arraySize,
                                uLocations: (new Array(arraySize).fill(null)).map((_, i) => gpu.getUniformLocation(this.program, name + `[${i}]`))
                            })
                        } else {
                            let struct = code.match(this.structRegex(type))
                            const reg = /^(\s*)(\w+)(\s*)((\w|_)+)/m

                            if (struct) {
                                struct = struct[0].split("\n").filter(e => Object.keys(TYPES).some(v => e.includes(v)))
                                uniformObjects.push(
                                    ...struct.map(s => {
                                        const current = s.match(reg)

                                        if (current) {
                                            return {
                                                type: current[2],
                                                name: current[4],
                                                parent: name,
                                                arraySize,
                                                uLocations: (new Array(arraySize).fill(null)).map((_, i) => gpu.getUniformLocation(this.program, name + `[${i}]` + "." + current[4]))
                                            }
                                        }
                                    }).filter(e => e !== undefined)
                                )
                            }
                        }
                    }
                }
            })

        return uniformObjects
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
                if(!dataAttr)
                    continue
                for (let i = 0; i < current.uLocations.length; i++) {
                    const u = current.uLocations[i]
                    const d = dataAttr[i]
                    if (current.parent)
                        ShaderController.bind(u, d[current.name], current.type, currentSamplerIndex, increase)
                    else
                        ShaderController.bind(u, d, current.type, currentSamplerIndex, increase)
                }
            } else {
                const dataAttribute = current.parent !== undefined ? data[current.parent][current.name] : data[current.name]
                ShaderController.bind(current.uLocation, dataAttribute, current.type, currentSamplerIndex, increase)
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