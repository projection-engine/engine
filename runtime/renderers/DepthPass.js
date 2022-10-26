import COMPONENTS from "../../static/COMPONENTS.js"
import Engine from "../../Engine";
import CameraAPI from "../../api/CameraAPI";
import GPUResources from "../../GPUResources";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import GPUController from "../../GPUController";

const MESH = COMPONENTS.MESH
const T = COMPONENTS.TERRAIN

export default class DepthPass {
    static framebuffer
    static normalFBO
    static depthSampler
    static IDSampler
    static UVSampler
    static normalSampler

    static shader
    static normalShader

    static initialize() {
        DepthPass.framebuffer = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.DEPTH)
        DepthPass.framebuffer
            .texture({
                precision: gpu.R32F,
                format: gpu.RED,
                type: gpu.FLOAT,
                repeat: false,
                linear: false,
                attachment: 0
            }) // DEPTH
            .texture({attachment: 1}) // ID
            .texture({attachment: 2}) // UV
            .depthTest()
        DepthPass.depthSampler = DepthPass.framebuffer.colors[0]
        DepthPass.IDSampler = DepthPass.framebuffer.colors[1]
        DepthPass.UVSampler = DepthPass.framebuffer.colors[2]


        DepthPass.normalFBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.RECONSTRUCTED_NORMALS)
        DepthPass.normalFBO.texture()
        DepthPass.normalSampler = DepthPass.normalFBO.colors[0]


    }

    static execute() {
        const meshes = Engine.data.meshes
        const terrain = Engine.data.terrain
        const mSize = meshes.length
        const tSize = terrain.length
        const M = GPUResources.meshes
        const U = {
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix,
        }
        const S = DepthPass.shader
        // DEPTH && ID
        DepthPass.framebuffer.startMapping()
        for (let i = 0; i < tSize; i++) {
            const entity = terrain[i]
            if (!entity.active)
                continue

            const mesh = M.get(entity.components.get(T).terrainID)
            if (!mesh)
                continue
            U.transformMatrix = entity.matrix
            U.meshID = entity.pickID
            S.bindForUse(U)
            mesh.draw()
        }

        for (let i = 0; i < mSize; i++) {
            const entity = meshes[i]
            if (!entity.active)
                continue
            const mesh = M.get(entity.components.get(MESH).meshID)
            if (!mesh)
                continue

            U.transformMatrix = entity.matrix
            U.meshID = entity.pickID
            S.bindForUse(U)
            mesh.draw()
        }
        DepthPass.framebuffer.stopMapping()

        // NORMALS
        DepthPass.normalFBO.startMapping()
        DepthPass.normalShader.bindForUse({
            depthSampler: DepthPass.depthSampler,
            projectionInverse: CameraAPI.invProjectionMatrix,
            viewInverse: CameraAPI.invViewMatrix
        })
        GPUResources.quad.draw()
        DepthPass.normalFBO.stopMapping()
    }
}