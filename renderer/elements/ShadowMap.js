import {createFBO, createTexture} from "../../utils/utils";
import Framebuffer from "./Framebuffer";

export default class ShadowMap extends Framebuffer {
    frameBufferObject
    frameBufferTexture

    constructor(size, gpu) {
        super(gpu, size, size)
        this.frameBufferTexture = createTexture(
            this.gpu,
            size,
            size,
            this.gpu.DEPTH_COMPONENT32F,
            0,
            this.gpu.DEPTH_COMPONENT,
            this.gpu.FLOAT,
            null,
            this.gpu.NEAREST,
            this.gpu.NEAREST,
            this.gpu.CLAMP_TO_EDGE,
            this.gpu.CLAMP_TO_EDGE
        )
        this.frameBufferObject = createFBO(
            this.gpu,
            this.gpu.DEPTH_ATTACHMENT,
            this.frameBufferTexture
        )
    }
    startMapping(){
        super.startMapping();
        this.gpu.cullFace(this.gpu.FRONT)
    }
    stopMapping() {
        super.stopMapping();
        this.gpu.cullFace(this.gpu.BACK)
    }
}