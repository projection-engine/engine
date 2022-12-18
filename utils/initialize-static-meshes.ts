import GPUAPI from "../lib/rendering/GPUAPI";
import STATIC_MESHES from "../static/resources/STATIC_MESHES";
import VertexBuffer from "../instances/VertexBuffer";
import GPU from "../GPU";

export default async function initializeStaticMeshes() {

    try {
        const res = await fetch("./STATIC_MESHES.json")
        const {QUAD, SPHERE, CUBE, CYLINDER, PLANE, CUBE_LINEAR} = await res.json()

        GPU.cubeBuffer = new VertexBuffer(0, new Float32Array(CUBE_LINEAR), GPU.context.ARRAY_BUFFER, 3, GPU.context.FLOAT, false, undefined, 0)
        GPU.quad = GPUAPI.allocateMesh(STATIC_MESHES.PRODUCTION.QUAD, QUAD)
        const q = GPU.quad
        GPU.drawQuad = () => {
            const last = GPU.activeMesh
            if (last && last !== q)
                last.finish()
            q.prepareForUse()
            GPU.context.drawElements(GPU.context.TRIANGLES, q.verticesQuantity, GPU.context.UNSIGNED_INT, 0)
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