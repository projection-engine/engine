import {bindTexture} from "../../../utils/misc/utils";
import Quad from "../../../utils/workers/Quad";

export default class Framebuffer extends Quad{
    frameBufferObject
    frameBufferTexture
    renderBufferObject

    constructor(gpu, width, height) {
        super(gpu);
        this.gpu = gpu
        this.width = width
        this.height = height

    }



    startMapping(buffer=this.frameBufferObject, autoSetViewport=true) {
        if(autoSetViewport)
            this.gpu.viewport(0, 0, this.width, this.height);
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, buffer);
        this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT);
    }

    stopMapping(clear = true, unbind=true) {

        if(unbind)
            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null);

        if (clear) {
            this.gpu?.viewport(0, 0, this.gpu.drawingBufferWidth, this.gpu.drawingBufferHeight);
        }
    }

    onBeforeDraw() {}

    draw(shader, autoBind=true) {
        if(shader) {
            if (autoBind)
                bindTexture(0, this.frameBufferTexture, shader.textureULocation, this.gpu)

            this.onBeforeDraw(shader)
            super.draw()
            this.gpu.bindTexture(this.gpu.TEXTURE_2D, null);
        }
        else
            super.draw()
    }
}