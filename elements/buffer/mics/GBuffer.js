import {createRBO} from "../../../utils/misc/utils";
import Framebuffer from "./Framebuffer";
import FramebufferTextureInstance from "../../instances/FramebufferTextureInstance";

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
        this.gPositionTexture =  FramebufferTextureInstance.generate(gpu, this.width, this.height, gpu.COLOR_ATTACHMENT0)

        // NORMAL
        this.gNormalTexture = FramebufferTextureInstance.generate(gpu, this.width, this.height, gpu.COLOR_ATTACHMENT1)

        // ALBEDO (rgb)
        this.gAlbedo =  FramebufferTextureInstance.generate(gpu, this.width, this.height, gpu.COLOR_ATTACHMENT2)

        // AO (r) - Roughness (g) - Metallic (b)
        this.gBehaviorTexture = FramebufferTextureInstance.generate(gpu, this.width, this.height, gpu.COLOR_ATTACHMENT3)


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