import {createVAO} from "../../utils/misc/utils";
import VBO from "../../utils/workers/VBO";
import * as shaderCode from '../../shaders/resources/misc/billboard.glsl'
import Shader from "../../utils/workers/Shader";


export default class BillboardsInstance {
    constructor(gpu) {
        this.gpu = gpu
        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.vao = createVAO(gpu)
        this.vertexVBO = new VBO(gpu, 0, new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 0]), gpu.ARRAY_BUFFER, 3, gpu.FLOAT, false)

        this._prepareTransforms([])


        gpu.bindVertexArray(null);
    }

    _prepareTransforms(data) {
        this.transformVBO = this.gpu.createBuffer()
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.transformVBO)
        this.gpu.bufferData(this.gpu.ARRAY_BUFFER, data, this.gpu.STREAM_DRAW)

        this.gpu.enableVertexAttribArray(1);
        this.gpu.vertexAttribPointer(1, 4, this.gpu.FLOAT, false, 64, 0);

        this.gpu.enableVertexAttribArray(2);
        this.gpu.vertexAttribPointer(2, 4, this.gpu.FLOAT, false, 64, 16);

        this.gpu.enableVertexAttribArray(3)
        this.gpu.vertexAttribPointer(3, 4, this.gpu.FLOAT, false, 64, 32);

        this.gpu.enableVertexAttribArray(4);
        this.gpu.vertexAttribPointer(4, 4, this.gpu.FLOAT, false, 64, 48);

        this.gpu.vertexAttribDivisor(1, 1);
        this.gpu.vertexAttribDivisor(2, 1);
        this.gpu.vertexAttribDivisor(3, 1);
        this.gpu.vertexAttribDivisor(4, 1);
    }

    draw(transformations, texture, camera) {
        this.shader.use()
        this.gpu.bindVertexArray(this.vao)
        this.vertexVBO.enable()
        this._prepareTransforms(new Float32Array(transformations.flat()))

        this.shader.bindForUse({
            cameraPosition: camera.position,
            iconSampler: texture,
            viewMatrix: camera.viewMatrix,
            projectionMatrix: camera.projectionMatrix
        })

        this.gpu.depthRange(0, 0.01)
        this.gpu.drawArraysInstanced(this.gpu.TRIANGLES, 0, 6, transformations.length)
        this.gpu.depthRange(0, 1)
        this.gpu.bindVertexArray(null);

    }

}