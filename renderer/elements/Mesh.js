import {createVAO, createVBO} from "../../utils/utils";
import VBO from "../VBO";
import randomID from "../../../../pages/project/utils/misc/randomID";


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

    constructor({
                    vertices,
                    indices,
                    normals,
                    uvs,
                    tangents = [],
                    id = randomID(),
                    gpu,
                    maxBoundingBox,
                    minBoundingBox,
                    wireframeBuffer
                }) {

        this.id = id
        this.gpu = gpu

        this.maxBoundingBox = maxBoundingBox
        this.minBoundingBox = minBoundingBox

        this.trianglesQuantity = indices.length / 3
        this.verticesQuantity = indices.length

        this.VAO = createVAO(gpu)

        this.indexVBO = createVBO(gpu, gpu.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices))

        this.vertexVBO = new VBO(gpu, 1, new Float32Array(vertices), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
        this.normalVBO = new VBO(gpu, 2, new Float32Array(normals), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
        this.uvVBO = new VBO(gpu, 3, new Float32Array(uvs), gpu.ARRAY_BUFFER, 2, gpu.FLOAT)
        this.tangentVBO = new VBO(gpu, 4, new Float32Array(tangents), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)

        // if (wireframeBuffer) {
        //     let wireframe = []
        //     for (let i = 0; i < indices.length; i++) {
        //         const vertex = [
        //             vertices[indices[i]],
        //             vertices[indices[i] + 1],
        //             vertices[indices[i] + 2],
        //         ]
        //
        //         wireframe.push(
        //             ...vertex
        //         )
        //     }
        //
        //
        //     this.wireframeVBO = new VBO(gpu, 5, new Float32Array(wireframe), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
        // }
    }


}
