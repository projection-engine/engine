import {createRBO} from "../../../utils/misc/utils";
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
        this.renderBufferObject = createRBO(
            gpu,
            this.width,
            this.height,
            gpu.DEPTH_COMPONENT24,
            gpu.DEPTH_ATTACHMENT
        )

        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null);
    }


}