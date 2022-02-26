import {createFBO, createTexture} from "../../utils/misc/utils";
import Framebuffer from "./Framebuffer";

export default class AOBlurBuffer extends Framebuffer {
    frameBufferObject
    frameBufferTexture

    constructor(gpu) {
        super(gpu, window.screen.width , window.screen.height )

        this.frameBufferTexture = createTexture(
            this.gpu,
            this.width,
            this.height,
            this.gpu.RGBA8,
            0,
            this.gpu.RGBA,
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