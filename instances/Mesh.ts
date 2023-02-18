import VertexBuffer from "./VertexBuffer"

import GPU from "../GPU";
import GPUAPI from "../lib/rendering/GPUAPI";
import Loop from "../Loop";

export interface MeshProps {
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
    readonly id: string
    readonly maxBoundingBox: number[]
    readonly minBoundingBox: number[]
    readonly VAO: WebGLVertexArrayObject
    readonly indexVBO?:WebGLBuffer
    readonly vertexVBO?:VertexBuffer
    readonly normalVBO?:VertexBuffer
    readonly uvVBO?:VertexBuffer
    #lastUsedElapsed = 0
    get lastUsedElapsed(){
        return this.#lastUsedElapsed
    }

    constructor(attributes:MeshProps) {
        const {
            id = crypto.randomUUID(),
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

        this.VAO = GPU.context.createVertexArray()
        GPU.context.bindVertexArray(this.VAO)

        this.indexVBO = GPUAPI.createBuffer(GPU.context.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices))
        this.vertexVBO = new VertexBuffer(0, new Float32Array(vertices), GPU.context.ARRAY_BUFFER, 3, GPU.context.FLOAT, false, undefined, 0)

        if (uvs && uvs.length > 0)
            this.uvVBO = new VertexBuffer(1, new Float32Array(uvs), GPU.context.ARRAY_BUFFER, 2, GPU.context.FLOAT, false, undefined, 0)

        if (normals && normals.length > 0)
            this.normalVBO = new VertexBuffer(2, new Float32Array(normals), GPU.context.ARRAY_BUFFER, 3, GPU.context.FLOAT, false, undefined, 0)

        GPU.context.bindVertexArray(null)
        GPU.context.bindBuffer(GPU.context.ELEMENT_ARRAY_BUFFER, null)

    }

    static finishIfUsed() {
        const lastUsed = GPU.activeMesh
        if (lastUsed != null)
            lastUsed.finish()
    }

    bindEssentialResources() {
        const last = GPU.activeMesh
        if (last === this)
            return
        // else if (last != null)
        //     last.finish()

        GPU.activeMesh = this
        GPU.context.bindVertexArray(this.VAO)
        GPU.context.bindBuffer(GPU.context.ELEMENT_ARRAY_BUFFER, this.indexVBO)
        this.vertexVBO.enable()

    }

    bindAllResources() {
        const last = GPU.activeMesh
        if (last === this)
            return
        // else if (last != null)
        //     last.finish()
        GPU.activeMesh = this
        GPU.context.bindVertexArray(this.VAO)
        GPU.context.bindBuffer(GPU.context.ELEMENT_ARRAY_BUFFER, this.indexVBO)
        this.vertexVBO.enable()
        if (this.normalVBO)
            this.normalVBO.enable()
        if (this.uvVBO)
            this.uvVBO.enable()


    }

    finish() {
        GPU.context.bindBuffer(GPU.context.ELEMENT_ARRAY_BUFFER, null)
        this.vertexVBO.disable()

        if (this.uvVBO)
            this.uvVBO.disable()
        if (this.normalVBO)
            this.normalVBO.disable()

        GPU.context.bindVertexArray(null)
        GPU.activeMesh = undefined
    }

    simplifiedDraw() {

        this.bindEssentialResources()
        GPU.context.drawElements(GPU.context.TRIANGLES, this.verticesQuantity, GPU.context.UNSIGNED_INT, 0)
        this.#lastUsedElapsed = Loop.elapsed
    }

    draw() {
        this.bindAllResources()
        GPU.context.drawElements(GPU.context.TRIANGLES, this.verticesQuantity, GPU.context.UNSIGNED_INT, 0)
        this.#lastUsedElapsed = Loop.elapsed
    }

    drawInstanced(quantity) {
        this.bindAllResources()
        GPU.context.drawElementsInstanced(GPU.context.TRIANGLES, this.verticesQuantity, GPU.context.UNSIGNED_INT, 0, quantity)
        this.#lastUsedElapsed = Loop.elapsed
    }

    drawLineLoop() {
        this.bindEssentialResources()
        GPU.context.drawElements(GPU.context.LINE_LOOP, this.verticesQuantity, GPU.context.UNSIGNED_INT, 0)
        this.#lastUsedElapsed = Loop.elapsed
    }

    drawTriangleStrip() {
        this.bindEssentialResources()
        GPU.context.drawElements(GPU.context.TRIANGLE_STRIP, this.verticesQuantity, GPU.context.UNSIGNED_INT, 0)
        this.#lastUsedElapsed = Loop.elapsed
    }

    drawTriangleFan() {
        this.bindEssentialResources()
        GPU.context.drawElements(GPU.context.TRIANGLE_FAN, this.verticesQuantity, GPU.context.UNSIGNED_INT, 0)
        this.#lastUsedElapsed = Loop.elapsed
    }

    drawLines() {
        this.bindEssentialResources()
        GPU.context.drawElements(GPU.context.LINES, this.verticesQuantity, GPU.context.UNSIGNED_INT, 0)
        this.#lastUsedElapsed = Loop.elapsed
    }

}
//