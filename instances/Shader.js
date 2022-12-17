import GPU from "../lib/GPU";
import CameraAPI from "../lib/utils/CameraAPI";
import ConsoleAPI from "../lib/utils/ConsoleAPI";
import applyShaderMethods from "../utils/apply-shader-methods";
import LightsAPI from "../lib/utils/LightsAPI";
import GLSL_TYPES from "../static/GLSL_TYPES.ts"
import trimString from "../utils/trim-string";

export default class Shader {

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

    #available = false
    get available() {
        return this.#available
    }

    uniformMap = {}
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
            ConsoleAPI.error(shaderCode)
            console.trace(bundledCode)
            const error = gpu.getShaderInfoLog(shader)
            console.error(error)
            pushMessage(error)
            this.#available = false
        } else {
            gpu.attachShader(this.program, shader)
            gpu.linkProgram(this.program)

            this.#available = true
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

                if (GLSL_TYPES[type] != null) {
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
                struct = struct[0].split("\n").filter(e => Object.keys(GLSL_TYPES).some(v => e.includes(v)))
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
                if (GLSL_TYPES[type] !== undefined) {
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
                struct = struct[0].split("\n").filter(e => Object.keys(GLSL_TYPES).some(v => e.includes(v)))
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