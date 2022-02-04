export default class Quad{
    constructor(gpu) {
        this.gpu = gpu
        this.vertexBuffer = this.gpu.createBuffer()
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.vertexBuffer)
        this.gpu.bufferData(
            this.gpu.ARRAY_BUFFER,
            new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 0]),
            this.gpu.STATIC_DRAW
        )
    }

    onBeforeDraw(shader) {}

    draw(shader, positionLocation) {
        this.gpu.enableVertexAttribArray(positionLocation)
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.vertexBuffer)
        this.gpu.vertexAttribPointer(positionLocation, 3, this.gpu.FLOAT, false, 0, 0)

        this.onBeforeDraw(shader)
        this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 6);
        this.gpu.bindTexture(this.gpu.TEXTURE_2D, null);
    }

}