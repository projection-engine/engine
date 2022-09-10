import FramebufferInstance from "../instances/FramebufferInstance";
import GPU from "../GPU";
import STATIC_MESHES from "../../static/STATIC_MESHES";
import STATIC_FRAMEBUFFERS from "../../static/STATIC_FRAMEBUFFERS";
import InstancedRenderGroup from "../instances/InstancedRenderGroup";
import MeshInstance from "../instances/MeshInstance";
import ShaderInstance from "../instances/ShaderInstance";
import STATIC_SHADERS from "../../static/STATIC_SHADERS";

export default class InstanceController {
    static allocateFramebuffer(id, width = GPU.internalResolution.w, height = GPU.internalResolution.h) {
        const fbo = new FramebufferInstance(width, height)
        GPU.frameBuffers.set(id, fbo)
        return fbo
    }

    static destroyFramebuffer(id) {
        if (Object.values(STATIC_FRAMEBUFFERS).find(m => m === id))
            return
        const fbo = GPU.frameBuffers.get(id)
        if (!fbo)
            return
        for (let i = 0; i < fbo.colors.length; i++) {
            gpu.deleteTexture(fbo.colors[i])
        }
        if (fbo.depthSampler instanceof WebGLTexture)
            gpu.deleteTexture(fbo.depthSampler)
        if (fbo.RBO)
            gpu.deleteRenderbuffer(fbo.RBO)
        gpu.deleteFramebuffer(fbo.FBO)
        GPU.frameBuffers.delete(id)
    }

    static reallocateFramebuffer(id, width, height) {
        InstanceController.destroyFramebuffer(id)
        return InstanceController.allocateFramebuffer(id, width, height)
    }

    static allocateInstancedGroup(id) {
        const instance = new InstancedRenderGroup(id)
        GPU.instancingGroup.set(id, instance)
        return instance
    }

    static linkEntityToGroup(id) {
        // TODO
    }

    static unlinkEntityToGroup() {
        // TODO
    }

    static allocateMesh(id, bufferData) {
        if (!bufferData || !id)
            return
        const instance = new MeshInstance(bufferData)
        instance.id = id
        GPU.meshes.set(id, instance)
        return instance
    }

    static destroyMesh(instance) {
        if ([...Object.values(STATIC_MESHES.PRODUCTION), ...Object.values(STATIC_MESHES.EDITOR)].find(m => m === instance.id))
            return
        const mesh = typeof instance === "string" ? GPU.meshes.get(instance) : instance
        if (mesh instanceof MeshInstance) {
            gpu.deleteVertexArray(mesh.VAO)
            gpu.deleteBuffer(mesh.indexVBO)

            if (mesh.uvVBO)
                mesh.uvVBO.delete()
            if (mesh.normalVBO)
                mesh.normalVBO.delete()
            if (mesh.tangentVBO)
                mesh.tangentVBO.delete()
            GPU.meshes.delete(mesh.id)
        }

    }

    static allocateShader(id, vertex, fragment, cb) {
        const instance = new ShaderInstance(vertex, fragment, cb)
        GPU.shaders.set(id, instance)
        return instance
    }

    static destroyShader(id) {
        if (Object.values(STATIC_SHADERS.PRODUCTION).find(m => m === id) || Object.values(STATIC_SHADERS.DEVELOPMENT).find(m => m === id))
            return
        const instance = GPU.shaders.get(id)
        if (!instance)
            return
        gpu.deleteProgram(instance.program)
        GPU.shaders.delete(id)
    }

}