import {mat4} from "gl-matrix"
import Mesh from "./Mesh";
import GPU from "../GPU";
import CubeMapAPI from "../api/CubeMapAPI";
import getProbeRotation from "../utils/get-probe-rotation";
import getProbeLookat from "../utils/get-probe-lookat";


export default class LightProbe {
    texture
    prefiltered
    irradianceTexture
    _resolution

    constructor(resolution) {
        if(resolution != null)
            this.resolution = resolution
    }

    set resolution(data) {
        this._resolution = data
        this.texture = CubeMapAPI.initializeTexture(data)
    }

    get resolution() {
        return this._resolution
    }

    drawDiffuseMap(sampler = this.texture, multiplier = [1, 1, 1]) {

        this.draw(
            (yaw, pitch, perspective) => {
                CubeMapAPI.irradianceShader.bindForUse({
                    projectionMatrix: perspective,
                    viewMatrix: getProbeLookat(yaw, pitch, [0, 0, 0]),
                    uSampler: sampler,
                    multiplier
                })
                gpu.drawArrays(gpu.TRIANGLES, 0, 36)
            },
            undefined,
            undefined,
            true
        )
    }

    drawSpecularMap(mipLevels = 6, resolution = 128) {
        const perspective = mat4.perspective([], 1.57, 1, .1, 10)
        Mesh.finishIfUsed()
        gpu.viewport(0, 0, resolution, resolution)
        if (!this.prefiltered)
            this.prefiltered = CubeMapAPI.initializeTexture(false, resolution, true)


        const rbo = CubeMapAPI.createRenderBuffer(resolution)
        GPU.cubeBuffer.enable()

        for (let i = 0; i < mipLevels; i++) {
            const currentRes = resolution * Math.pow(0.5, i)
            const roughness = i / (mipLevels - 1)
            gpu.viewport(0, 0, currentRes, currentRes)
            for (let j = 0; j < 6; j++) {
                gpu.renderbufferStorage(gpu.RENDERBUFFER, gpu.DEPTH_COMPONENT24, currentRes, currentRes)
                const rotations = getProbeRotation(j)
                gpu.framebufferTexture2D(
                    gpu.FRAMEBUFFER,
                    gpu.COLOR_ATTACHMENT0,
                    gpu.TEXTURE_CUBE_MAP_POSITIVE_X + j,
                    this.prefiltered,
                    i
                )

                CubeMapAPI.prefilteredShader.bindForUse({
                    projectionMatrix: perspective,
                    viewMatrix: getProbeLookat(rotations.yaw, rotations.pitch, [0, 0, 0]),
                    roughness: roughness,
                    environmentMap: this.texture,
                    multiplier: [1, 1, 1]
                })

                gpu.drawArrays(gpu.TRIANGLES, 0, 36)
            }
        }
        GPU.cubeBuffer.disable()

        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null)
        gpu.deleteRenderbuffer(rbo)


    }

    draw(callback, zFar = 25, zNear = 1, asIrradiance) {
        let resolution = asIrradiance ? 32 : this._resolution, texture
        const perspective = mat4.perspective([], Math.PI / 2, 1, zNear, zFar)
        Mesh.finishIfUsed()

        gpu.bindFramebuffer(gpu.FRAMEBUFFER, CubeMapAPI.frameBuffer)
        gpu.viewport(0, 0, resolution, resolution)

        const rbo = CubeMapAPI.createRenderBuffer(resolution)

        if (!asIrradiance)
            texture = this.texture
        else {
            if (!this.irradianceTexture)
                this.irradianceTexture = CubeMapAPI.initializeTexture(false, resolution)
            texture = this.irradianceTexture
        }

        if (asIrradiance)
            GPU.cubeBuffer.enable()

        for (let i = 0; i < 6; i++) {
            const rotations = getProbeRotation(i)
            gpu.framebufferTexture2D(
                gpu.FRAMEBUFFER,
                gpu.COLOR_ATTACHMENT0,
                gpu.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                texture,
                0
            )
            gpu.clear(gpu.COLOR_BUFFER_BIT)
            callback(rotations.yaw, rotations.pitch, perspective, i)
        }
        if (asIrradiance)
            GPU.cubeBuffer.disable()

        gpu.deleteRenderbuffer(rbo)
        return this
    }

}
