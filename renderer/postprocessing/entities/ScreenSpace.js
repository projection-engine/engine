import Framebuffer from "../components/Framebuffer";
import {createRBO, createTexture} from "../../../utils/utils";

export default class ScreenSpace {
    gBuffer

    gPositionTexture
    gNormalTexture
    gPrevFrameTexture
    gBehaviorTexture // METALLIC - ROUGHNESS - AO
    gDepthTexture

    constructor(gpu) {
        this.gpu = gpu

        this.width = gpu.canvas.width
        this.height = gpu.canvas.height
        this.gBuffer = this.gpu.createFramebuffer()
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.gBuffer)

        // POSITION
        this.gPositionTexture = createTexture(
            this.gpu,
            this.width,
            this.height,
            this.gpu.RGBA16F,
            0,
            this.gpu.RGBA,
            this.gpu.FLOAT,
            null,
            this.gpu.NEAREST,
            this.gpu.NEAREST,
            this.gpu.CLAMP_TO_EDGE,
            this.gpu.CLAMP_TO_EDGE
        )
        this.gpu.framebufferTexture2D(
            this.gpu.FRAMEBUFFER,
            this.gpu.COLOR_ATTACHMENT0,
            this.gpu.TEXTURE_2D,
            this.gPositionTexture,
            0)

        // NORMAL
        this.gNormalTexture = createTexture(
            this.gpu,
            this.width,
            this.height,
            this.gpu.RGB16F,
            0,
            this.gpu.RGB,
            this.gpu.FLOAT,
            null,
            this.gpu.NEAREST,
            this.gpu.NEAREST,
            this.gpu.CLAMP_TO_EDGE,
            this.gpu.CLAMP_TO_EDGE
        )
        this.gpu.framebufferTexture2D(
            this.gpu.FRAMEBUFFER,
            this.gpu.COLOR_ATTACHMENT0 + 1,
            this.gpu.TEXTURE_2D,
            this.gNormalTexture,
            0)



        // BEHAVIOR
        this.gBehaviorTexture = createTexture(
            this.gpu,
            this.width,
            this.height,
            this.gpu.RGB32F,
            0,
            this.gpu.RGB,
            this.gpu.FLOAT,
            null,
            this.gpu.NEAREST,
            this.gpu.NEAREST,
            this.gpu.CLAMP_TO_EDGE,
            this.gpu.CLAMP_TO_EDGE
        )
        this.gpu.framebufferTexture2D(
            this.gpu.FRAMEBUFFER,
            this.gpu.COLOR_ATTACHMENT0 + 2,
            this.gpu.TEXTURE_2D,
            this.gBehaviorTexture,
            0)

        this.gpu.drawBuffers([this.gpu.COLOR_ATTACHMENT0, this.gpu.COLOR_ATTACHMENT1, this.gpu.COLOR_ATTACHMENT2, this.gpu.DEPTH_ATTACHMENT])
        this.renderBufferObject = createRBO(this.gpu, this.width, this.height, this.gpu.DEPTH_COMPONENT, this.gpu.DEPTH_ATTACHMENT)
    }

    startMapping() {
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.gBuffer)
        this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)
    }

    stopMapping() {
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)
    }
}