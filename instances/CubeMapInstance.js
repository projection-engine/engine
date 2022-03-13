import {mat4} from "gl-matrix";
import {createTexture, lookAt} from "../utils/misc/utils";
import cube from "../assets/cube.json";
import VBO from "../utils/workers/VBO";
import * as  shaderCode from '../shaders/misc/cubeMap.glsl'
import Shader from "../utils/workers/Shader";

export default class CubeMapInstance {
    texture
    prefiltered
    irradianceTexture
    gpu
    _prefilteredShader
    _res

    constructor(gpu, resolution, asDepth) {
        this.gpu = gpu
        if (!asDepth)
            this._vertexBuffer = new VBO(gpu, 1, new Float32Array(cube), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
        this._res = resolution
        this._prefilteredShader = asDepth ? null : new Shader(shaderCode.vertex, shaderCode.prefiltered, gpu)
        this._irradianceShader = asDepth ? null : new Shader(shaderCode.vertex, shaderCode.irradiance, gpu)

        this._asDepth = asDepth
    }

    set resolution(data) {
        this._res = data
    }

    get resolution() {
        return this._res
    }
    generateIrradiance(){
        if (!this._asDepth) {
            this._irradianceShader.use()
            this.draw((yaw, pitch, perspective) => {
                this._irradianceShader.bindForUse({
                    projectionMatrix: perspective,
                    viewMatrix: lookAt(yaw, pitch, [0, 0, 0]),
                    uSampler: this.texture
                })
                this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)
            }, true, undefined, undefined, 32, true)
        }
    }
    generatePrefiltered(mipLevels = 6, resolution = 128) {

        if (!this._asDepth) {
            const perspective = mat4.perspective([], 1.57, 1, .1, 10),
                gpu = this.gpu
            gpu.viewport(0, 0, resolution, resolution)
            this.prefiltered = this._initializeTexture(resolution, true);
            gpu.generateMipmap(gpu.TEXTURE_CUBE_MAP)


            const frameBuffer = gpu.createFramebuffer()
            gpu.bindFramebuffer(gpu.FRAMEBUFFER, frameBuffer)

            const rbo = gpu.createRenderbuffer();
            gpu.bindRenderbuffer(gpu.RENDERBUFFER, rbo)
            gpu.renderbufferStorage(gpu.RENDERBUFFER, gpu.DEPTH_COMPONENT24, resolution, resolution)
            gpu.framebufferRenderbuffer(gpu.FRAMEBUFFER, gpu.DEPTH_ATTACHMENT, gpu.RENDERBUFFER, rbo)


            gpu.disable(gpu.CULL_FACE);
            this._prefilteredShader.use()
            this._vertexBuffer.enable()

            for (let i = 0; i < mipLevels; i++) {
                const currentRes = resolution * Math.pow(0.5, i)
                const roughness = i / (mipLevels - 1)
                gpu.viewport(0, 0, currentRes, currentRes)
                for (let j = 0; j < 6; j++) {
                    gpu.renderbufferStorage(gpu.RENDERBUFFER, gpu.DEPTH_COMPONENT24, currentRes, currentRes);
                    const rotations = getRotation(j)
                    gpu.framebufferTexture2D(
                        gpu.FRAMEBUFFER,
                        gpu.COLOR_ATTACHMENT0,
                        gpu.TEXTURE_CUBE_MAP_POSITIVE_X + j,
                        this.prefiltered,
                        i
                    );

                    this._prefilteredShader.bindForUse({
                        projectionMatrix: perspective,
                        viewMatrix: lookAt(rotations.yaw, rotations.pitch, [0, 0, 0]),
                        roughness: roughness,
                        environmentMap: this.texture
                    })

                    gpu.drawArrays(gpu.TRIANGLES, 0, 36)
                }
            }
            this._vertexBuffer.disable()
            return this
        } else
            return this
    }

    draw(callback, useVBO, zFar = 10, zNear = .1, resolution=this._res, asIrradiance) {
        let texture
        this.gpu.viewport(0, 0, resolution, resolution)
        if(!asIrradiance) {
            if (!this.texture)
                this.texture = this._initializeTexture(resolution);

            texture = this.texture
        }else {
            if (!this.irradianceTexture)
                this.irradianceTexture = this._initializeTexture(resolution);
            texture = this.irradianceTexture
        }


        const perspective = mat4.perspective([], Math.PI / 2, 1, zNear, zFar)
        const gpu = this.gpu
        const frameBuffer = gpu.createFramebuffer()
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, frameBuffer)

        const rbo = gpu.createRenderbuffer();
        gpu.bindRenderbuffer(gpu.RENDERBUFFER, rbo)
        gpu.renderbufferStorage(gpu.RENDERBUFFER, gpu.DEPTH_COMPONENT24, resolution, resolution)
        gpu.framebufferRenderbuffer(gpu.FRAMEBUFFER, gpu.DEPTH_ATTACHMENT, gpu.RENDERBUFFER, rbo)
        if (useVBO && !this._asDepth)
            this._vertexBuffer.enable()
        for (let i = 0; i < 6; i++) {
            const rotations = getRotation(i)
            gpu.framebufferTexture2D(
                gpu.FRAMEBUFFER,
                this._asDepth ? gpu.DEPTH_ATTACHMENT : gpu.COLOR_ATTACHMENT0,
                gpu.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                texture,
                0
            )
            gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT);
            callback(rotations.yaw, rotations.pitch, perspective, i)
        }
        if (useVBO && !this._asDepth)
            this._vertexBuffer.disable()

        this.gpu.deleteFramebuffer(frameBuffer)
        this.gpu.deleteRenderbuffer(rbo)

        return this
    }

    _initializeTexture(resolution, mipmap) {
        const gpu = this.gpu
        gpu.viewport(0, 0, resolution, resolution)
        let texture = gpu.createTexture();
        gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, texture);

        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_MAG_FILTER, this._asDepth ? gpu.NEAREST : gpu.LINEAR);
        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_MIN_FILTER, this._asDepth ? gpu.NEAREST : (mipmap ? gpu.LINEAR_MIPMAP_LINEAR : gpu.LINEAR));

        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_WRAP_S, gpu.CLAMP_TO_EDGE);
        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_WRAP_T, gpu.CLAMP_TO_EDGE);
        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_WRAP_R, gpu.CLAMP_TO_EDGE);
        const d = directions(gpu)
        for (let i = 0; i < 6; i++) {
            gpu.texImage2D(
                d[i].access,
                0,
                this._asDepth ? gpu.DEPTH_COMPONENT32F : gpu.RGBA16F,
                resolution,
                resolution,
                0,
                this._asDepth ? gpu.DEPTH_COMPONENT : gpu.RGBA,
                gpu.FLOAT,
                null);
        }

        return texture
    }

}
const directions = (gpu) => {

    return [
        {access: gpu.TEXTURE_CUBE_MAP_POSITIVE_X},
        {access: gpu.TEXTURE_CUBE_MAP_NEGATIVE_X},
        {access: gpu.TEXTURE_CUBE_MAP_POSITIVE_Y},
        {access: gpu.TEXTURE_CUBE_MAP_NEGATIVE_Y},
        {access: gpu.TEXTURE_CUBE_MAP_POSITIVE_Z},
        {access: gpu.TEXTURE_CUBE_MAP_NEGATIVE_Z}
    ]
}
function getRotation(index) {

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


