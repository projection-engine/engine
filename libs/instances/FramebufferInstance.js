import {createRBO, createTexture} from "../../utils/utils"
import QuadInstance from "./QuadInstance"

export default class FramebufferInstance extends QuadInstance {
    FBO
    RBO

    depthSampler
    colors = []
    attachments = []

    constructor( width = screen.width, height = screen.height) {
        super()
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
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, buffer)
        if (clear)
            gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)
    }

    stopMapping(clear = true,) {

        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null)

        if (clear) {
            gpu?.viewport(0, 0, gpu.drawingBufferWidth, gpu.drawingBufferHeight)
        }
    }
    depthTexture(precision = gpu.DEPTH_COMPONENT32F) {
        this.use()
        this.depthSampler = createTexture(
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

    depthTest(precision = gpu.DEPTH_COMPONENT24) {
        this.use()
        this.RBO = createRBO(
            this.width,
            this.height,
            precision,
            gpu.DEPTH_ATTACHMENT
        )
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
            repeat,
            flip
        } = {...this.fallback, ...obj}


        this.use()
        const texture = gpu.createTexture()
        if (flip === true) gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL, true)

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
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, this.FBO)
        return this
    }

    clear() {
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, this.FBO)
        gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT | gpu.STENCIL_BUFFER_BIT)
    }
}