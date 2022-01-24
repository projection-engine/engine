import {createRBO} from "../../utils/utils";
import Framebuffer from "./Framebuffer";

export default class GBuffer extends Framebuffer {
    gBuffer
    gPositionTexture
    gNormalTexture
    gAlbedo
    gBehaviorTexture // METALLIC - ROUGHNESS - AO

    constructor(gpu) {
        super(gpu, gpu.canvas.width, gpu.canvas.height)
        //
        // this.prevFrameBuffer = this.gpu.createFramebuffer()
        // this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.prevFrameBuffer)
        // this.previousFrame = createTexture(
        //     this.gpu,
        //     this.width,
        //     this.height,
        //     this.gpu.RGBA16F,
        //     0,
        //     this.gpu.RGBA,
        //     this.gpu.FLOAT,
        //     null,
        //     this.gpu.NEAREST,
        //     this.gpu.NEAREST,
        //     this.gpu.CLAMP_TO_EDGE,
        //     this.gpu.CLAMP_TO_EDGE
        // )
        // this.gpu.framebufferTexture2D(
        //     this.gpu.FRAMEBUFFER,
        //     this.gpu.COLOR_ATTACHMENT0,
        //     this.gpu.TEXTURE_2D,
        //     this.previousFrame,
        //     0)
        // this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)


        this.gBuffer = this.gpu.createFramebuffer()
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.gBuffer)

        // POSITION
        this.gPositionTexture = this.gpu.createTexture()
        this.gpu.bindTexture(this.gpu.TEXTURE_2D, this.gPositionTexture);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_MAG_FILTER, this.gpu.NEAREST);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_MIN_FILTER, this.gpu.NEAREST);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_WRAP_S, this.gpu.CLAMP_TO_EDGE);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_WRAP_T, this.gpu.CLAMP_TO_EDGE);
        this.gpu.texStorage2D(this.gpu.TEXTURE_2D, 1, this.gpu.RGBA16F, this.width, this.height);
        this.gpu.framebufferTexture2D(this.gpu.FRAMEBUFFER, this.gpu.COLOR_ATTACHMENT0, this.gpu.TEXTURE_2D, this.gPositionTexture, 0);

        // NORMAL
        this.gNormalTexture = this.gpu.createTexture()
        this.gpu.bindTexture(this.gpu.TEXTURE_2D, this.gNormalTexture);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_MAG_FILTER, this.gpu.NEAREST);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_MIN_FILTER, this.gpu.NEAREST);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_WRAP_S, this.gpu.CLAMP_TO_EDGE);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_WRAP_T, this.gpu.CLAMP_TO_EDGE);
        this.gpu.texStorage2D(this.gpu.TEXTURE_2D, 1, this.gpu.RGBA16F, this.width, this.height);
        this.gpu.framebufferTexture2D(this.gpu.FRAMEBUFFER, this.gpu.COLOR_ATTACHMENT1, this.gpu.TEXTURE_2D, this.gNormalTexture, 0);

        // ALBEDO (rgb)
        this.gAlbedo = this.gpu.createTexture()
        this.gpu.bindTexture(this.gpu.TEXTURE_2D, this.gAlbedo);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_MAG_FILTER, this.gpu.NEAREST);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_MIN_FILTER, this.gpu.NEAREST);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_WRAP_S, this.gpu.CLAMP_TO_EDGE);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_WRAP_T, this.gpu.CLAMP_TO_EDGE);
        this.gpu.texStorage2D(this.gpu.TEXTURE_2D, 1, this.gpu.RGBA16F, this.width, this.height);
        this.gpu.framebufferTexture2D(this.gpu.FRAMEBUFFER, this.gpu.COLOR_ATTACHMENT2, this.gpu.TEXTURE_2D, this.gAlbedo, 0);

        // // AO (r) - Roughness (g) - Height (b)
        this.gBehaviorTexture = this.gpu.createTexture()
        this.gpu.bindTexture(this.gpu.TEXTURE_2D, this.gBehaviorTexture);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_MAG_FILTER, this.gpu.NEAREST);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_MIN_FILTER, this.gpu.NEAREST);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_WRAP_S, this.gpu.CLAMP_TO_EDGE);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_WRAP_T, this.gpu.CLAMP_TO_EDGE);
        this.gpu.texStorage2D(this.gpu.TEXTURE_2D, 1, this.gpu.RGBA16F, this.width, this.height);
        this.gpu.framebufferTexture2D(this.gpu.FRAMEBUFFER, this.gpu.COLOR_ATTACHMENT3, this.gpu.TEXTURE_2D, this.gBehaviorTexture, 0);


        this.gpu.drawBuffers([
            this.gpu.COLOR_ATTACHMENT0,
            this.gpu.COLOR_ATTACHMENT1,
            this.gpu.COLOR_ATTACHMENT2,
            this.gpu.COLOR_ATTACHMENT3
        ])


        this.renderBufferObject = createRBO(
            this.gpu,
            this.width,
            this.height,
            this.gpu.DEPTH_COMPONENT24,
            this.gpu.DEPTH_ATTACHMENT
        )

        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null);
    }

    startMapping() {
        super.startMapping(this.gBuffer)
    }

    stopMapping() {
        super.stopMapping(false);
    }

    draw(shader) {
        super.draw(shader, false);
        // bindTexture(0, this.previousFrame, shader.previousFrameULocation, this.gpu)
    }

}