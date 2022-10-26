import GPUController from "../GPUController";
import STATIC_MESHES from "../static/resources/STATIC_MESHES";
import SPHERE from "../static/meshes/SPHERE.json";
import CUBE from "../static/meshes/CUBE_SM.json";
import CYLINDER from "../static/meshes/CYLINDER_SM.json";
import PLANE from "../static/meshes/PLANE_SM.json";
import VertexBuffer from "../instances/VertexBuffer";
import cube from "../static/meshes/CUBE.json";
import QUAD from "../static/meshes/QUAD.json";
import GPUResources from "../GPUResources";

export default function initializeStaticMeshes(){
    GPUResources.cubeBuffer = new VertexBuffer(0, new Float32Array(cube), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
    GPUResources.quad = GPUController.allocateMesh(STATIC_MESHES.PRODUCTION.QUAD, QUAD)
    GPUController.allocateMesh(STATIC_MESHES.PRODUCTION.SPHERE, SPHERE)
    GPUController.allocateMesh(STATIC_MESHES.PRODUCTION.CUBE, CUBE)
    GPUController.allocateMesh(STATIC_MESHES.PRODUCTION.CYLINDER, CYLINDER)
    GPUController.allocateMesh(STATIC_MESHES.PRODUCTION.PLANE, PLANE)
}