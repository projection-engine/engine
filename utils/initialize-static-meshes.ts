import GPUAPI from "../lib/rendering/GPUAPI";
import STATIC_MESHES from "../static/resources/STATIC_MESHES";
import VertexBuffer from "../instances/VertexBuffer";
import GPU from "../lib/GPU";

export default async function initializeStaticMeshes() {

    try {
        const res = await fetch("./STATIC_MESHES.json")
        const {QUAD, SPHERE, CUBE, CYLINDER, PLANE, CUBE_LINEAR} = await res.json()
        console.trace({QUAD, SPHERE, CUBE, CYLINDER, PLANE, CUBE_LINEAR})
        GPU.cubeBuffer = new VertexBuffer(0, new Float32Array(CUBE_LINEAR), gpu.ARRAY_BUFFER, 3, gpu.FLOAT, false, undefined, 0)
        GPU.quad = GPUAPI.allocateMesh(STATIC_MESHES.PRODUCTION.QUAD, QUAD)
        const q = GPU.quad
        drawQuad = () => {
            const last = GPU.activeMesh
            if (last && last !== q)
                last.finish()
            q.prepareForUse()
            gpu.drawElements(gpu.TRIANGLES, q.verticesQuantity, gpu.UNSIGNED_INT, 0)
            GPU.activeMesh = q
        }
        GPUAPI.allocateMesh(STATIC_MESHES.PRODUCTION.SPHERE, SPHERE)
        GPUAPI.allocateMesh(STATIC_MESHES.PRODUCTION.CUBE, CUBE)
        GPUAPI.allocateMesh(STATIC_MESHES.PRODUCTION.CYLINDER, CYLINDER)
        GPUAPI.allocateMesh(STATIC_MESHES.PRODUCTION.PLANE, PLANE)
    } catch (err) {
        console.error(err)
    }
}