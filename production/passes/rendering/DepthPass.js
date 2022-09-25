import COMPONENTS from "../../../static/COMPONENTS.json"
import * as shaderCode from "../../shaders/DEFERRED.glsl"
import Engine from "../../Engine";
import CameraAPI from "../../apis/CameraAPI";
import GPU from "../../GPU";
import STATIC_FRAMEBUFFERS from "../../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import DEPTH_PASSGlsl from "../../shaders/DEPTH_PASS.glsl";

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
        DepthPass.framebuffer = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.DEPTH)
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


        DepthPass.normalFBO = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.RECONSTRUCTED_NORMALS)
        DepthPass.normalFBO.texture()
        DepthPass.normalSampler = DepthPass.normalFBO.colors[0]

        DepthPass.shader =  GPU.allocateShader(STATIC_SHADERS.PRODUCTION.DEPTH, DEPTH_PASSGlsl.depthVertex, DEPTH_PASSGlsl.depthFragment)
        DepthPass.normalShader =  GPU.allocateShader(STATIC_SHADERS.PRODUCTION.NORMAL_RECONSTRUCTION, shaderCode.vertex, DEPTH_PASSGlsl.normalReconstructionFragment)
    }

    static execute() {
        const meshes = Engine.data.meshes
        // DEPTH && ID
        DepthPass.framebuffer.startMapping()
        for (let i = 0; i < meshes.length; i++) {
            const entity = meshes[i]
            if (!entity.active)
                continue
            const mesh = GPU.meshes.get(entity.components.get(COMPONENTS.MESH).meshID)
            if (!mesh)
                continue

            DepthPass.shader.bindForUse({
                viewMatrix: CameraAPI.viewMatrix,
                transformMatrix: entity.matrix,
                projectionMatrix: CameraAPI.projectionMatrix,
                meshID: entity.pickID
            })
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
        GPU.quad.draw()
        DepthPass.normalFBO.stopMapping()
    }
}