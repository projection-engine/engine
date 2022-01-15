import cube from "../../samples/skyBoxCube";
import loadCubeMap from "../../utils/loadCubeMap";
import {createVBO} from '../../utils/utils'
import DirectionalLight from "./DirectionalLight";

export default class Skybox {
    lightSource
    ready = false

    constructor(images = [], gpu) {
        this.gpu = gpu
        this.vertexBuffer = createVBO(this.gpu, this.gpu.ARRAY_BUFFER, new Float32Array(cube))
        this.lightSource = new DirectionalLight(this.gpu, undefined, undefined, undefined, [0, 100, 200], -1, 1000)
        const cubeTexture = loadCubeMap(images, this.gpu)
        if (cubeTexture !== null) {
            this.ready = true
            this.texture = cubeTexture
        }
    }


    draw(shader, projectionMatrix, staticViewMatrix) {
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.vertexBuffer)
        this.gpu.enableVertexAttribArray(shader.positionLocation)
        this.gpu.vertexAttribPointer(shader.positionLocation, 3, this.gpu.FLOAT, false, 0, 0)
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.vertexBuffer)

        this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, this.texture)
        this.gpu.uniform1i(shader.textureULocation, 0)

        this.gpu.uniformMatrix4fv(shader.viewMatrixULocation, false, staticViewMatrix)
        this.gpu.uniformMatrix4fv(shader.projectionMatrixULocation, false, projectionMatrix)

        this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, null)
    }
}