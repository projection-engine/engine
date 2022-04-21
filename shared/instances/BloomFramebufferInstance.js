import {createRBO, createTexture} from "../utils/misc/utils";
import Quad from "../utils/workers/Quad";

export default class BloomFramebufferInstance extends Quad {
    FBO
    prefilteredTexture
    blurTexture
    upScaledTexture
    constructor(gpu) {
        super(gpu);
        this.gpu = gpu

        this.width = window.screen.width
        this.height = window.screen.height
        this.FBO = gpu.createFramebuffer()
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, this.FBO)
    }


    startMapping(buffer = this.FBO, autoSetViewport = true, clear = true) {
        if (autoSetViewport)
            this.gpu.viewport(0, 0, this.width, this.height);
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, buffer);
        if (clear)
            this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT);
    }

    stopMapping(clear = true,) {

        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null);

        if (clear) {
            this.gpu?.viewport(0, 0, this.gpu.drawingBufferWidth, this.gpu.drawingBufferHeight);
        }
    }


    draw(shader) {
        super.draw()
    }


    depthTexture(precision = this.gpu.DEPTH_COMPONENT32F) {
        this.use()
        this.depthSampler = createTexture(
            this.gpu,
            this.width,
            this.height,
            precision,
            0,
            this.gpu.DEPTH_COMPONENT,
            this.gpu.FLOAT,
            null,
            this.gpu.NEAREST,
            this.gpu.NEAREST,
            this.gpu.CLAMP_TO_EDGE,
            this.gpu.CLAMP_TO_EDGE,
            true
        )

        this.gpu.framebufferTexture2D(
            this.gpu.FRAMEBUFFER,
            this.gpu.DEPTH_ATTACHMENT,
            this.gpu.TEXTURE_2D,
            this.depthSampler,
            0
        );
        return this
    }

    depthTest(precision = this.gpu.DEPTH_COMPONENT24) {
        this.use()
        this.RBO = createRBO(
            this.gpu,
            this.width,
            this.height,
            precision,
            this.gpu.DEPTH_ATTACHMENT
        )
        return this
    }

    texture(w = this.width, h = this.height, attachment = 0, precision = this.gpu.RGBA16F, format = this.gpu.RGBA, type = this.gpu.FLOAT, storage = true, linear, repeat, flip) {
        this.use()
        const texture = this.gpu.createTexture()
        if (flip === true) this.gpu.pixelStorei(this.gpu.UNPACK_FLIP_Y_WEBGL, true);

        this.gpu.bindTexture(this.gpu.TEXTURE_2D, texture);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_MAG_FILTER, linear ? this.gpu.LINEAR : this.gpu.NEAREST);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_MIN_FILTER, linear ? this.gpu.LINEAR : this.gpu.NEAREST);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_WRAP_S, repeat ? this.gpu.REPEAT : this.gpu.CLAMP_TO_EDGE);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_WRAP_T, repeat ? this.gpu.REPEAT : this.gpu.CLAMP_TO_EDGE);

        this.gpu.texImage2D(
            this.gpu.TEXTURE_2D,
            0,
            precision,
            w,
            h,
            0,
            format,
            type,
            null);
        this.gpu.framebufferTexture2D(this.gpu.FRAMEBUFFER, this.gpu.COLOR_ATTACHMENT0 + attachment, this.gpu.TEXTURE_2D, texture, 0);

        this.colors.push(texture)
        this.attachments[attachment] = this.gpu.COLOR_ATTACHMENT0 + attachment
        this.gpu.drawBuffers(this.attachments)

        return this
    }


    appendTexture(texture, attachment = 0, rebind = true, resetDrawBuffers = true) {
        if (rebind)
            this.use()
        this.gpu.framebufferTexture2D(
            this.gpu.FRAMEBUFFER,
            this.gpu.COLOR_ATTACHMENT0 + attachment,
            this.gpu.TEXTURE_2D,
            texture,
            0
        )
        this.attachments[attachment] = this.gpu.COLOR_ATTACHMENT0 + attachment
        if (resetDrawBuffers)
            this.gpu.drawBuffers(this.attachments)
    }

    use() {
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.FBO)
        return this
    }

    clear() {
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.FBO)
        this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT | this.gpu.STENCIL_BUFFER_BIT)
    }
}