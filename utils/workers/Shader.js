import Bundler from "./Bundler";

export default class Shader {
    available = false

    constructor(vertex, fragment, gpu) {

        this.program = gpu.createProgram()
        this._compileShader(gpu, vertex, gpu?.VERTEX_SHADER)
        this._compileShader(gpu, fragment, gpu?.FRAGMENT_SHADER)
        this.gpu=gpu
    }

    _compileShader(gpu, shaderCode, shaderType) {
        const bundledCode = Bundler.applyMethods(shaderCode)
        const shader = gpu.createShader(shaderType)

        gpu.shaderSource(shader, bundledCode)
        gpu.compileShader(shader)
        let compiled = gpu.getShaderParameter(shader, gpu.COMPILE_STATUS);


        if (!compiled) {
            console.log('Shader compiler log: ' + compiled);
            console.log(gpu.getShaderInfoLog(shader))

            this.available = false
        } else {
            gpu.attachShader(this.program, shader)
            gpu.linkProgram(this.program)
            this.available = true
        }
    }
    use(){
        this.gpu.useProgram(this.program)
    }
}