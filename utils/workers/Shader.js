import Bundler from "./Bundler";
import {bindTexture} from "../misc/utils";

const TYPES = {
    'vec2': 'uniform2fv',
    'vec3':'uniform3fv',
    'vec4':'uniform4fv',
    'mat3':'uniformMatrix3fv',
    'mat4':'uniformMatrix4fv',
    'float':'uniform1f',
    'int':'uniform1i',
    'sampler2D':'sampler2D',
    'samplerCube':'cubemap',
    'ivec2':'uniform2iv',
    'ivec3':'uniform3iv'
}
export default class Shader {
    available = false

    constructor(vertex, fragment, gpu) {

        this.program = gpu.createProgram()
        this.gpu = gpu
        const vCode = this._compileShader(vertex, gpu?.VERTEX_SHADER)
        const fCode = this._compileShader(fragment, gpu?.FRAGMENT_SHADER)

        this.uniforms = [...this._extractUniforms(vCode),...this._extractUniforms(fCode)]
    }

    _compileShader(shaderCode, shaderType) {
        const bundledCode = Bundler.applyMethods(shaderCode)
        const shader = this.gpu.createShader(shaderType)

        this.gpu.shaderSource(shader, bundledCode)
        this.gpu.compileShader(shader)
        let compiled = this.gpu.getShaderParameter(shader, this.gpu.COMPILE_STATUS);


        if (!compiled) {
            console.log(bundledCode);
            console.log(this.gpu.getShaderInfoLog(shader))
            this.available = false
        } else {
            this.gpu.attachShader(this.program, shader)
            this.gpu.linkProgram(this.program)
            this.available = true
        }

        return bundledCode

    }

    _extractUniforms(code) {
        let uniformObjects = []
        const uniforms = code.match(/^uniform(\s+)(mat4|vec4|mat3|vec3|vec2|float|int|bool)((\s|[a-zA-Z])*);$/gm)
        if (uniforms) {
            uniforms.forEach(u => {
                const match = u.match(/^uniform(\s+)(mat4|vec4|mat3|vec3|vec2|float|int|bool)((\s|[a-zA-Z])*);$/m)
                if (match) {
                    const type = match[2]
                    const name = match[3].replace(' ', '')
                    if (TYPES[type] !== undefined) {
                        uniformObjects.push({
                            type,
                            name,
                            uLocation: this.gpu.getUniformLocation(this.program, name)
                        })
                    }
                }
            })
        }
        return uniformObjects
    }

    bindForUse(data) {
        this.gpu.useProgram(this.program)
        for (let v = 0; v < this.uniforms.length; v++) {
            const current = this.uniforms[v]
            let currentSamplerIndex = 0
            switch (current.type){
                case TYPES.float:
                case TYPES.int:
                case TYPES.vec2:
                case TYPES.vec3:
                case TYPES.vec4:
                case TYPES.ivec2:
                case TYPES.ivec3:
                    this.gpu[TYPES[current.type]](data[current.name], current.uLocation)
                    break
                case TYPES.mat3:
                case TYPES.mat4:
                    this.gpu[TYPES[current.type]](data[current.name], false, current.uLocation)
                    break
                case TYPES.samplerCube:
                    this.gpu.activeTexture(this.gpu.TEXTURE0 + currentSamplerIndex)
                    this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, data[current.name])
                    this.gpu.uniform1i(current.uLocation, currentSamplerIndex)
                    currentSamplerIndex++
                    break
                case TYPES.sampler2D:
                    bindTexture(currentSamplerIndex, data[current.name], current.uLocation, this.gpu)
                    currentSamplerIndex++
                    break
                default:
                    break
            }
        }
    }

    use() {
        this.gpu.useProgram(this.program)
    }
}