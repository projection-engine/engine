import {bindTexture} from "../../../utils/utils";

export default class Framebuffer {
    frameBufferObject
    frameBufferTexture
    renderBufferObject

    constructor(gpu, width, height) {
        this.gpu = gpu
        this.width = width
        this.height = height
        this._initializeMesh()
    }

    _initializeMesh() {
        this.vertexBuffer = this.gpu.createBuffer()
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.vertexBuffer)
        this.gpu.bufferData(
            this.gpu.ARRAY_BUFFER,
            new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 0]),
            this.gpu.STATIC_DRAW
        )
    }

    startMapping(buffer=this.frameBufferObject) {
        this.gpu.viewport(0, 0, this.width, this.height);
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, buffer);
        this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT);
    }

    stopMapping(clear = true) {

        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null);
        if (clear) {
            this.gpu?.viewport(0, 0, this.gpu?.canvas.width, this.gpu?.canvas.height);
            this.gpu?.clear(this.gpu?.DEPTH_BUFFER_BIT)
        }
    }

    onBeforeDraw() {}

    draw(shader, autoBind=true) {
        this.gpu.enableVertexAttribArray(shader.positionLocation)
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.vertexBuffer)
        this.gpu.vertexAttribPointer(shader.positionLocation, 3, this.gpu.FLOAT, false, 0, 0)


        if(autoBind)
            bindTexture(0, this.frameBufferTexture, shader.textureULocation, this.gpu)

        this.onBeforeDraw(shader)
        this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 6);

        this.gpu.bindTexture(this.gpu.TEXTURE_2D, null);

    }
}