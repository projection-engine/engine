import {mat4, vec3} from "gl-matrix"
import MeshController from "./MeshController";
import GPU from "../GPU";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";


export default class ProbeController {
    texture
    prefiltered
    irradianceTexture
    #res
    #asDepth = false
    #resChanged
    #frameBuffer

    get irradianceShader(){
        return GPU.shaders.get(STATIC_SHADERS.PRODUCTION.IRRADIANCE)
    }
    get prefilteredShader(){
        return GPU.shaders.get(STATIC_SHADERS.PRODUCTION.PREFILTERED)
    }

    constructor(resolution, asDepth) {
        this.#res = resolution
        this.#frameBuffer =  gpu.createFramebuffer()
        this.#asDepth = asDepth
    }

    set resolution(data) {
        this.#res = data
        this.#resChanged = true
    }

    get resolution() {
        return this.#res
    }

    generateIrradiance(sampler=this.texture, multiplier=[1,1,1]) {
        if (!this.#asDepth) {
            this.draw((yaw, pitch, perspective) => {
                this.irradianceShader.bindForUse({
                    projectionMatrix: perspective,
                    viewMatrix: lookAt(yaw, pitch, [0, 0, 0]),
                    uSampler: sampler,
                    multiplier
                })
                gpu.drawArrays(gpu.TRIANGLES, 0, 36)
            }, GPU.cubeBuffer, undefined, undefined, true)
        }
    }

