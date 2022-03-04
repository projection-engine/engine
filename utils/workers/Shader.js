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
    'ivec3':'uniform3iv',
    'bool':'uniform1i'
}
export default class Shader {
    available = false
    regex = /^uniform(\s+)(highp|mediump|lowp)?(\s*)(sampler2D|samplerCube|sampler3D|mat4|vec4|mat3|vec3|vec2|float|int|bool)((\s|[a-zA-Z]|_)*);$/gm
    regexMatch = /^uniform(\s+)(highp|mediump|lowp)?(\s*)(sampler2D|samplerCube|sampler3D|mat4|vec4|mat3|vec3|vec2|float|int|bool)((\s|[a-zA-Z]|_)*);$/m
    constructor(vertex, fragment, gpu) {

        this.program = gpu.createProgram()
        this.gpu = gpu
        const vCode = this._compileShader(vertex, gpu?.VERTEX_SHADER)
        const fCode = this._compileShader(fragment, gpu?.FRAGMENT_SHADER)

        this.uniforms = [...this._extractUniforms(vCode),...this._extractUniforms(fCode)]
        this.uniforms =this.uniforms.filter((value, index, self) =>
                index === self.findIndex((t) => (
                    t.name === value.name
                ))
        )


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
        const uniforms = code.match(this.regex)
        if (uniforms) {
            uniforms.forEach(u => {
                const match = u.match(this.regexMatch)
                if (match) {
                    const type = match[4]
                    const name = match[5].replace(' ', '')
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
        let currentSamplerIndex = 0
        if(this.uniforms.length < 8)
            console.log(data, this.uniforms)
        for (let v = 0; v < this.uniforms.length; v++) {
            const current = this.uniforms[v]
            switch (current.type){
                case 'float':
                case 'int':
                case 'vec2':
                case 'vec3':
                case 'vec4':
                case 'ivec2':
                case 'ivec3':
                case 'bool':
                    this.gpu[TYPES[current.type]](current.uLocation, data[current.name])
                    break
                case 'mat3':
                case 'mat4':
                    this.gpu[TYPES[current.type]](data[current.name], false, current.uLocation)
                    break
                case 'samplerCube':
                    this.gpu.activeTexture(this.gpu.TEXTURE0 + currentSamplerIndex)
                    this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, data[current.name])
                    this.gpu.uniform1i(current.uLocation, currentSamplerIndex)
                    currentSamplerIndex++
                    break
                case 'sampler2D':
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