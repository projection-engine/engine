import {createRBO, createTexture} from "../../utils/utils";
import Framebuffer from "./Framebuffer";

export default class ScreenSpace extends Framebuffer{
    constructor(gpu, resolutionMultiplier) {
        super(gpu, window.screen.width * resolutionMultiplier, window.screen.height * resolutionMultiplier);
        this.frameBufferObject = this.gpu.createFramebuffer()
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.frameBufferObject)
        this.frameBufferTexture = createTexture(
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
            this.frameBufferTexture,
            0)

        this.renderBufferObject = createRBO(
            this.gpu,
            this.width,
            this.height,
            this.gpu.DEPTH_COMPONENT24,
            this.gpu.DEPTH_ATTACHMENT
        )
    }
}