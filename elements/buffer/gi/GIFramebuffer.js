import Framebuffer from "../mics/Framebuffer";
import FramebufferTextureInstance from "../../instances/FramebufferTextureInstance";

export default class GIFramebuffer extends Framebuffer {
    frameBufferObject
    frameBufferTexture

    constructor(size, gpu) {
        super(gpu, size*size, size)

        this.frameBufferObject = gpu.createFramebuffer()
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, this.frameBufferObject)

        this.redTexture = FramebufferTextureInstance.generate(gpu, size * size, size, gpu.COLOR_ATTACHMENT0, undefined, true)
        this.greenTexture = FramebufferTextureInstance.generate(gpu, size * size, size, gpu.COLOR_ATTACHMENT1, undefined, true)
        this.blueTexture = FramebufferTextureInstance.generate(gpu, size * size, size, gpu.COLOR_ATTACHMENT2, undefined, true)

        gpu.drawBuffers([
            gpu.COLOR_ATTACHMENT0,
            gpu.COLOR_ATTACHMENT1,
            gpu.COLOR_ATTACHMENT2
        ])

        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null);
    }

    startMapping() {
        super.startMapping(this.frameBufferObject)
    }

    stopMapping() {
        super.stopMapping(false);
    }

    draw(shader) {
        super.draw(shader, false);
    }

}