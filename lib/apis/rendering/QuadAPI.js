// import VertexBuffer from "../../instances/VertexBuffer"
// import Mesh from "../../instances/Mesh";
// import QUAD from "../../../static/meshes/QUAD.json"
// import STATIC_MESHES from "../../../static/resources/STATIC_MESHES";
// const QUAD = [
//     -1, -1, 0,
//     1, -1, 0,
//     1, 1, 0,
//     1, 1, 0,
//     -1, 1, 0,
//     -1, -1, 0
// ]
// export default class QuadAPI {
//     static VAO
//     static VBO
//
//     static initialize() {
//         if (!QuadAPI.VAO) {
//             GPU.allocateMesh(STATIC_MESHES.PRODUCTION.QUAD, )
//             QuadAPI.VAO = gpu.createVertexArray()
//             gpu.bindVertexArray(QuadAPI.VAO)
//             QuadAPI.VBO = new VertexBuffer(
//                 0,
//                 new Float32Array(QUAD),
//                 gpu.ARRAY_BUFFER,
//                 3,
//                 gpu.FLOAT
//             )
//         }
//     }
//
//     static draw() {
//         Mesh.finishIfUsed()
//
//         gpu.disable(gpu.CULL_FACE)
//         gpu.bindVertexArray(QuadAPI.VAO)
//         QuadAPI.VBO.enable()
//         gpu.drawArrays(gpu.TRIANGLES, 0, 6)
//         gpu.enable(gpu.CULL_FACE)
//         gpu.bindVertexArray(null)
//     }
//
//     static use() {
//         Mesh.finishIfUsed()
//         gpu.disable(gpu.CULL_FACE)
//         gpu.bindVertexArray(QuadAPI.VAO)
//         QuadAPI.VBO.enable()
//     }
//
//     static drawQuad() {
//         gpu.drawArrays(gpu.TRIANGLES, 0, 6)
//     }
//
//
//     static drawInstanced(quantity) {
//         gpu.drawArraysInstanced(gpu.TRIANGLES, 0, 6, quantity)
//     }
//
//     static finish() {
//         QuadAPI.VBO.disable()
//         gpu.bindVertexArray(null)
//         gpu.enable(gpu.CULL_FACE)
//
//     }
// }