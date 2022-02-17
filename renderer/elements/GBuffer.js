import {createRBO} from "../../utils/utils";
import Framebuffer from "./Framebuffer";

export default class GBuffer extends Framebuffer {
    gBuffer
    gPositionTexture
    gNormalTexture
    gAlbedo
    gBehaviorTexture // METALLIC - ROUGHNESS - AO

    constructor(gpu, resolutionMultiplier) {
        super(gpu, window.screen.width * resolutionMultiplier, window.screen.height * resolutionMultiplier)

        this.gBuffer = gpu.createFramebuffer()
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, this.gBuffer)

        // POSITION
        this.gPositionTexture = gpu.createTexture()
        gpu.bindTexture(gpu.TEXTURE_2D, this.gPositionTexture);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.CLAMP_TO_EDGE);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.CLAMP_TO_EDGE);
        gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RGBA16F, this.width, this.height);
        gpu.framebufferTexture2D(gpu.FRAMEBUFFER, gpu.COLOR_ATTACHMENT0, gpu.TEXTURE_2D, this.gPositionTexture, 0);

        // NORMAL
        this.gNormalTexture = gpu.createTexture()
        gpu.bindTexture(gpu.TEXTURE_2D, this.gNormalTexture);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.CLAMP_TO_EDGE);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.CLAMP_TO_EDGE);
        gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RGBA16F, this.width, this.height);
        gpu.framebufferTexture2D(gpu.FRAMEBUFFER, gpu.COLOR_ATTACHMENT1, gpu.TEXTURE_2D, this.gNormalTexture, 0);

        // ALBEDO (rgb)
        this.gAlbedo = gpu.createTexture()
        gpu.bindTexture(gpu.TEXTURE_2D, this.gAlbedo);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.CLAMP_TO_EDGE);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.CLAMP_TO_EDGE);
        gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RGBA16F, this.width, this.height);
        gpu.framebufferTexture2D(gpu.FRAMEBUFFER, gpu.COLOR_ATTACHMENT2, gpu.TEXTURE_2D, this.gAlbedo, 0);

        // AO (r) - Roughness (g) - Metallic (b)
        this.gBehaviorTexture = gpu.createTexture()
        gpu.bindTexture(gpu.TEXTURE_2D, this.gBehaviorTexture);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.CLAMP_TO_EDGE);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.CLAMP_TO_EDGE);
        gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RGBA16F, this.width, this.height);
        gpu.framebufferTexture2D(gpu.FRAMEBUFFER, gpu.COLOR_ATTACHMENT3, gpu.TEXTURE_2D, this.gBehaviorTexture, 0);


        gpu.drawBuffers([
            gpu.COLOR_ATTACHMENT0,
            gpu.COLOR_ATTACHMENT1,
            gpu.COLOR_ATTACHMENT2,
            gpu.COLOR_ATTACHMENT3
        ])


        this.renderBufferObject = createRBO(
            gpu,
            this.width,
            this.height,
            gpu.DEPTH_COMPONENT24,
            gpu.DEPTH_ATTACHMENT
        )

        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null);
    }

    startMapping() {
        super.startMapping(this.gBuffer)
    }

    stopMapping() {
        super.stopMapping(false);
    }

    draw(shader) {
        super.draw(shader, false);
    }

}