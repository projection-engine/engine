import {mat4} from "gl-matrix";
import {createVBO, lookAt} from "../../utils/misc/utils";
import cube from "../../assets/cube.json";
import CubeMapShader from "../../shaders/classes/CubeMapShader";
import VBO from "../../utils/workers/VBO";

export default class LightProbeInstance {
    texture
    prefiltered

    gpu

    _shader
    _prefilteredShader
    _res
    _position = [0, 0, 0]

    constructor(gpu, position) {
        this.gpu = gpu

        this._generatePrefiltered = generatePrefiltered
        this._mipLevels = 6
        this.onBeforeDraw = onBeforeDraw
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)
        this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, null)

        this._position = position
        this._vertexBuffer = new VBO(gpu, 1, new Float32Array(cube), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
    }

    set position(data) {
        this._position = data
        this.texture = this._createCubeMap(this._position, this.gpu, this._shader, this._res, this._vertexBuffer, this.onBeforeDraw)

        if (this._generatePrefiltered)
            this._createMipCubeMap()
    }

    get position() {
        return this._position
    }

    set res(data) {
        this._res = data
        this.texture = this._createCubeMap(this._position, this.gpu, this._shader, this._res, this._vertexBuffer, this.onBeforeDraw)

        if (this._generatePrefiltered)
            this._createMipCubeMap()

    }

    set shader(data) {
        this._shader = data
        this.texture = this._createCubeMap(this._position, this.gpu, this._shader, this._res, this._vertexBuffer, this.onBeforeDraw)

        if (this._generatePrefiltered)
            this._createMipCubeMap()
    }

    get shader() {
        return this._shader
    }

    _createMipCubeMap() {
        const res = 128
        let perspective = mat4.create()
        mat4.perspective(perspective, 1.57, 1, .1, 10)

        this.gpu.viewport(0, 0, res, res)

        let texture = this._initializeTexture(this.gpu, res, true);
        this.gpu.generateMipmap(this.gpu.TEXTURE_CUBE_MAP)

        const envMapULocation = this.gpu.getUniformLocation(this._prefilteredShader.program, 'environmentMap')
        const roughnessULocation = this.gpu.getUniformLocation(this._prefilteredShader.program, 'roughness')
        const rbo = createRBO(this.gpu, res, this.texture, this.gpu.TEXTURE_CUBE_MAP)

        this._prefilteredShader.use()
        for (let i = 0; i < this._mipLevels; i++) {
            const currentRes = 128 * Math.pow(0.5, i)
            const roughness = i / (this._mipLevels - 1)


            this.gpu.viewport(0, 0, currentRes, currentRes)

            for (let j = 0; j < 6; j++) {
                this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, rbo);
                this.gpu.renderbufferStorage(this.gpu.RENDERBUFFER, this.gpu.DEPTH_COMPONENT24, currentRes, currentRes);

                this.gpu.uniform1f(roughnessULocation, roughness)

                this.gpu.activeTexture(this.gpu.TEXTURE0)
                this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, this.texture)
                this.gpu.uniform1i(envMapULocation, 0)

                const rotations = getRotation(j)
                this.gpu.framebufferTexture2D(
                    this.gpu.FRAMEBUFFER,
                    this.gpu.COLOR_ATTACHMENT0,
                    this.gpu.TEXTURE_CUBE_MAP_POSITIVE_X + j,
                    texture,
                    i
                );

                this._drawToTexture(
                    this._prefilteredShader,
                    this.gpu,
                    this._vertexBuffer,
                    perspective,
                    lookAt(rotations.yaw, rotations.pitch, this._position))
            }
        }

        this.prefiltered = texture
    }

    _createCubeMap(position, gpu, shader, res, vertexBuffer, onBeforeDraw) {
        let perspective = mat4.create()
        mat4.perspective(perspective, 1.57, 1, .1, 10)
        gpu.viewport(0, 0, res, res)

        let texture = this._initializeTexture(gpu, res);
        gpu.generateMipmap(gpu.TEXTURE_CUBE_MAP)

        this._drawCubeMap(gpu, res, shader, perspective, vertexBuffer, onBeforeDraw, texture, 0, position)

        return texture
    }

    _initializeTexture(gpu, res, mipmap) {

        gpu.viewport(0, 0, res, res)

        let texture = gpu.createTexture();
        gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, texture);

        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_MAG_FILTER, gpu.LINEAR);
        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_MIN_FILTER, mipmap ? gpu.LINEAR_MIPMAP_LINEAR : gpu.LINEAR);
        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_WRAP_S, gpu.CLAMP_TO_EDGE);
        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_WRAP_T, gpu.CLAMP_TO_EDGE);
        for (let i = 0; i < 6; i++) {
            gpu.texImage2D(
                gpu.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                0,
                gpu.RGBA16F,
                res,
                res,
                0,
                gpu.RGBA,
                gpu.FLOAT,
                null);
        }

        return texture
    }

    _drawCubeMap(gpu, res, shader, perspective, vertexBuffer, onBeforeDraw, texture, mipLevel, position,) {
        let FBOs = [], RBOs = []

        for (let i = 0; i < 7; i++) {
            FBOs[i] = gpu.createFramebuffer();
            gpu.bindFramebuffer(gpu.FRAMEBUFFER, FBOs[i]);

            RBOs[i] = gpu.createRenderbuffer();
            gpu.bindRenderbuffer(gpu.RENDERBUFFER, RBOs[i]);
            gpu.renderbufferStorage(gpu.RENDERBUFFER, gpu.DEPTH_COMPONENT24, res, res);
            gpu.framebufferRenderbuffer(gpu.FRAMEBUFFER, gpu.DEPTH_ATTACHMENT, gpu.RENDERBUFFER, RBOs[i]);
            gpu.bindRenderbuffer(gpu.RENDERBUFFER, null);

            gpu.framebufferTexture2D(
                gpu.FRAMEBUFFER,
                gpu.COLOR_ATTACHMENT0,
                gpu.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                texture,
                0);

            let status_code = gpu.checkFramebufferStatus(gpu.FRAMEBUFFER);

            if (status_code === gpu.FRAMEBUFFER_COMPLETE) {
                shader.use()

                onBeforeDraw(shader)
                gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT);

                const rotations = getRotation(i)
                this._drawToTexture(shader, gpu, vertexBuffer, perspective, lookAt(rotations.yaw, rotations.pitch, position))
            }
        }
    }



    _drawToTexture(shader, gpu, vertexBuffer, projectionMatrix, staticViewMatrix) {
        shader.use()


        this._vertexBuffer.enable()

        gpu.uniformMatrix4fv(shader.viewMatrixULocation, false, staticViewMatrix)
        gpu.uniformMatrix4fv(shader.projectionMatrixULocation, false, projectionMatrix)
        gpu.drawArrays(gpu.TRIANGLES, 0, 36)
        gpu.bindBuffer(gpu.ARRAY_BUFFER, null)
    }

}
