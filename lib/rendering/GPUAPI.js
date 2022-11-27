import Texture from "../../instances/Texture";
import Material from "../../instances/Material";

import STATIC_TEXTURES from "../../static/resources/STATIC_TEXTURES";
import Framebuffer from "../../instances/Framebuffer";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import Mesh from "../../instances/Mesh";
import STATIC_MESHES from "../../static/resources/STATIC_MESHES";
import Shader from "../../instances/Shader";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import GPU from "../../GPU";
import MaterialAPI from "./MaterialAPI";
import VisibilityBuffer from "../../runtime/rendering/VisibilityBuffer";

export default class GPUAPI {
    static async allocateTexture(imageData, id) {
        if (GPU.textures.get(id) != null)
            return GPU.textures.get(id)
        const texture = new Texture()
        GPU.textures.set(id, texture)
        await texture.initialize(typeof imageData === "object" ? imageData : {img: imageData})
        GPU.materials.forEach(material => {
            if (material.texturesInUse[id] != null) {
                const data = material.texturesInUse[id]
                material.uniformValues[data.key] = texture.texture
            }
        })
        VisibilityBuffer.needsUpdate = true
        return texture
    }

    static destroyTexture(imageID) {
        const found = GPU.textures.get(imageID)
        if (!found)
            return
        if (found.texture instanceof WebGLTexture)
            gpu.deleteTexture(found.texture)
        GPU.textures.delete(imageID)
    }

    static async allocateMaterial(materialInformation, id) {
        const material = new Material(id)
        material.updateMaterialDeclaration(materialInformation.functionDeclaration, materialInformation.uniformsDeclaration)
        await material.updateUniformGroup(materialInformation.uniformsData)
        MaterialAPI.registerMaterial(material)
        const settings=  materialInformation.settings

        material.cullFace = settings.cullFace
        material.noDepthTest = settings.noDepthTest
        material.isAlphaTested = settings.isAlphaTested

        GPU.materials.set(id, material)

        Material.compileUberShader()
        VisibilityBuffer.needsUpdate = true
        return material
    }


    static createBuffer(type, data, renderingType = gpu.STATIC_DRAW) {
        if (!data && data.buffer instanceof ArrayBuffer && data.byteLength !== undefined || data.length === 0)
            return null
        const buffer = gpu.createBuffer()
        gpu.bindBuffer(type, buffer)
        gpu.bufferData(type, data, renderingType)
        return buffer
    }


    static cleanUpTextures() {
        const mat = Array.from(GPU.materials.values())
        const textures = Array.from(GPU.textures.keys())
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
                GPUAPI.destroyTexture(t)
        })
    }

    static copyTexture(target, source, type = gpu.DEPTH_BUFFER_BIT, blitType = gpu.NEAREST) {
        gpu.bindFramebuffer(gpu.READ_FRAMEBUFFER, source.FBO)
        gpu.bindFramebuffer(gpu.DRAW_FRAMEBUFFER, target.FBO)
        gpu.blitFramebuffer(
            0, 0,
            source.width, source.height,
            0, 0,
            target.width, target.height,
            type,
            blitType
        )
    }

    static allocateFramebuffer(id, width = GPU.internalResolution.w, height = GPU.internalResolution.h) {
        if (GPU.frameBuffers.get(id))
            return GPU.frameBuffers.get(id)
        const fbo = new Framebuffer(width, height)
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

    static allocateMesh(id, bufferData) {
        if (!bufferData || !id)
            return
        if (GPU.meshes.get(id) != null)
            GPUAPI.destroyMesh(GPU.meshes.get(id))
        const instance = new Mesh(bufferData)
        instance.id = id
        GPU.meshes.set(id, instance)
        VisibilityBuffer.needsUpdate = true
        return instance
    }

    static destroyMesh(instance) {
        if ([...Object.values(STATIC_MESHES.PRODUCTION), ...Object.values(STATIC_MESHES.EDITOR)].find(m => m === instance.id))
            return
        const mesh = typeof instance === "string" ? GPU.meshes.get(instance) : instance
        if (mesh instanceof Mesh) {
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
        VisibilityBuffer.needsUpdate = true
    }
    static allocateShader(id, vertex, fragment) {
        const instance = new Shader(vertex, fragment)
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