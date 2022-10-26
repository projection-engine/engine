import Texture from "./instances/Texture";
import Material from "./instances/Material";
import FALLBACK_MATERIAL from "./static/FALLBACK_MATERIAL";
import TERRAIN_MATERIAL from "./static/TERRAIN_MATERIAL";
import MaterialInstance from "./instances/MaterialInstance";
import STATIC_TEXTURES from "./static/resources/STATIC_TEXTURES";
import Framebuffer from "./instances/Framebuffer";
import STATIC_FRAMEBUFFERS from "./static/resources/STATIC_FRAMEBUFFERS";
import Mesh from "./instances/Mesh";
import STATIC_MESHES from "./static/resources/STATIC_MESHES";
import Shader from "./instances/Shader";
import STATIC_SHADERS from "./static/resources/STATIC_SHADERS";
import GPUResources from "./GPUResources";

export default class GPUController{
    static async allocateTexture(imageData, id) {
        if (GPUResources.textures.get(id) != null)
            return GPUResources.textures.get(id)
        const texture = new Texture()
        GPUResources.textures.set(id, texture)
        await texture.initialize(typeof imageData === "object" ? imageData : {img: imageData})
        GPUResources.materials.forEach(material => {

            if (material.updateTexture[id] != null)
                material.updateTexture[id](texture.texture)
        })
        return texture
    }

    static destroyTexture(imageID) {
        const found = GPUResources.textures.get(imageID)
        if (!found)
            return
        if (found.texture instanceof WebGLTexture)
            gpu.deleteTexture(found.texture)
        GPUResources.textures.delete(imageID)
    }

    static allocateMaterial(data, id) {
        const material = new Material(data)
        material.id = id
        GPUResources.materials.set(id, material)
        return material
    }

    static destroyMaterial(id) {
        const material = GPUResources.materials.get(id)
        if (!material || id === FALLBACK_MATERIAL || id.includes(TERRAIN_MATERIAL))
            return
        if(material instanceof Material) {
            GPUController.destroyShader(id)
            GPUController.destroyShader(id + "-CUBE-MAP")
        }

        GPUResources.materials.delete(id)
    }
    static createBuffer(type, data, renderingType = gpu.STATIC_DRAW) {
        if (!data && data.buffer instanceof ArrayBuffer && data.byteLength !== undefined || data.length === 0)
            return null

        const buffer = gpu.createBuffer()
        gpu.bindBuffer(type, buffer)
        gpu.bufferData(type, data, renderingType)

        return buffer
    }
    static async allocateMaterialInstance(data, id) {
        const original = GPUResources.materials.get(data.original)

        if (!original || GPUResources.materials.get(id))
            return GPUResources.materials.get(id)

        const instance = await (new Promise(resolve => {
            new MaterialInstance(id, data.uniformData, original, resolve)
        }))
        GPUResources.materials.set(id, instance)
        original.instances.set(id, instance)

        return instance
    }

    static cleanUpTextures() {
        const mat = Array.from(GPUResources.materials.values())
        const textures = Array.from(GPUResources.textures.keys())
        const inUse = {}
        for (let i = 0; i < mat.length; i++) {
            textures.forEach(t => {
                if (!mat[i]?.texturesInUse)
                    return
                if (mat[i].texturesInUse[t] != null)
                    inUse[t] = true
            })
        }
        textures.forEach(t => {
            if (!inUse[t] && Object.values(STATIC_TEXTURES).find(v => v === t) == null)
                GPUController.destroyTexture(t)
        })
    }

    static copyTexture(target, source, type = gpu.DEPTH_BUFFER_BIT) {
        gpu.bindFramebuffer(gpu.READ_FRAMEBUFFER, source.FBO)
        gpu.bindFramebuffer(gpu.DRAW_FRAMEBUFFER, target.FBO)
        gpu.blitFramebuffer(
            0, 0,
            source.width, source.height,
            0, 0,
            target.width, target.height,
            type, gpu.NEAREST)
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, target.FBO)
    }

    static allocateFramebuffer(id, width = GPUResources.internalResolution.w, height = GPUResources.internalResolution.h) {
        if (GPUResources.frameBuffers.get(id))
            return GPUResources.frameBuffers.get(id)
        const fbo = new Framebuffer(width, height)
        GPUResources.frameBuffers.set(id, fbo)
        return fbo
    }

    static destroyFramebuffer(id) {
        if (Object.values(STATIC_FRAMEBUFFERS).find(m => m === id))
            return
        const fbo = GPUResources.frameBuffers.get(id)
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
        GPUResources.frameBuffers.delete(id)
    }

    static allocateMesh(id, bufferData) {
        if (!bufferData || !id)
            return
        if (GPUResources.meshes.get(id) != null)
            GPUController.destroyMesh(GPUResources.meshes.get(id))
        const instance = new Mesh(bufferData)
        instance.id = id
        GPUResources.meshes.set(id, instance)
        return instance
    }

    static destroyMesh(instance) {
        if ([...Object.values(STATIC_MESHES.PRODUCTION), ...Object.values(STATIC_MESHES.EDITOR)].find(m => m === instance.id))
            return
        const mesh = typeof instance === "string" ? GPUResources.meshes.get(instance) : instance
        if (mesh instanceof Mesh) {
            gpu.deleteVertexArray(mesh.VAO)
            gpu.deleteBuffer(mesh.indexVBO)

            if (mesh.uvVBO)
                mesh.uvVBO.delete()
            if (mesh.normalVBO)
                mesh.normalVBO.delete()
            if (mesh.tangentVBO)
                mesh.tangentVBO.delete()
            GPUResources.meshes.delete(mesh.id)
        }
    }

    static allocateShader(id, vertex, fragment, cb) {
        const instance = new Shader(vertex, fragment, cb)
        GPUResources.shaders.set(id, instance)
        return instance
    }

    static destroyShader(id) {
        if (Object.values(STATIC_SHADERS.PRODUCTION).find(m => m === id) || Object.values(STATIC_SHADERS.DEVELOPMENT).find(m => m === id))
            return
        const instance = GPUResources.shaders.get(id)
        if (!instance)
            return
        gpu.deleteProgram(instance.program)
        GPUResources.shaders.delete(id)
    }
}