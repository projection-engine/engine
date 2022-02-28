import {createTexture} from "../../utils/misc/utils";
import Framebuffer from "./Framebuffer";
import FramebufferTextureInstance from "../instances/FramebufferTextureInstance";

export default class ShadowMapFramebuffer extends Framebuffer {
    frameBufferObject
    frameBufferTexture

    constructor(size, gpu) {
        super(gpu, size, size)


        // this.frameBufferTexture = FramebufferTextureInstance.generate(gpu, this.width, this.height, gpu.DEPTH_ATTACHMENT, gpu.RGBA32F)


        this.frameBufferObject = gpu.createFramebuffer()
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, this.frameBufferObject)
        this.frameBufferTexture = createTexture(
            this.gpu,
            this.width,
            this.height,
            this.gpu.DEPTH_COMPONENT32F,
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
        this.rsmNormalTexture = FramebufferTextureInstance.generate(gpu, this.width, this.height, gpu.COLOR_ATTACHMENT0)
        this.rsmFluxTexture = FramebufferTextureInstance.generate(gpu, this.width, this.height, gpu.COLOR_ATTACHMENT1)
        this.rsmWorldPositionTexture = FramebufferTextureInstance.generate(gpu, this.width, this.height, gpu.COLOR_ATTACHMENT2)

        gpu.drawBuffers([
            gpu.COLOR_ATTACHMENT0,
            gpu.COLOR_ATTACHMENT1,
            gpu.COLOR_ATTACHMENT2
        ])

        gpu.framebufferTexture2D(
            gpu.FRAMEBUFFER,
            gpu.DEPTH_ATTACHMENT,
            gpu.TEXTURE_2D,
            this.frameBufferTexture,
            0);

        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null);
    }
    startMapping(face, res){
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.frameBufferObject);
        this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT);
    }


    stopMapping() {
        super.stopMapping();
        this.gpu.cullFace(this.gpu.BACK)
    }
}