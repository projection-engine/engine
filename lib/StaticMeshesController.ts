import GPU from "../GPU";
import VertexBuffer from "../instances/VertexBuffer";

import Mesh from "../instances/Mesh";

export default class StaticMeshesController {
    static #initialized = false
    
    static quad?:Mesh
    static sphere?:Mesh
    static cube?:Mesh
    static cylinder?:Mesh
    static plane?:Mesh
    static cubeBuffer?:VertexBuffer

    static async initialize() {
        if(StaticMeshesController.#initialized)
            return
        StaticMeshesController.#initialized = true
        try {
            const res = await fetch("./STATIC_MESHES.json")
            const {QUAD, SPHERE, CUBE, CYLINDER, PLANE, CUBE_LINEAR} = await res.json()
            StaticMeshesController.sphere = new Mesh({...SPHERE, id: "SPHERE"})
            StaticMeshesController.cube = new Mesh({...CUBE, id: "CUBE"})
            StaticMeshesController.cylinder = new Mesh({...CYLINDER, id: "CYLINDER"})
            StaticMeshesController.plane = new Mesh({...PLANE, id: "PLANE"})
            StaticMeshesController.quad = new Mesh({...QUAD, id: "QUAD"})
            StaticMeshesController.cubeBuffer = new VertexBuffer(0, new Float32Array(CUBE_LINEAR), GPU.context.ARRAY_BUFFER, 3, GPU.context.FLOAT, false, undefined, 0)
        } catch (err) {
            console.error(err)
        }
    }
    static drawQuad(){
        const q = StaticMeshesController.quad
        const last = GPU.activeMesh
        if (last && last !== q)
            last.finish()
        q.prepareForUse()
        GPU.context.drawElements(GPU.context.TRIANGLES, q.verticesQuantity, GPU.context.UNSIGNED_INT, 0)
        GPU.activeMesh = q
    }
}