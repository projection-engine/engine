import cube from "../../samples/skyBoxCube";
import loadCubeMap from "../../utils/loadCubeMap";
import {createTexture, createVBO, lookAt} from '../../utils/utils'
import DirectionalLight from "./DirectionalLight";
import {mat4} from "gl-matrix";
import CubeMapShader from "../shaders/skybox/CubeMapShader";
import HDRImage from 'hdrpng/hdrpng'

export default class Skybox {
    lightSource
    hdrTexture
    cubeMapFBO
    texture
    irradianceMap

    constructor(gpu, hdrSrc) {
        this.gpu = gpu
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)
        this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, null)

        this.vertexBuffer = createVBO(this.gpu, this.gpu.ARRAY_BUFFER, new Float32Array(cube))
        this.lightSource = new DirectionalLight(this.gpu, undefined, undefined, undefined, [0, 100, 200], -1, 1000)

        const baseShader = new CubeMapShader(this.gpu)
        const irradianceShader = new CubeMapShader(this.gpu, true)
        this._initializeTexture(hdrSrc, () => {
            // TEXTURES
            this.texture = this._createCubeMap(baseShader, 512)
            this.irradianceMap = this._createCubeMap(irradianceShader, 32, true)
        })
    }

    _createCubeMap(shader, res, asIrradiance) {
        let perspective = mat4.create()
        mat4.perspective(perspective, 1.57, 1, .1, 10)
        this.gpu.viewport(0, 0, res, res)

        let FBOs = [];
        let RBOs = [];
        let texture = this.gpu.createTexture();
        this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, texture);

        this.gpu.texParameteri(this.gpu.TEXTURE_CUBE_MAP, this.gpu.TEXTURE_MAG_FILTER, this.gpu.LINEAR);
        this.gpu.texParameteri(this.gpu.TEXTURE_CUBE_MAP, this.gpu.TEXTURE_MIN_FILTER, this.gpu.LINEAR);
        this.gpu.texParameteri(this.gpu.TEXTURE_CUBE_MAP, this.gpu.TEXTURE_WRAP_S, this.gpu.CLAMP_TO_EDGE);
        this.gpu.texParameteri(this.gpu.TEXTURE_CUBE_MAP, this.gpu.TEXTURE_WRAP_T, this.gpu.CLAMP_TO_EDGE);
        for (let i = 0; i < 6; i++) {
            this.gpu.texImage2D(
                this.gpu.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                0,
                this.gpu.RGBA16F,
                res,
                res,
                0,
                this.gpu.RGBA,
                this.gpu.FLOAT,
                null);
        }

        for (let i = 0; i < 6; i++) {
            // Create framebuffer
            FBOs[i] = this.gpu.createFramebuffer();
            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, FBOs[i]);
            // Create and attach depth buffer
            RBOs[i] = this.gpu.createRenderbuffer();
            this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, RBOs[i]);
            this.gpu.renderbufferStorage(this.gpu.RENDERBUFFER, this.gpu.DEPTH_COMPONENT16, res, res);
            this.gpu.framebufferRenderbuffer(this.gpu.FRAMEBUFFER, this.gpu.DEPTH_ATTACHMENT, this.gpu.RENDERBUFFER, RBOs[i]);
            this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, null);

            // Attach one face of cube map
            this.gpu.framebufferTexture2D(this.gpu.FRAMEBUFFER, this.gpu.COLOR_ATTACHMENT0, this.gpu.TEXTURE_CUBE_MAP_POSITIVE_X + i, texture, 0);
            let status_code = this.gpu.checkFramebufferStatus(this.gpu.FRAMEBUFFER);
            if(status_code === this.gpu.FRAMEBUFFER_COMPLETE) {
                shader.use()

                if (!asIrradiance) {
                    this.gpu.activeTexture(this.gpu.TEXTURE0)

                    this.gpu.bindTexture(this.gpu.TEXTURE_2D, this.hdrTexture)
                    this.gpu.uniform1i(shader.equirectangularMapULocation, 0)
                } else {
                    this.gpu.activeTexture(this.gpu.TEXTURE0)
                    this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, this.texture)
                    this.gpu.uniform1i(shader.equirectangularMapULocation, 0)
                }
                this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT);

                const rotations = this._getRotations(i)
                this.draw(shader, perspective, lookAt(rotations.yaw, rotations.pitch, [0, 0, 0]), true)
            }
        }
        return texture
    }

    _getRotations(index) {
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

    _initializeTexture(hdrSrc, callback) {
        const img = new Image()
        img.src = hdrSrc
        img.onload = () => {
            this.hdrTexture = createTexture(
                this.gpu,
                img.width,
                img.height,
                this.gpu.RGB16F,
                0,
                this.gpu.RGB,
                this.gpu.FLOAT,
                img,
                this.gpu.LINEAR,
                this.gpu.LINEAR,
                this.gpu.CLAMP_TO_EDGE,
                this.gpu.CLAMP_TO_EDGE
            )

            callback()
        }
    }


    draw(shader, projectionMatrix, staticViewMatrix, cubeMapStartup = false) {
        shader.use()
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.vertexBuffer)
        this.gpu.enableVertexAttribArray(shader.positionLocation)
        this.gpu.vertexAttribPointer(shader.positionLocation, 3, this.gpu.FLOAT, false, 0, 0)
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.vertexBuffer)

        if (!cubeMapStartup) {
            this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, this.texture)
            this.gpu.uniform1i(shader.textureULocation, 0)
        }

        this.gpu.uniformMatrix4fv(shader.viewMatrixULocation, false, staticViewMatrix)
        this.gpu.uniformMatrix4fv(shader.projectionMatrixULocation, false, projectionMatrix)

        this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)

        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, null)
    }
}