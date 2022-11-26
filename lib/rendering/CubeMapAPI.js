import GPU from "../../GPU";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";


export default class CubeMapAPI {
    static frameBuffer
    static #initialized

    static get irradianceShader() {
        return GPU.shaders.get(STATIC_SHADERS.PRODUCTION.IRRADIANCE)
    }

    static get prefilteredShader() {
        return GPU.shaders.get(STATIC_SHADERS.PRODUCTION.PREFILTERED)
    }

    static initialize() {
        if (CubeMapAPI.#initialized)
            return

        CubeMapAPI.#initialized = true
        gpu.bindVertexArray(null)
        CubeMapAPI.frameBuffer = gpu.createFramebuffer()
    }

    static createRenderBuffer(resolution) {
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, CubeMapAPI.frameBuffer)
        const rbo = gpu.createRenderbuffer()
        gpu.bindRenderbuffer(gpu.RENDERBUFFER, rbo)
        gpu.renderbufferStorage(gpu.RENDERBUFFER, gpu.DEPTH_COMPONENT24, resolution, resolution)
        gpu.framebufferRenderbuffer(gpu.FRAMEBUFFER, gpu.DEPTH_ATTACHMENT, gpu.RENDERBUFFER, rbo)
        return rbo
    }

    static initializeTexture(asDepth, resolution, mipmap) {

        const texture = gpu.createTexture()
        gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, texture)
        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_MAG_FILTER, asDepth ? gpu.NEAREST : gpu.LINEAR)
        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_MIN_FILTER, asDepth ? gpu.NEAREST : (mipmap ? gpu.LINEAR_MIPMAP_LINEAR : gpu.LINEAR))

        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_WRAP_S, gpu.CLAMP_TO_EDGE)
        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_WRAP_T, gpu.CLAMP_TO_EDGE)
        gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_WRAP_R, gpu.CLAMP_TO_EDGE)
        const d = [
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
                asDepth ? gpu.DEPTH_COMPONENT32F : gpu.RGBA16F,
                resolution,
                resolution,
                0,
                asDepth ? gpu.DEPTH_COMPONENT : gpu.RGBA,
                gpu.FLOAT,
                null)
        }

        if (mipmap)
            gpu.generateMipmap(gpu.TEXTURE_CUBE_MAP)
        return texture
    }

    static delete(probe) {
        if (!probe)
            return
        if (probe.texture)
            gpu.deleteTexture(probe.texture)
        if (probe.irradianceTexture)
            gpu.deleteTexture(probe.irradianceTexture)
        if (probe.prefiltered)
            gpu.deleteTexture(probe.prefiltered)
    }
}

