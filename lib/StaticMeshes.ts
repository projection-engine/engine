import GPU from "../GPU";
import VertexBuffer from "../instances/VertexBuffer";

import Mesh from "../instances/Mesh";
import GPUAPI from "./rendering/GPUAPI";
import STATIC_MESHES from "../static/STATIC_MESHES";

export default class StaticMeshes {
    static #initialized = false
    
    static quad?:Mesh
    static sphere?:Mesh
    static cube?:Mesh
    static cylinder?:Mesh
    static plane?:Mesh
    static cubeBuffer?:VertexBuffer

    static async initialize() {
        if(StaticMeshes.#initialized)
            return
        StaticMeshes.#initialized = true
        try {
            const res = await fetch("./STATIC_MESHES.json")
            const {QUAD, SPHERE, CUBE, CYLINDER, PLANE, CUBE_LINEAR} = await res.json()
            StaticMeshes.sphere = GPUAPI.allocateMesh(STATIC_MESHES.SPHERE, SPHERE)
            StaticMeshes.cube = GPUAPI.allocateMesh(STATIC_MESHES.CUBE, CUBE)
            StaticMeshes.cylinder = GPUAPI.allocateMesh(STATIC_MESHES.CYLINDER, CYLINDER)
            StaticMeshes.plane = GPUAPI.allocateMesh(STATIC_MESHES.PLANE, PLANE)
            StaticMeshes.quad = new Mesh({...QUAD, id: "QUAD"})
            StaticMeshes.cubeBuffer = new VertexBuffer(0, new Float32Array(CUBE_LINEAR), GPU.context.ARRAY_BUFFER, 3, GPU.context.FLOAT, false, undefined, 0)
        } catch (err) {
            console.error(err)
        }
    }
    static drawQuad(){
        const q = StaticMeshes.quad
        const last = GPU.activeMesh
        if (last && last !== q)
            last.finish()
        q.prepareForUse()
        GPU.context.drawElements(GPU.context.TRIANGLES, q.verticesQuantity, GPU.context.UNSIGNED_INT, 0)
        GPU.activeMesh = q
    }
}