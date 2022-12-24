import GPU from "../../GPU";
import LightProbe from "../../instances/LightProbe";


export default class CubeMapAPI{
    static frameBuffer?:WebGLFramebuffer

    static #initialized = false
    static initialize() {
        if (CubeMapAPI.#initialized)
            return
        CubeMapAPI.#initialized = true
        GPU.context.bindVertexArray(null)
        CubeMapAPI.frameBuffer = GPU.context.createFramebuffer()
    }

    static createRenderBuffer(resolution:number):WebGLRenderbuffer {
        GPU.context.bindFramebuffer(GPU.context.FRAMEBUFFER, CubeMapAPI.frameBuffer)
        const rbo = GPU.context.createRenderbuffer()
        GPU.context.bindRenderbuffer(GPU.context.RENDERBUFFER, rbo)
        GPU.context.renderbufferStorage(GPU.context.RENDERBUFFER, GPU.context.DEPTH_COMPONENT24, resolution, resolution)
        GPU.context.framebufferRenderbuffer(GPU.context.FRAMEBUFFER, GPU.context.DEPTH_ATTACHMENT, GPU.context.RENDERBUFFER, rbo)
        return rbo
    }

    static initializeTexture(asDepth:boolean, resolution:number, mipmap?:boolean):WebGLTexture {
        const texture = GPU.context.createTexture()
        GPU.context.bindTexture(GPU.context.TEXTURE_CUBE_MAP, texture)
        GPU.context.texParameteri(GPU.context.TEXTURE_CUBE_MAP, GPU.context.TEXTURE_MAG_FILTER, asDepth ? GPU.context.NEAREST : GPU.context.LINEAR)
        GPU.context.texParameteri(GPU.context.TEXTURE_CUBE_MAP, GPU.context.TEXTURE_MIN_FILTER, asDepth ? GPU.context.NEAREST : (mipmap ? GPU.context.LINEAR_MIPMAP_LINEAR : GPU.context.LINEAR))

        GPU.context.texParameteri(GPU.context.TEXTURE_CUBE_MAP, GPU.context.TEXTURE_WRAP_S, GPU.context.CLAMP_TO_EDGE)
        GPU.context.texParameteri(GPU.context.TEXTURE_CUBE_MAP, GPU.context.TEXTURE_WRAP_T, GPU.context.CLAMP_TO_EDGE)
        GPU.context.texParameteri(GPU.context.TEXTURE_CUBE_MAP, GPU.context.TEXTURE_WRAP_R, GPU.context.CLAMP_TO_EDGE)
        const d = [
            {access: GPU.context.TEXTURE_CUBE_MAP_POSITIVE_X},
            {access: GPU.context.TEXTURE_CUBE_MAP_NEGATIVE_X},
            {access: GPU.context.TEXTURE_CUBE_MAP_POSITIVE_Y},
            {access: GPU.context.TEXTURE_CUBE_MAP_NEGATIVE_Y},
            {access: GPU.context.TEXTURE_CUBE_MAP_POSITIVE_Z},
            {access: GPU.context.TEXTURE_CUBE_MAP_NEGATIVE_Z}
        ]
        for (let i = 0; i < 6; i++) {
            GPU.context.texImage2D(
                d[i].access,
                0,
                asDepth ? GPU.context.DEPTH_COMPONENT32F : GPU.context.RGBA16F,
                resolution,
                resolution,
                0,
                asDepth ? GPU.context.DEPTH_COMPONENT : GPU.context.RGBA,
                GPU.context.FLOAT,
                null)
        }

        if (mipmap)
            GPU.context.generateMipmap(GPU.context.TEXTURE_CUBE_MAP)
        return texture
    }

    static delete(probe:LightProbe) {
        if (probe.texture)
            GPU.context.deleteTexture(probe.texture)
        if (probe.irradianceTexture)
            GPU.context.deleteTexture(probe.irradianceTexture)
        if (probe.prefiltered)
            GPU.context.deleteTexture(probe.prefiltered)
    }
}

