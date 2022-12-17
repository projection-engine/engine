import {mat4} from "gl-matrix"
import Mesh from "./Mesh";
import GPU from "../lib/GPU";
import CubeMapAPI from "../lib/rendering/CubeMapAPI";
import getProbeRotation from "../utils/get-probe-rotation";
import getProbeLookat from "../utils/get-probe-lookat";


const perspective = mat4.create()
export default class LightProbe {
    texture?: WebGLTexture
    prefiltered?: WebGLTexture
    irradianceTexture?: WebGLTexture
    #resolution?: number

    constructor(resolution: number) {
        this.resolution = resolution
    }

    set resolution(data: number) {
        if (data === this.#resolution || typeof data !== "number")
            return
        this.#resolution = data
        if (this.texture instanceof WebGLTexture)
            gpu.deleteTexture(this.texture)

        this.texture = CubeMapAPI.initializeTexture(false, data, false)
    }

    get resolution(): number {
        return this.#resolution
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
        mat4.perspective(perspective, 1.57, 1, .1, 10)
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
                const shader = CubeMapAPI.prefilteredShader
                const uniforms = shader.uniformMap
                shader.bind()
                gpu.uniformMatrix4fv(uniforms.projectionMatrix, false, perspective)
                gpu.uniformMatrix4fv(uniforms.viewMatrix, false, getProbeLookat(rotations.yaw, rotations.pitch, [0, 0, 0]))
                gpu.uniform1f(uniforms.roughness, roughness)

                gpu.activeTexture(gpu.TEXTURE0)
                gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, this.texture)
                gpu.uniform1i(uniforms.environmentMap, 0)

                gpu.drawArrays(gpu.TRIANGLES, 0, 36)
            }
        }
        GPU.cubeBuffer.disable()

        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null)
        gpu.deleteRenderbuffer(rbo)
    }

    draw(callback: Function, zFar?:number, zNear?:number, asIrradiance?: boolean): LightProbe {
        let resolution = asIrradiance ? 32 : this.#resolution, texture
        mat4.perspective(perspective, Math.PI / 2, 1, zNear||1, zFar || 25)


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

        if (asIrradiance) {
            Mesh.finishIfUsed()
            GPU.cubeBuffer.enable()
        }

        for (let i = 0; i < 6; i++) {
            const rotations = getProbeRotation(i)
            gpu.framebufferTexture2D(
                gpu.FRAMEBUFFER,
                gpu.COLOR_ATTACHMENT0,
                gpu.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                texture,
                0
            )
            gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)

            callback(rotations.yaw, rotations.pitch, perspective, i)
        }
        if (asIrradiance)
            GPU.cubeBuffer.disable()

        gpu.deleteRenderbuffer(rbo)
        return this
    }

}
