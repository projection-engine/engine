import {bindTexture, createRBO, createTexture} from "../../../utils/utils";
import Framebuffer from "../components/Framebuffer";

export default class PostProcessing extends Framebuffer{
    frameBufferObject
    frameBufferTexture
    renderBufferObject

    constructor(gpu) {

        super(gpu, gpu.canvas.width,gpu.canvas.height);
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

    stopMapping() {
        super.stopMapping();
    }

    onBeforeDraw(shader) {
        super.onBeforeDraw();

        const gama = 2.2
        const exposure = 2

        const inverseFilterTextureSize = [1/this.gpu.canvas.width, 1/this.gpu.canvas.height, 0]
        const FXAASpanMax = 8
        const FXAAReduceMin = 1/128
        const FXAAReduceMul = 1/8

        this.gpu.uniform1f(shader.FXAASpanMaxULocation, FXAASpanMax);
        this.gpu.uniform1f(shader.FXAAReduceMinULocation, FXAAReduceMin);
        this.gpu.uniform1f(shader.FXAAReduceMulULocation, FXAAReduceMul);
        this.gpu.uniform3fv(shader.inverseFilterTextureSizeULocation, inverseFilterTextureSize);

        this.gpu.uniform1f(shader.gammaULocation, gama);
        this.gpu.uniform1f(shader.exposureULocation, exposure);
    }
}