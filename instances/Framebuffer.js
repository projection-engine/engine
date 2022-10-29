import GPUResources from "../GPUResources";
import Texture from "./Texture";

export default class Framebuffer {

    FBO
    RBO
    depthSampler
    colors = []
    attachments = []

    constructor(width = GPUResources.internalResolution.w, height = GPUResources.internalResolution.h) {

        this.width = width
        this.height = height
        this.FBO = gpu.createFramebuffer()

        this.fallback = {
            w: this.width,
            h: this.height,
            attachment: 0,
            precision: gpu.RGBA16F,
            format: gpu.RGBA,
            type: gpu.FLOAT,
            linear: false,
            repeat: false,
            flip: false
        }
    }


    startMapping(buffer = this.FBO, autoSetViewport = true, clear = true) {
        if (autoSetViewport)
            gpu.viewport(0, 0, this.width, this.height)
        this.use()
        if (clear)
            gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)
    }

    stopMapping(clear = true) {
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null)
        GPUResources.activeFramebuffer = undefined
        if (clear)
            gpu?.viewport(0, 0, gpu.drawingBufferWidth, gpu.drawingBufferHeight)

        gpu.bindVertexArray(null)
    }

    depthTexture(precision = gpu.DEPTH_COMPONENT32F) {
        this.use()
        this.depthSampler = Texture.createTexture(
            this.width,
            this.height,
            precision,
            0,
            gpu.DEPTH_COMPONENT,
            gpu.FLOAT,
            null,
            gpu.NEAREST,
            gpu.NEAREST,
            gpu.CLAMP_TO_EDGE,
            gpu.CLAMP_TO_EDGE,
            true
        )

        gpu.framebufferTexture2D(
            gpu.FRAMEBUFFER,
            gpu.DEPTH_ATTACHMENT,
            gpu.TEXTURE_2D,
            this.depthSampler,
            0
        )
        return this
    }

    depthTest(typeStorage = gpu.DEPTH_COMPONENT24) {
        this.use()
        this.RBO = gpu.createRenderbuffer()
        gpu.bindRenderbuffer(gpu.RENDERBUFFER, this.RBO)
        gpu.renderbufferStorage(gpu.RENDERBUFFER, typeStorage, this.width, this.height)
        gpu.framebufferRenderbuffer(gpu.FRAMEBUFFER, gpu.DEPTH_ATTACHMENT, gpu.RENDERBUFFER, this.RBO)

        return this
    }

    texture(obj) {
        const {
            w,
            h,
            attachment,
            precision,
            format,
            type,

            linear,
            repeat
        } = {...this.fallback, ...obj}


        this.use()
        const texture = gpu.createTexture()
        gpu.bindTexture(gpu.TEXTURE_2D, texture)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, linear ? gpu.LINEAR : gpu.NEAREST)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, linear ? gpu.LINEAR : gpu.NEAREST)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, repeat ? gpu.REPEAT : gpu.CLAMP_TO_EDGE)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, repeat ? gpu.REPEAT : gpu.CLAMP_TO_EDGE)

        gpu.texImage2D(
            gpu.TEXTURE_2D,
            0,
            precision,
            w,
            h,
            0,
            format,
            type,
            null)
        gpu.framebufferTexture2D(gpu.FRAMEBUFFER, gpu.COLOR_ATTACHMENT0 + attachment, gpu.TEXTURE_2D, texture, 0)

        this.colors.push(texture)
        this.attachments[attachment] = gpu.COLOR_ATTACHMENT0 + attachment
        gpu.drawBuffers(this.attachments)

        return this
    }


    use() {
        if (GPUResources.activeFramebuffer !== this.FBO) {
            gpu.bindFramebuffer(gpu.FRAMEBUFFER, this.FBO)
            GPUResources.activeFramebuffer = this.FBO
        }
        return this
    }

    clear() {
        this.use()
        gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT | gpu.STENCIL_BUFFER_BIT)
    }

    static toImage(fbo, w = 300, h = 300) {
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const context = canvas.getContext("2d")
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, fbo)
        let data = new Float32Array(w * h * 4)
        gpu.readPixels(0, 0, w, h, gpu.RGBA, gpu.FLOAT, data)
        for (let i = 0; i < data.length; i += 4) {
            data[i] *= 255
            data[i + 1] *= 255
            data[i + 2] *= 255
            data[i + 3] = 255
        }

        const imageData = context.createImageData(w, h)
        imageData.data.set(data)
        context.putImageData(imageData, 0, 0)
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null)
        data = canvas.toDataURL()
        return data
    }
}