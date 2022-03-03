import {createTexture} from "../../../utils/misc/utils";
import Framebuffer from "../mics/Framebuffer";
import FramebufferTextureInstance from "../../instances/FramebufferTextureInstance";

export default class RSMFramebuffer extends Framebuffer {
    frameBufferObject
    frameBufferTexture

    constructor(size, gpu) {
        super(gpu, size, size)

        this.frameBufferObject = gpu.createFramebuffer()
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, this.frameBufferObject)
        this.rsmNormalTexture = FramebufferTextureInstance.generate(gpu, this.width, this.height, gpu.COLOR_ATTACHMENT0)
        this.rsmFluxTexture = FramebufferTextureInstance.generate(gpu, this.width, this.height, gpu.COLOR_ATTACHMENT1)
        this.rsmWorldPositionTexture = FramebufferTextureInstance.generate(gpu, this.width, this.height, gpu.COLOR_ATTACHMENT2)
        gpu.drawBuffers([
            gpu.COLOR_ATTACHMENT0,
            gpu.COLOR_ATTACHMENT1,
            gpu.COLOR_ATTACHMENT2
        ])

        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null);
    }


}