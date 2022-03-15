import {createVAO, createVBO} from "../utils/misc/utils";
import VBO from "../utils/workers/VBO";
import randomID from "../../utils/misc/randomID";


export default class MeshInstance {
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
                    id = randomID(),
                    gpu,

                    vertices,
                    indices,
                    normals,
                    uvs,
                    tangents,

                    maxBoundingBox,
                    minBoundingBox,
                    wireframeBuffer,
                    material
                }) {


        this.id = id
        this.gpu = gpu
        this.material = material
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

        gpu.bindVertexArray(null)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, null)

    }


}