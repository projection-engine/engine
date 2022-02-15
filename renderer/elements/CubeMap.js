import {mat4} from "gl-matrix";
import {createVBO, lookAt} from "../../utils/utils";
import skyBoxCube from "../../assets/cube";
import CubeMapShader from "../shaders/classes/CubeMapShader";

export default class CubeMap {
    texture
    prefiltered

    gpu
    onBeforeDraw
    _shader
    _prefilteredShader
    _res
    _position = [0, 0, 0]

    constructor(shader, gpu, res, onBeforeDraw, position, generatePrefiltered = false) {
        this.gpu = gpu

        this._generatePrefiltered = generatePrefiltered
        this._mipLevels = 5
        this.onBeforeDraw = onBeforeDraw
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)
        this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, null)

        if (position)
            this._position = position
        this._vertexBuffer = createVBO(this.gpu, this.gpu.ARRAY_BUFFER, new Float32Array(skyBoxCube))

        this._res = res
        if (generatePrefiltered)
            this._prefilteredShader = new CubeMapShader(gpu, 2)

        this.shader = shader


    }

    set position(data) {
        this._position = data
        this.texture = CubeMap.createCubeMap(this._position, this.gpu, this._shader, this._res, this._vertexBuffer, this.onBeforeDraw)

        if (this._generatePrefiltered)
            this._createMipCubeMap()
    }

    get position() {
        return this._position
    }

    set res(data) {
        this._res = data
        this.texture = CubeMap.createCubeMap(this._position, this.gpu, this._shader, this._res, this._vertexBuffer, this.onBeforeDraw)

        if (this._generatePrefiltered)
            this._createMipCubeMap()

    }

    set shader(data) {
        this._shader = data
        this.texture = CubeMap.createCubeMap(this._position, this.gpu, this._shader, this._res, this._vertexBuffer, this.onBeforeDraw)

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

        let texture = CubeMap.initializeTexture(this.gpu, res, true);
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

                const rotations = CubeMap.getRotations(j)
                this.gpu.framebufferTexture2D(
                    this.gpu.FRAMEBUFFER,
                    this.gpu.COLOR_ATTACHMENT0,
                    this.gpu.TEXTURE_CUBE_MAP_POSITIVE_X + j,
                    texture,
                    i
                );

                CubeMap.drawToTexture(
                    this._prefilteredShader,
                    this.gpu,
                    this._vertexBuffer,
                    perspective,
                    lookAt(rotations.yaw, rotations.pitch, this._position))
            }
        }

        this.prefiltered = texture
    }

    static createCubeMap(position, gpu, shader, res, vertexBuffer, onBeforeDraw) {
        let perspective = mat4.create()
        mat4.perspective(perspective, 1.57, 1, .1, 10)
        gpu.viewport(0, 0, res, res)

        let texture = CubeMap.initializeTexture(gpu, res);
        gpu.generateMipmap(gpu.TEXTURE_CUBE_MAP)

        CubeMap.drawCubeMap(gpu, res, shader, perspective, vertexBuffer, onBeforeDraw, texture, 0, position)

        return texture
    }

    static initializeTexture(gpu, res, mipmap) {

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

    static drawCubeMap(gpu, res, shader, perspective, vertexBuffer, onBeforeDraw, texture, mipLevel, position,) {
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

                const rotations = CubeMap.getRotations(i)
                CubeMap.drawToTexture(shader, gpu, vertexBuffer, perspective, lookAt(rotations.yaw, rotations.pitch, position))
            }
        }
    }

    static getRotations(index) {
        switch (index) {
            case 0:
                return {
                    yaw: 1.57,
                    pitch: 0,
                }
            case 1:
                return {
                    yaw: -1.57,
                    pitch: 0,
                }
            case 2:
                return {
                    yaw: Math.PI,
                    pitch: -1.57,
                }
            case 3:
                return {
                    yaw: Math.PI,
                    pitch: 1.57,
                }
            case 4:
                return {
                    yaw: Math.PI,
                    pitch: 0,
                }
            case 5:
                return {
                    yaw: 0,
                    pitch: 0,
                }
            default :
                return {
                    yaw: 0,
                    pitch: 0,
                }
        }
    }

    static drawToTexture(shader, gpu, vertexBuffer, projectionMatrix, staticViewMatrix) {
        shader.use()

        gpu.bindBuffer(gpu.ARRAY_BUFFER, vertexBuffer)
        gpu.enableVertexAttribArray(shader.positionLocation)
        gpu.vertexAttribPointer(shader.positionLocation, 3, gpu.FLOAT, false, 0, 0)
        gpu.bindBuffer(gpu.ARRAY_BUFFER, vertexBuffer)

        gpu.uniformMatrix4fv(shader.viewMatrixULocation, false, staticViewMatrix)
        gpu.uniformMatrix4fv(shader.projectionMatrixULocation, false, projectionMatrix)
        gpu.drawArrays(gpu.TRIANGLES, 0, 36)
        gpu.bindBuffer(gpu.ARRAY_BUFFER, null)
    }

}

function createRBO(gpu, res, src, srcType) {

    let captureFBO = gpu.createFramebuffer();
    let captureRBO = gpu.createRenderbuffer();
    gpu.bindFramebuffer(gpu.FRAMEBUFFER, captureFBO);
    gpu.bindRenderbuffer(gpu.RENDERBUFFER, captureRBO);
    gpu.renderbufferStorage(gpu.RENDERBUFFER, gpu.DEPTH_COMPONENT24, res, res);
    gpu.framebufferRenderbuffer(gpu.FRAMEBUFFER, gpu.DEPTH_ATTACHMENT, gpu.RENDERBUFFER, captureRBO);

    gpu.activeTexture(gpu.TEXTURE0);
    gpu.bindTexture(srcType, src);
    gpu.viewport(0, 0, res, res);
    gpu.bindFramebuffer(gpu.FRAMEBUFFER, captureFBO);
    gpu.disable(gpu.CULL_FACE);
    return captureRBO;
}
