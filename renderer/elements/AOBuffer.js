import {createFBO, createTexture} from "../../utils/utils";
import Framebuffer from "./Framebuffer";

export default class AOBuffer extends Framebuffer {
    frameBufferObject
    frameBufferTexture

    constructor(size, gpu) {
        super(gpu, size, size)

        this.frameBufferTexture = createTexture(
            this.gpu,
            size,
            size,
            this.gpu.RED,
            0,
            this.gpu.RGB,
            this.gpu.FLOAT,
            null,
            this.gpu.NEAREST,
            this.gpu.NEAREST
        )
        this.frameBufferObject = createFBO(
            this.gpu,
            this.gpu.COLOR_ATTACHMENT0,
            this.frameBufferTexture
        )
    }

    startMapping() {
        super.startMapping(this.frameBufferObject, false);
    }

    stopMapping() {
        super.stopMapping(false, true)
    }
}