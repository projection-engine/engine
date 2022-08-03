import {createRBO, createTexture} from "../../utils/utils"
import QuadInstance from "./QuadInstance"

export default class FramebufferInstance extends QuadInstance {
    FBO
    RBO

    depthSampler
    colors = []
    attachments = []

    constructor( width = window.screen.width, height = window.screen.height) {
        super()
        this.width = width
        this.height = height
        this.FBO = window.gpu.createFramebuffer()

        this.fallback = {
            w: this.width,
            h: this.height,
            attachment: 0,
            precision: window.gpu.RGBA16F,
            format: window.gpu.RGBA,
            type: window.gpu.FLOAT,
            linear: false,
            repeat: false,
            flip: false
        }
    }


    startMapping(buffer = this.FBO, autoSetViewport = true, clear = true) {
        if (autoSetViewport)
            window.gpu.viewport(0, 0, this.width, this.height)
        window.gpu.bindFramebuffer(window.gpu.FRAMEBUFFER, buffer)
        if (clear)
            window.gpu.clear(window.gpu.COLOR_BUFFER_BIT | window.gpu.DEPTH_BUFFER_BIT)
    }

    stopMapping(clear = true,) {

        window.gpu.bindFramebuffer(window.gpu.FRAMEBUFFER, null)

        if (clear) {
            window.gpu?.viewport(0, 0, window.gpu.drawingBufferWidth, window.gpu.drawingBufferHeight)
        }
    }


    draw() {
        super.draw()
    }


    depthTexture(precision = window.gpu.DEPTH_COMPONENT32F) {
        this.use()
        this.depthSampler = createTexture(
            this.width,
            this.height,
            precision,
            0,
            window.gpu.DEPTH_COMPONENT,
            window.gpu.FLOAT,
            null,
            window.gpu.NEAREST,
            window.gpu.NEAREST,
            window.gpu.CLAMP_TO_EDGE,
            window.gpu.CLAMP_TO_EDGE,
            true
        )

        window.gpu.framebufferTexture2D(
            window.gpu.FRAMEBUFFER,
            window.gpu.DEPTH_ATTACHMENT,
            window.gpu.TEXTURE_2D,
            this.depthSampler,
            0
        )
        return this
    }

    depthTest(precision = window.gpu.DEPTH_COMPONENT24) {
        this.use()
        this.RBO = createRBO(
            this.width,
            this.height,
            precision,
            window.gpu.DEPTH_ATTACHMENT
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
        const texture = window.gpu.createTexture()
        if (flip === true) window.gpu.pixelStorei(window.gpu.UNPACK_FLIP_Y_WEBGL, true)

        window.gpu.bindTexture(window.gpu.TEXTURE_2D, texture)
        window.gpu.texParameteri(window.gpu.TEXTURE_2D, window.gpu.TEXTURE_MAG_FILTER, linear ? window.gpu.LINEAR : window.gpu.NEAREST)
        window.gpu.texParameteri(window.gpu.TEXTURE_2D, window.gpu.TEXTURE_MIN_FILTER, linear ? window.gpu.LINEAR : window.gpu.NEAREST)
        window.gpu.texParameteri(window.gpu.TEXTURE_2D, window.gpu.TEXTURE_WRAP_S, repeat ? window.gpu.REPEAT : window.gpu.CLAMP_TO_EDGE)
        window.gpu.texParameteri(window.gpu.TEXTURE_2D, window.gpu.TEXTURE_WRAP_T, repeat ? window.gpu.REPEAT : window.gpu.CLAMP_TO_EDGE)

        window.gpu.texImage2D(
            window.gpu.TEXTURE_2D,
            0,
            precision,
            w,
            h,
            0,
            format,
            type,
            null)
        window.gpu.framebufferTexture2D(window.gpu.FRAMEBUFFER, window.gpu.COLOR_ATTACHMENT0 + attachment, window.gpu.TEXTURE_2D, texture, 0)

        this.colors.push(texture)
        this.attachments[attachment] = window.gpu.COLOR_ATTACHMENT0 + attachment
        window.gpu.drawBuffers(this.attachments)

        return this
    }


    use() {
        window.gpu.bindFramebuffer(window.gpu.FRAMEBUFFER, this.FBO)
        return this
    }

    clear() {
        window.gpu.bindFramebuffer(window.gpu.FRAMEBUFFER, this.FBO)
        window.gpu.clear(window.gpu.COLOR_BUFFER_BIT | window.gpu.DEPTH_BUFFER_BIT | window.gpu.STENCIL_BUFFER_BIT)
    }
}