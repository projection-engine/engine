import GPU from "../GPU";
import Texture from "./Texture";

interface FBOTexture {
    [key: string]: any,

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
    static lastBoundResolution = new Float32Array([0, 0])
    private readonly fallback: FBOTexture

    readonly width: number
    readonly height: number
    readonly FBO: WebGLFramebuffer
    RBO: WebGLRenderbuffer
    depthSampler: WebGLTexture
    readonly colors: WebGLTexture[] = []
    readonly attachments: number[] = []
    readonly colorsMetadata: FBOTexture[] = []
    resolution = new Float32Array(2)

    constructor(width = GPU.internalResolution.w, height = GPU.internalResolution.h) {

        this.width = width
        this.height = height
        this.resolution[0] = width
        this.resolution[1] = height
        this.FBO = GPU.context.createFramebuffer()

        this.fallback = {
            w: this.width,
            h: this.height,
            attachment: 0,
            precision: GPU.context.RGBA16F,
            format: GPU.context.RGBA,
            type: GPU.context.FLOAT,
            linear: false,
            repeat: false
        }
    }


    startMapping(noClearing?: boolean) {
        // if(GPU.activeFramebuffer === this)
        //     return

        this.use()
        const last = Framebuffer.lastBoundResolution
        const w = this.width
        const h = this.height
        if (last[0] !== w || last[1] !== h) {
            GPU.context.viewport(0, 0, w, h)
            last[0] = w
            last[1] = h
        }
        if (!noClearing)
            GPU.context.clear(GPU.context.COLOR_BUFFER_BIT | GPU.context.DEPTH_BUFFER_BIT)

    }


    stopMapping() {
        if(GPU.activeFramebuffer !== this)
            return

        const context = GPU.context
        GPU.activeFramebuffer = undefined
        context.bindFramebuffer(context.FRAMEBUFFER, null)
        const last = Framebuffer.lastBoundResolution
        const w = context.drawingBufferWidth
        const h = context.drawingBufferHeight
        if (last[0] !== w || last[1] !== h) {
            context.viewport(0, 0, w, h)
            last[0] = w
            last[1] = h
        }
    }

    depthTexture(): Framebuffer {
        this.use()
        this.depthSampler = Texture.createTexture(
            this.width,
            this.height,
            GPU.context.DEPTH_COMPONENT24,
            0,
            GPU.context.DEPTH_COMPONENT,
            GPU.context.UNSIGNED_INT,
            null,
            GPU.context.NEAREST,
            GPU.context.NEAREST,
            GPU.context.CLAMP_TO_EDGE,
            GPU.context.CLAMP_TO_EDGE,
            true
        )

        GPU.context.framebufferTexture2D(
            GPU.context.FRAMEBUFFER,
            GPU.context.DEPTH_ATTACHMENT,
            GPU.context.TEXTURE_2D,
            this.depthSampler,
            0
        )
        return this
    }

    depthTest(): Framebuffer {
        this.use()
        this.RBO = GPU.context.createRenderbuffer()
        GPU.context.bindRenderbuffer(GPU.context.RENDERBUFFER, this.RBO)
        GPU.context.renderbufferStorage(GPU.context.RENDERBUFFER, GPU.context.DEPTH_COMPONENT24, this.width, this.height)
        GPU.context.framebufferRenderbuffer(GPU.context.FRAMEBUFFER, GPU.context.DEPTH_ATTACHMENT, GPU.context.RENDERBUFFER, this.RBO)

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
        const texture = GPU.context.createTexture()
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, texture)
        GPU.context.texParameteri(GPU.context.TEXTURE_2D, GPU.context.TEXTURE_MAG_FILTER, linear ? GPU.context.LINEAR : GPU.context.NEAREST)
        GPU.context.texParameteri(GPU.context.TEXTURE_2D, GPU.context.TEXTURE_MIN_FILTER, linear ? GPU.context.LINEAR : GPU.context.NEAREST)
        GPU.context.texParameteri(GPU.context.TEXTURE_2D, GPU.context.TEXTURE_WRAP_S, repeat ? GPU.context.REPEAT : GPU.context.CLAMP_TO_EDGE)
        GPU.context.texParameteri(GPU.context.TEXTURE_2D, GPU.context.TEXTURE_WRAP_T, repeat ? GPU.context.REPEAT : GPU.context.CLAMP_TO_EDGE)

        GPU.context.texImage2D(
            GPU.context.TEXTURE_2D,
            0,
            precision,
            w,
            h,
            0,
            format,
            type,
            null)
        GPU.context.framebufferTexture2D(GPU.context.FRAMEBUFFER, GPU.context.COLOR_ATTACHMENT0 + attachment, GPU.context.TEXTURE_2D, texture, 0)

        this.colors.push(texture)
        this.attachments[attachment] = GPU.context.COLOR_ATTACHMENT0 + attachment
        GPU.context.drawBuffers(this.attachments)

        return this
    }

    use() {
        if (GPU.activeFramebuffer === this)
            return
        GPU.context.bindFramebuffer(GPU.context.FRAMEBUFFER, this.FBO)
        GPU.activeFramebuffer = this
    }

    clear() {
        this.use()
        GPU.context.clear(GPU.context.COLOR_BUFFER_BIT | GPU.context.DEPTH_BUFFER_BIT)
        GPU.context.bindFramebuffer(GPU.context.FRAMEBUFFER, null)
    }

    stop() {
        GPU.activeFramebuffer = undefined
        GPU.context.bindFramebuffer(GPU.context.FRAMEBUFFER, null)
    }

    static toImage(fbo, w = 300, h = 300): string {
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const context = canvas.getContext("2d")
        GPU.context.bindFramebuffer(GPU.context.FRAMEBUFFER, fbo)
        let data = new Float32Array(w * h * 4)
        GPU.context.readPixels(0, 0, w, h, GPU.context.RGBA, GPU.context.FLOAT, data)
        for (let i = 0; i < data.length; i += 4) {
            data[i] *= 255
            data[i + 1] *= 255
            data[i + 2] *= 255
            data[i + 3] = 255
        }

        const imageData = context.createImageData(w, h)
        imageData.data.set(data)
        context.putImageData(imageData, 0, 0)
        GPU.context.bindFramebuffer(GPU.context.FRAMEBUFFER, null)
        return canvas.toDataURL()
    }
}