    generatePrefiltered(mipLevels = 6, resolution = 128, cubeBuffer, multiplier=[1,1,1]) {

        if (!this.#asDepth && cubeBuffer) {
            const perspective = mat4.perspective([], 1.57, 1, .1, 10)

            MeshController.finishIfUsed()

            gpu.viewport(0, 0, resolution, resolution)
            this.prefiltered = this.#initializeTexture(resolution, true)
            gpu.generateMipmap(gpu.TEXTURE_CUBE_MAP)

            gpu.bindFramebuffer(gpu.FRAMEBUFFER, this.#frameBuffer)

            const rbo = gpu.createRenderbuffer()
            gpu.bindRenderbuffer(gpu.RENDERBUFFER, rbo)
            gpu.renderbufferStorage(gpu.RENDERBUFFER, gpu.DEPTH_COMPONENT24, resolution, resolution)
            gpu.framebufferRenderbuffer(gpu.FRAMEBUFFER, gpu.DEPTH_ATTACHMENT, gpu.RENDERBUFFER, rbo)

            cubeBuffer.enable()

            for (let i = 0; i < mipLevels; i++) {
                const currentRes = resolution * Math.pow(0.5, i)
                const roughness = i / (mipLevels - 1)
                gpu.viewport(0, 0, currentRes, currentRes)
                for (let j = 0; j < 6; j++) {
                    gpu.renderbufferStorage(gpu.RENDERBUFFER, gpu.DEPTH_COMPONENT24, currentRes, currentRes)
                    const rotations = getRotation(j)
                    gpu.framebufferTexture2D(
                        gpu.FRAMEBUFFER,
                        gpu.COLOR_ATTACHMENT0,
                        gpu.TEXTURE_CUBE_MAP_POSITIVE_X + j,
                        this.prefiltered,
                        i
                    )

                    this.prefilteredShader.bindForUse({
                        projectionMatrix: perspective,
                        viewMatrix: lookAt(rotations.yaw, rotations.pitch, [0, 0, 0]),
                        roughness: roughness,
                        environmentMap: this.texture,
                        multiplier
                    })

                    gpu.drawArrays(gpu.TRIANGLES, 0, 36)
                }
            }
            cubeBuffer.disable()

            gpu.bindFramebuffer(gpu.FRAMEBUFFER, null)
            gpu.bindRenderbuffer(gpu.RENDERBUFFER, null)
            gpu.deleteRenderbuffer(rbo)

            return this
        } else
            return this
    }

    draw(callback, cubeBuffer, zFar = 10, zNear = .1, asIrradiance) {
        let resolution = asIrradiance ? 32 : this.#res, texture

        const perspective = mat4.perspective([], Math.PI / 2, 1, zNear, zFar)
        MeshController.finishIfUsed()
        gpu.bindVertexArray(null)
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, this.#frameBuffer)
        gpu.viewport(0, 0, resolution, resolution)

        const rbo = gpu.createRenderbuffer()
        gpu.bindRenderbuffer(gpu.RENDERBUFFER, rbo)
        gpu.renderbufferStorage(gpu.RENDERBUFFER, gpu.DEPTH_COMPONENT24, resolution, resolution)
        gpu.framebufferRenderbuffer(gpu.FRAMEBUFFER, gpu.DEPTH_ATTACHMENT, gpu.RENDERBUFFER, rbo)

        if (!asIrradiance) {
            if (!this.texture || this.#resChanged)
                this.texture = this.#initializeTexture(resolution)

            this.#resChanged = false
            texture = this.texture
        } else {
            if (!this.irradianceTexture)
                this.irradianceTexture = this.#initializeTexture(resolution)
            texture = this.irradianceTexture
        }

        if (cubeBuffer && !this.#asDepth)
            cubeBuffer.enable()

        for (let i = 0; i < 6; i++) {
            const rotations = getRotation(i)
            gpu.framebufferTexture2D(
                gpu.FRAMEBUFFER,
                this.#asDepth ? gpu.DEPTH_ATTACHMENT : gpu.COLOR_ATTACHMENT0,
                gpu.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                texture,
                0
            )
            gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)
            callback(rotations.yaw, rotations.pitch, perspective, i)
        }
        if (cubeBuffer && !this.#asDepth)
            cubeBuffer.disable()

        gpu.deleteRenderbuffer(rbo)
        return this
    }

    #initializeTexture(resolution, mipmap) {
        gpu.viewport(0, 0, resolution, resolution)
        let texture = gpu.createTexture()
        gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, texture)

        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_MAG_FILTER, this.#asDepth ? gpu.NEAREST : gpu.LINEAR)
        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_MIN_FILTER, this.#asDepth ? gpu.NEAREST : (mipmap ? gpu.LINEAR_MIPMAP_LINEAR : gpu.LINEAR))

        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_WRAP_S, gpu.CLAMP_TO_EDGE)
        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_WRAP_T, gpu.CLAMP_TO_EDGE)
        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_WRAP_R, gpu.CLAMP_TO_EDGE)
        const d =[
            {access: gpu.TEXTURE_CUBE_MAP_POSITIVE_X},
            {access: gpu.TEXTURE_CUBE_MAP_NEGATIVE_X},
            {access: gpu.TEXTURE_CUBE_MAP_POSITIVE_Y},
            {access: gpu.TEXTURE_CUBE_MAP_NEGATIVE_Y},
            {access: gpu.TEXTURE_CUBE_MAP_POSITIVE_Z},
            {access: gpu.TEXTURE_CUBE_MAP_NEGATIVE_Z}
        ]
        for (let i = 0; i < 6; i++) {
            gpu.texImage2D(
                d[i].access,
                0,
                this.#asDepth ? gpu.DEPTH_COMPONENT32F : gpu.RGBA16F,
                resolution,
                resolution,
                0,
                this.#asDepth ? gpu.DEPTH_COMPONENT : gpu.RGBA,
                gpu.FLOAT,
                null)
        }

        return texture
    }
    delete(){
        if(this.texture)
            gpu.deleteTexture(this.texture)
        if(this.irradianceTexture)
            gpu.deleteTexture(this.irradianceTexture)
        if(this.prefiltered)
            gpu.deleteTexture(this.prefiltered)
    }

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



function lookAt(yaw, pitch, position) {
    const cosPitch = Math.cos(pitch)
    const sinPitch = Math.sin(pitch)
    const cosYaw = Math.cos(yaw)
    const sinYaw = Math.sin(yaw)

    let xAxis = [cosYaw, 0, -sinYaw],
        yAxis = [sinYaw * sinPitch, cosPitch, cosYaw * sinPitch],
        zAxis = [sinYaw * cosPitch, -sinPitch, cosPitch * cosYaw]
    let p1, p2, p3

    p1 = vec3.dot(position, xAxis)
    p2 = vec3.dot(position, yAxis)
    p3 = vec3.dot(position, zAxis)

    return [
        xAxis[0], yAxis[0], zAxis[0], 0,
        xAxis[1], yAxis[1], zAxis[1], 0,
        xAxis[2], yAxis[2], zAxis[2], 0,
        -p1, -p2, -p3, 1
    ]
}
