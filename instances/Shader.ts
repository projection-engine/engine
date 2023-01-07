import GPU from "../GPU";
import CameraAPI from "../lib/utils/CameraAPI";
import applyShaderMethods from "../utils/apply-shader-methods";
import GLSL_TYPES from "../static/GLSL_TYPES"
import MutableObject from "../MutableObject";

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
    uniforms = []
    uniformMap: { [key: string]: WebGLUniformLocation } = {}
    length = 0
    messages = {
        error: undefined,
        messages: undefined,
        hasError: false
    }

    constructor(vertex, fragment) {
        const alert = []
        this.program = GPU.context.createProgram()

        const vertexBuilt = "#version 300 es\n" + applyShaderMethods(vertex)
        const fragmentBuilt = "#version 300 es\n" + applyShaderMethods(fragment)

        const vertexShader = this.#compileShader(vertexBuilt, GPU.context.VERTEX_SHADER, m => alert.push(m))
        const fragmentShader = this.#compileShader(fragmentBuilt, GPU.context.FRAGMENT_SHADER, m => alert.push(m))

        GPU.context.attachShader(this.program, vertexShader)
        GPU.context.attachShader(this.program, fragmentShader)

        GPU.context.linkProgram(this.program)


        this.#extractUniforms(vertexBuilt)
        this.#extractUniforms(fragmentBuilt)
        this.uniforms = this.uniforms.filter(u => u !== undefined && typeof u.uLocation === "object" || typeof u.uLocations === "object")

        for (let i = 0; i < this.uniforms.length; i++)
            this.uniformMap[this.uniforms[i].name] = this.uniforms[i].uLocation || this.uniforms[i].uLocations
        this.messages = {
            error: GPU.context.getError(),
            messages: alert,
            hasError: alert.length > 0
        }

        this.length = this.uniforms.length
        if (fragmentBuilt.includes("CameraMetadata") || vertexBuilt.includes("CameraMetadata"))
            CameraAPI.UBO.bindWithShader(this.program)
    }

    #compileShader(shaderCode, shaderType, pushMessage) {


        const shader = GPU.context.createShader(shaderType)
        GPU.context.shaderSource(shader, shaderCode)
        GPU.context.compileShader(shader)
        let compiled = GPU.context.getShaderParameter(shader, GPU.context.COMPILE_STATUS)

        if (!compiled) {
            const error = GPU.context.getShaderInfoLog(shader)
            console.error({error, shaderCode})
            pushMessage(error)
        }
        return shader
    }


    #extractUniforms(code: string) {
        const uniforms = code.match(regex)
        if (uniforms)
            uniforms.forEach(u => {
                const match: string[] | number = u.match(regexMatch)
                if (match === null)
                    return []
                const type = match[4]
                const name: string = match[6].replace(" ", "").trim()

                if (GLSL_TYPES[type] != null) {
                    this.uniforms.push({
                        type,
                        name,
                        uLocation: GPU.context.getUniformLocation(this.program, name)
                    })
                    return
                }

                let struct: string[] | number = code.match(structRegex(type))
                const reg = /^(\s*)(\w+)(\s*)((\w|_)+)/m
                if (struct === null)
                    return []
                const partial: string[] = struct[0].split("\n").filter(e => Object.keys(GLSL_TYPES).some(v => e.includes(v)))
                this.uniforms.push(
                    ...partial.map((s): Uniform | undefined => {
                        const current = s.match(reg)
                        if (current) {
                            return {
                                type: current[2],
                                name: current[4],
                                parent: name,
                                uLocation: GPU.context.getUniformLocation(this.program, name + "." + current[4])
                            }
                        }
                    })
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
                    this.uniforms.push({
                        type,
                        name,
                        arraySize,
                        uLocations: (new Array(arraySize).fill(null)).map((_, i) => GPU.context.getUniformLocation(this.program, name + `[${i}]`))
                    })
                    return
                }
                let struct = code.match(structRegex(type))
                const reg = /^(\s*)(\w+)(\s*)((\w|_)+)/m

                if (!struct)
                    return;
                const partial = struct[0].split("\n").filter(e => Object.keys(GLSL_TYPES).some(v => e.includes(v)))
                this.uniforms.push(
                    ...partial.map((s): Uniform | undefined => {
                        const current: string[] | null = s.match(reg)
                        if (current === null)
                            return
                        return {
                            type: current[2],
                            name: current[4],
                            parent: name,
                            arraySize,
                            uLocations: (new Array(arraySize).fill(null)).map((_, i) => GPU.context.getUniformLocation(this.program, name + `[${i}]` + "." + current[4]))
                        }
                    })
                )
            })

    }

    bind() {
        if (GPU.activeShader !== this.program)
            GPU.context.useProgram(this.program)
        GPU.activeShader = this.program
    }

    bindForUse(data: MutableObject) {
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
                GPU.context[GLSL_TYPES[type]](uLocation, data)
                break
            case "mat3":
                if (data == null)
                    return
                GPU.context.uniformMatrix3fv(uLocation, false, data)
                break
            case "mat4":
                if (data == null)
                    return
                GPU.context.uniformMatrix4fv(uLocation, false, data)
                break
            case "samplerCube":
                GPU.context.activeTexture(GPU.context.TEXTURE0 + currentSamplerIndex)
                GPU.context.bindTexture(GPU.context.TEXTURE_CUBE_MAP, data)
                GPU.context.uniform1i(uLocation, currentSamplerIndex)
                increaseIndex()
                break
            case "sampler2D":
                GPU.context.activeTexture(GPU.context.TEXTURE0 + currentSamplerIndex)
                GPU.context.bindTexture(GPU.context.TEXTURE_2D, data)
                GPU.context.uniform1i(uLocation, currentSamplerIndex)
                increaseIndex()
                break
            default:
                break
        }

    }


}