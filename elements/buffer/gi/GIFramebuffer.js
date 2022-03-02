import Framebuffer from "../mics/Framebuffer";
import FramebufferTextureInstance from "../../instances/FramebufferTextureInstance";

export default class GIFramebuffer extends Framebuffer {
    frameBufferObject
    frameBufferTexture

    constructor(size, gpu) {
        super(gpu, size*size, size)

        this.frameBufferObject = gpu.createFramebuffer()
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, this.frameBufferObject)

        this.redTexture =FramebufferTextureInstance.generate(gpu, size ** 2, size, gpu.COLOR_ATTACHMENT0, undefined, true)
        this.greenTexture =FramebufferTextureInstance.generate(gpu, size ** 2, size, gpu.COLOR_ATTACHMENT1, undefined, true)
        this.blueTexture = FramebufferTextureInstance.generate(gpu, size ** 2, size, gpu.COLOR_ATTACHMENT2, undefined, true)

        this.gpu.framebufferTexture2D(
            this.gpu.FRAMEBUFFER,
            this.gpu.COLOR_ATTACHMENT0,
            this.gpu.TEXTURE_2D,
            this.redTexture ,
            0);

        this.gpu.framebufferTexture2D(
            this.gpu.FRAMEBUFFER,
            this.gpu.COLOR_ATTACHMENT1,
            this.gpu.TEXTURE_2D,
            this.greenTexture ,
            0);
        this.gpu.framebufferTexture2D(
            this.gpu.FRAMEBUFFER,
            this.gpu.COLOR_ATTACHMENT2,
            this.gpu.TEXTURE_2D,
            this.blueTexture ,
            0);

        this.gpu.drawBuffers([
            this.gpu.COLOR_ATTACHMENT0,
            this.gpu.COLOR_ATTACHMENT1,
            this.gpu.COLOR_ATTACHMENT2
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

function generate(gpu,size){
    const texture = gpu.createTexture();
    gpu.bindTexture(gpu.TEXTURE_2D, texture);

    gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.LINEAR);
    gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.LINEAR);
    gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.REPEAT);
    gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.REPEAT);
    gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RGBA16F, size * size, size);

    console.log(texture)
    return texture
}