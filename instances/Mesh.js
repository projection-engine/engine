import VertexBuffer from "./VertexBuffer"
import {v4 as uuidv4} from "uuid"
import GPU from "../GPU";
import GPUAPI from "../lib/rendering/GPUAPI";

export default class Mesh {
    verticesQuantity = 0
    trianglesQuantity = 0


    maxBoundingBox = []
    minBoundingBox = []
    VAO
    vertexVBO
    indexVBO
    normalVBO
    uvVBO
    tangentVBO

    constructor(attributes) {
        const {
            id = uuidv4(),
            vertices,
            indices,
            normals,
            uvs,
            tangents,
            maxBoundingBox,
            minBoundingBox
        } = attributes

        this.id = id
        this.maxBoundingBox = maxBoundingBox
        this.minBoundingBox = minBoundingBox
        const l = indices.length
        this.trianglesQuantity = l / 3
        this.verticesQuantity = l

        this.VAO = gpu.createVertexArray()
        gpu.bindVertexArray(this.VAO)

        this.indexVBO = GPUAPI.createBuffer(gpu.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices))
        this.vertexVBO = new VertexBuffer(0, new Float32Array(vertices), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)

        if (normals && normals.length > 0)
            this.normalVBO = new VertexBuffer(1, new Float32Array(normals), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
        if (uvs && uvs.length > 0)
            this.uvVBO = new VertexBuffer(2, new Float32Array(uvs), gpu.ARRAY_BUFFER, 2, gpu.FLOAT)
        // if (tangents && tangents.length > 0)
        //     this.tangentVBO = new VertexBuffer(3, new Float32Array(tangents), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)

        gpu.bindVertexArray(null)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, null)

    }

    static finishIfUsed() {
        const lastUsed = GPU.activeMesh
        if (lastUsed != null)
            lastUsed.finish()
    }

    use() {
        const last = GPU.activeMesh
        if (last === this)
            return
        else if (last != null)
            last.finish()

        gpu.bindVertexArray(this.VAO)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, this.indexVBO)

        this.vertexVBO.enable()
        if (this.normalVBO)
            this.normalVBO.enable()
        if (this.uvVBO)
            this.uvVBO.enable()
        // if (this.tangentVBO)
        //     this.tangentVBO.enable()
    }

    finish() {

        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, null)
        this.vertexVBO.disable()

        if (this.uvVBO)
            this.uvVBO.disable()
        if (this.normalVBO)
            this.normalVBO.disable()
        // if (this.tangentVBO)
        //     this.tangentVBO.disable()

        gpu.bindVertexArray(null)

        GPU.activeMesh = undefined
    }

    simplifiedDraw(){
        const last = GPU.activeMesh
        if (last === this)
            return
        else if (last != null)
            last.finish()

        gpu.bindVertexArray(this.VAO)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, this.indexVBO)
        this.vertexVBO.enable()
        gpu.drawElements(gpu.TRIANGLES, this.verticesQuantity, gpu.UNSIGNED_INT, 0)
    }

    draw() {
        this.use()
        gpu.drawElements(gpu.TRIANGLES, this.verticesQuantity, gpu.UNSIGNED_INT, 0)
    }

    drawLines() {
        this.use()
        gpu.drawElements(gpu.LINE_LOOP, this.verticesQuantity, gpu.UNSIGNED_INT, 0)
    }

    drawInstanced(quantity) {
        this.use()
        gpu.drawElementsInstanced(gpu.TRIANGLES, this.verticesQuantity, gpu.UNSIGNED_INT, 0, quantity)
    }
}
