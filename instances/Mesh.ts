import VertexBuffer from "./VertexBuffer"
import {v4 as uuidv4} from "uuid"
import GPU from "../lib/GPU";
import GPUAPI from "../lib/rendering/GPUAPI";

interface MeshProps {

    id?: string,
    vertices?: number[] | Float32Array,
    indices?: number[] | Float32Array,
    normals?: number[] | Float32Array,
    uvs?: number[] | Float32Array,
    tangents?: number[] | Float32Array,
    maxBoundingBox?: number[],
    minBoundingBox?: number[]

}

export default class Mesh {
    readonly verticesQuantity:number
    readonly trianglesQuantity:number

    private readonly id: string
    readonly maxBoundingBox: number[]
    readonly minBoundingBox: number[]
    readonly VAO: WebGLVertexArrayObject
    readonly indexVBO?:WebGLBuffer

    readonly vertexVBO?:VertexBuffer
    readonly normalVBO?:VertexBuffer
    readonly uvVBO?:VertexBuffer
    readonly tangentVBO?:VertexBuffer

    constructor(attributes:MeshProps) {
        const {
            id = uuidv4(),
            vertices,
            indices,
            normals,
            uvs,
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
        this.vertexVBO = new VertexBuffer(0, new Float32Array(vertices), gpu.ARRAY_BUFFER, 3, gpu.FLOAT, false, undefined, 0)

        if (normals && normals.length > 0)
            this.normalVBO = new VertexBuffer(1, new Float32Array(normals), gpu.ARRAY_BUFFER, 3, gpu.FLOAT, false, undefined, 0)
        if (uvs && uvs.length > 0)
            this.uvVBO = new VertexBuffer(2, new Float32Array(uvs), gpu.ARRAY_BUFFER, 2, gpu.FLOAT, false, undefined, 0)
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

    prepareForUse() {
        const last = GPU.activeMesh
        if (last === this)
            return
        else if (last != null)
            last.finish()

        GPU.activeMesh = this
        this.prepareForUse()
        gpu.bindVertexArray(this.VAO)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, this.indexVBO)
        this.vertexVBO.enable()
    }

    use() {
        this.prepareForUse()
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

        gpu.bindVertexArray(null)
        GPU.activeMesh = undefined
    }

    simplifiedDraw() {
        this.prepareForUse()
        gpu.drawElements(gpu.TRIANGLES, this.verticesQuantity, gpu.UNSIGNED_INT, 0)
    }

    draw() {
        this.use()
        gpu.drawElements(gpu.TRIANGLES, this.verticesQuantity, gpu.UNSIGNED_INT, 0)
    }

    drawInstanced(quantity) {
        this.use()
        gpu.drawElementsInstanced(gpu.TRIANGLES, this.verticesQuantity, gpu.UNSIGNED_INT, 0, quantity)
    }

    drawLineLoop() {
        this.prepareForUse()
        gpu.drawElements(gpu.LINE_LOOP, this.verticesQuantity, gpu.UNSIGNED_INT, 0)
    }

    drawTriangleStrip() {
        this.prepareForUse()
        gpu.drawElements(gpu.TRIANGLE_STRIP, this.verticesQuantity, gpu.UNSIGNED_INT, 0)
    }

    drawTriangleFan() {
        this.prepareForUse()
        gpu.drawElements(gpu.TRIANGLE_FAN, this.verticesQuantity, gpu.UNSIGNED_INT, 0)
    }

    drawLines() {
        this.prepareForUse()
        gpu.drawElements(gpu.LINES, this.verticesQuantity, gpu.UNSIGNED_INT, 0)
    }

}
