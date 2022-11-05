import GPUAPI from "../api/GPUAPI";
import STATIC_MESHES from "../static/resources/STATIC_MESHES";
import SPHERE from "../static/meshes/SPHERE.json";
import CUBE from "../static/meshes/CUBE_SM.json";
import CYLINDER from "../static/meshes/CYLINDER_SM.json";
import PLANE from "../static/meshes/PLANE_SM.json";
import VertexBuffer from "../instances/VertexBuffer";
import cube from "../static/meshes/CUBE.json";
import QUAD from "../static/meshes/QUAD.json";
import GPU from "../GPU";

export default function initializeStaticMeshes(){
    GPU.cubeBuffer = new VertexBuffer(0, new Float32Array(cube), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
    GPU.quad = GPUAPI.allocateMesh(STATIC_MESHES.PRODUCTION.QUAD, QUAD)
    GPUAPI.allocateMesh(STATIC_MESHES.PRODUCTION.SPHERE, SPHERE)
    GPUAPI.allocateMesh(STATIC_MESHES.PRODUCTION.CUBE, CUBE)
    GPUAPI.allocateMesh(STATIC_MESHES.PRODUCTION.CYLINDER, CYLINDER)
    GPUAPI.allocateMesh(STATIC_MESHES.PRODUCTION.PLANE, PLANE)
}