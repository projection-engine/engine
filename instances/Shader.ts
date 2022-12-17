import GPU from "../lib/GPU";
import CameraAPI from "../lib/utils/CameraAPI";
import applyShaderMethods from "../utils/apply-shader-methods";
import LightsAPI from "../lib/utils/LightsAPI";
import GLSL_TYPES from "../static/GLSL_TYPES"
import trimString from "../utils/trim-string";
import GLSLTypes from "../static/GLSL_TYPES";

const regex = /uniform(\s+)(highp|mediump|lowp)?(\s*)((\w|_)+)((\s|\w|_)*);/gm
const structRegex = (type) => {
    return new RegExp(`(struct\\s+${type}\\s*\\s*{.+?(?<=}))`, "gs")
}
const defineRegex = (global) => {
    return new RegExp("#define(\\s+)((\\w|_)+)(\\s+)(.+)", global ? "gmi" : "mi")
}
const regexMatch = /uniform(\s+)(highp|mediump|lowp)?(\s*)((\w|_)+)((\s|\w|_)*);$/m
const regexArray = (global) => {
    return new RegExp("uniform(\\s+)(highp|mediump|lowp)?(\\s*)((\\w|_)+)((\\s|\\w|_)*)\\[(\\w+)\\](\\s*);$", global ? "gm" : "m")
}

interface Uniform {
    type: string,
    name: string,
    parent?: string,
    arraySize?: number,
    uLocations?: WebGLUniformLocation[],
    uLocation?: WebGLUniformLocation
}

export default class Shader {
    program?: WebGLProgram
    uniforms
    uniformMap: { [key: string]: WebGLUniformLocation } = {}
    length = 0
    messages = {
        error: undefined,
        messages: undefined,
        hasError: false
    }

    constructor(vertex, fragment) {
        let alert = []
        this.program = gpu.createProgram()
        const vCode = trimString(this.#compileShader(vertex, gpu.VERTEX_SHADER, m => alert.push(m)))
        const fCode = trimString(this.#compileShader(fragment, gpu.FRAGMENT_SHADER, m => alert.push(m)))

        this.uniforms = [...this.#extractUniforms(vCode), ...this.#extractUniforms(fCode)].flat().filter(u => {
            return typeof u.uLocation === "object" || typeof u.uLocations === "object"
        })

        for (let i = 0; i < this.uniforms.length; i++)
            this.uniformMap[this.uniforms[i].name] = this.uniforms[i].uLocation || this.uniforms[i].uLocations
        this.messages = {
            error: gpu.getError(),
            messages: alert,
            hasError: alert.length > 0
        }

        this.length = this.uniforms.length
        if (vCode.includes("CameraMetadata") || fCode.includes("CameraMetadata"))
            CameraAPI.UBO.bindWithShader(this.program)

        if (fCode.includes("LightsMetadata")) {
            console.trace("BINGIND")
            console.trace(fCode)
            LightsAPI.lightsMetadataUBO.bindWithShader(this.program)
            LightsAPI.lightsUBOA.bindWithShader(this.program)
            LightsAPI.lightsUBOB.bindWithShader(this.program)
            LightsAPI.lightsUBOC.bindWithShader(this.program)

        }
    }

    #compileShader(shaderCode, shaderType, pushMessage) {
        const bundledCode = "#version 300 es\n" + applyShaderMethods(shaderCode)

        const shader = gpu.createShader(shaderType)
        gpu.shaderSource(shader, bundledCode)
        gpu.compileShader(shader)
        let compiled = gpu.getShaderParameter(shader, gpu.COMPILE_STATUS)

        if (!compiled) {
            const error = gpu.getShaderInfoLog(shader)
            console.error({error, shaderCode})
            pushMessage(error)
        } else {
            gpu.attachShader(this.program, shader)
            gpu.linkProgram(this.program)

        }
        return bundledCode
    }


    #extractUniforms(code): Uniform[] {
        const uniformObjects:Uniform[] = []
        const uniforms = code.match(regex)
        if (uniforms)
            uniforms.forEach(u => {
                const match: string[] | number = u.match(regexMatch)
                if (match === null)
                    return []
                const type = match[4]
                const name: string = match[6].replace(" ", "").trim()

                if (GLSL_TYPES[type] != null) {
                    uniformObjects.push({
                        type,
                        name,
                        uLocation: gpu.getUniformLocation(this.program, name)
                    })
                    return
                }

                let struct: string[] | number = code.match(structRegex(type))
                const reg = /^(\s*)(\w+)(\s*)((\w|_)+)/m
                if (struct === null)
                    return []
                const partial: string[] = struct[0].split("\n").filter(e => Object.keys(GLSL_TYPES).some(v => e.includes(v)))
                uniformObjects.push(
                    ...partial.map((s): Uniform | undefined => {
                        const current = s.match(reg)
                        if (current) {
                            return {
                                type: current[2],
                                name: current[4],
                                parent: name,
                                uLocation: gpu.getUniformLocation(this.program, name + "." + current[4])
                            }
                        }
                    })
                        .filter((e: Uniform | undefined): boolean => e !== undefined)
                )
            })
        const arrayUniforms = code.match(regexArray(true))
        const definitions = code.match(defineRegex(true))
        if (arrayUniforms)
            arrayUniforms.forEach(u => {
                const match = u.match(regexArray(false))

                if (!match)
                    return
                const type = match[4]
                const name = match[6].replace(" ", "")
                const define = definitions.find(d => d.includes(match[8]))?.match(defineRegex(false))

                if (!define) return;
                const arraySize = parseInt(define[5])
                if (GLSL_TYPES[type] !== undefined) {
                    uniformObjects.push({
                        type,
                        name,
                        arraySize,
                        uLocations: (new Array(arraySize).fill(null)).map((_, i) => gpu.getUniformLocation(this.program, name + `[${i}]`))
                    })
                    return
                }
                let struct = code.match(structRegex(type))
                const reg = /^(\s*)(\w+)(\s*)((\w|_)+)/m

                if (!struct)
                    return;
                const partial = struct[0].split("\n").filter(e => Object.keys(GLSL_TYPES).some(v => e.includes(v)))
                uniformObjects.push(
                    ...partial.map((s):Uniform|undefined => {
                        const current:string[]|null = s.match(reg)
                        if (current === null)
                            return
                        return {
                            type: current[2],
                            name: current[4],
                            parent: name,
                            arraySize,
                            uLocations: (new Array(arraySize).fill(null)).map((_, i) => gpu.getUniformLocation(this.program, name + `[${i}]` + "." + current[4]))
                        }
                    })
                    .filter((e:Uniform|undefined):boolean => e !== undefined)
                )
            })

        return uniformObjects
    }

    bind() {
        if (GPU.activeShader !== this.program)
            gpu.useProgram(this.program)
        GPU.activeShader = this.program
    }

    bindForUse(data) {
        this.bind()
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
                gpu[GLSL_TYPES[type]](uLocation, data)
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