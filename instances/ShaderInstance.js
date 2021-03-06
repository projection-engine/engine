import {bindTexture} from "../utils/utils"
import GI from "../shaders/templates/GI"
import Shadows from "../shaders/templates/SHADOWS"
import * as PROBES from "../shaders/templates/PROBES"
import {PBR} from "../shaders/templates/PBR"

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
    gi: "@import(GI)",

    ambient: "@import(ambient)",
    forwardAmbient: "@import(forwardAmbient)",
    ambientUniforms: "@import(ambientUniforms)"
}


function applyMethods(shaderCode) {
    let response = shaderCode

    Object.keys(METHODS).forEach(key => {
        if (key === "gi")
            response = response.replaceAll(METHODS[key], GI)
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

export default class ShaderInstance {
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

    constructor(vertex, fragment,  setMessage) {
        let alert = []
        const gpu = window.gpu
        this.program = gpu.createProgram()
        window.gpu = gpu
        const vCode = this._compileShader(trimString(vertex), gpu.VERTEX_SHADER, m => alert.push(m))
        const fCode = this._compileShader(trimString(fragment), gpu.FRAGMENT_SHADER, m => alert.push(m))

        this.uniforms = [...this._extractUniforms(vCode), ...this._extractUniforms(fCode)].flat()
        if(typeof setMessage === "function")
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

    _compileShader(shaderCode, shaderType, pushMessage) {
        const bundledCode = applyMethods(shaderCode)
        const shader = window.gpu.createShader(shaderType)
        window.gpu.shaderSource(shader, bundledCode)
        window.gpu.compileShader(shader)
        let compiled = window.gpu.getShaderParameter(shader, window.gpu.COMPILE_STATUS)
        if (!compiled) {
            console.error(window.gpu.getShaderInfoLog(shader))
            console.dir(shaderCode)
            pushMessage(window.gpu.getShaderInfoLog(shader))
            this.available = false
        } else {
            window.gpu.attachShader(this.program, shader)
            window.gpu.linkProgram(this.program)

            this.available = true
        }
        return bundledCode
    }

    _extractUniforms(code) {
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
                            uLocation: window.gpu.getUniformLocation(this.program, name)
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
                                            uLocation: window.gpu.getUniformLocation(this.program, name + "." + current[4])
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
                                uLocations: (new Array(arraySize).fill(null)).map((_, i) => window.gpu.getUniformLocation(this.program, name + `[${i}]`))
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
                                                uLocations: (new Array(arraySize).fill(null)).map((_, i) => window.gpu.getUniformLocation(this.program, name + `[${i}]` + "." + current[4]))
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
        let currentSamplerIndex = 0

        for (let v = 0; v < this.length; v++) {
            const current = this.uniforms[v]

            if (current.arraySize !== undefined) {
                const dataAttr = current.parent !== undefined ? data[current.parent] : data[current.name]
                if (dataAttr) {
                    const l = (current.arraySize < dataAttr.length ? current.arraySize : dataAttr.length)
                    for (let i = 0; i < l; i++) {
                        if (current.parent)
                            ShaderInstance.bind(current.uLocations[i], dataAttr[i][current.name], current.type, currentSamplerIndex, () => currentSamplerIndex++, current)
                        else
                            ShaderInstance.bind(current.uLocations[i], dataAttr[i], current.type, currentSamplerIndex, () => currentSamplerIndex++, current)
                    }
                }
            } else {
                const dataAttribute = current.parent !== undefined ? data[current.parent][current.name] : data[current.name]
                ShaderInstance.bind(current.uLocation, dataAttribute, current.type, currentSamplerIndex, () => currentSamplerIndex++, current)
            }
        }

    }

    static bind(uLocation, data, type, currentSamplerIndex, increaseIndex, c) {
        try{
            switch (type) {
            case "float":
            case "int":
            case "vec2":
            case "vec3":
            case "vec4":
            case "ivec2":
            case "ivec3":
            case "bool":
                window.gpu[TYPES[type]](uLocation, data)
                break
            case "mat3":
            case "mat4":
                window.gpu[TYPES[type]](uLocation, false, data)
                break
            case "samplerCube":
                window.gpu.activeTexture(window.gpu.TEXTURE0 + currentSamplerIndex)
                window.gpu.bindTexture(window.gpu.TEXTURE_CUBE_MAP, data)
                window.gpu.uniform1i(uLocation, currentSamplerIndex)
                increaseIndex()
                break
            case "sampler2D":
                bindTexture(currentSamplerIndex, data, uLocation, window.gpu)
                increaseIndex()
                break
            default:
                break
            }
        }catch (err){
            console.error({
                error: err,
                uniform: uLocation,
                type,
                data,
                c
            })
        }
    }

    use() {
        window.gpu.useProgram(this.program)
    }
}

export function trimString(str) {
    return str.replaceAll(/^(\s*)/gm, "").replaceAll(/^\s*\n/gm, "")
}