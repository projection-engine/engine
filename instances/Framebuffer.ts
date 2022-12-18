import GPU from "../lib/GPU";
import Texture from "./Texture";

interface FBOTexture {
    [key:string]:any,
    w?: number,
    h?: number,
    attachment?: number,
    precision?: number,
    format?: number,
    type?: number,
    linear?: boolean,
    repeat?: boolean

}

export default class Framebuffer {
    private readonly fallback:FBOTexture

    readonly width:number
    readonly height:number
    readonly FBO:WebGLFramebuffer
    RBO:WebGLRenderbuffer
    depthSampler:WebGLTexture
    readonly colors:WebGLTexture[] = []
    readonly attachments:number[] = []
    readonly colorsMetadata:FBOTexture[] = []

    constructor(width = GPU.internalResolution.w, height = GPU.internalResolution.h) {

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
            repeat: false
        }
    }


    startMapping(noClearing?:boolean): void {
        this.use()
        gpu.viewport(0, 0, this.width, this.height)
        if (!noClearing)
            gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)
        else
            console.trace("IM HERE")
    }


    stopMapping(): void {
        GPU.activeFramebuffer = undefined
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null)
        gpu.viewport(0, 0, gpu.drawingBufferWidth, gpu.drawingBufferHeight)
    }

    depthTexture(): Framebuffer {
        this.use()
        this.depthSampler = Texture.createTexture(
            this.width,
            this.height,
            gpu.DEPTH_COMPONENT24,
            0,
            gpu.DEPTH_COMPONENT,
            gpu.UNSIGNED_INT,
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

    depthTest(): Framebuffer {
        this.use()
        this.RBO = gpu.createRenderbuffer()
        gpu.bindRenderbuffer(gpu.RENDERBUFFER, this.RBO)
        gpu.renderbufferStorage(gpu.RENDERBUFFER, gpu.DEPTH_COMPONENT24, this.width, this.height)
        gpu.framebufferRenderbuffer(gpu.FRAMEBUFFER, gpu.DEPTH_ATTACHMENT, gpu.RENDERBUFFER, this.RBO)

        return this
    }

    texture(obj?: FBOTexture): Framebuffer {
        const w = obj?.w || this.fallback.w
        const h = obj?.h || this.fallback.h
        const attachment = obj?.attachment || this.fallback.attachment
        const precision = obj?.precision || this.fallback.precision
        const format = obj?.format || this.fallback.format
        const type = obj?.type || this.fallback.type
        const linear = obj?.linear || this.fallback.linear
        const repeat = obj?.repeat || this.fallback.repeat


        this.colorsMetadata.push({...this.fallback, ...obj})
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

    use(): void {
        if (GPU.activeFramebuffer !== this.FBO) {
            gpu.bindFramebuffer(gpu.FRAMEBUFFER, this.FBO)
            GPU.activeFramebuffer = this.FBO
        }
    }

    clear(): void {
        this.use()
        if (this.RBO)
            gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)
        else
            gpu.clear(gpu.COLOR_BUFFER_BIT)
    }

    stop(): void {
        GPU.activeFramebuffer = undefined
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null)
    }

    static toImage(fbo, w = 300, h = 300): string {
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
        return canvas.toDataURL()
    }
}