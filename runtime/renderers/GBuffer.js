import CameraAPI from "../../api/CameraAPI";
import GPU from "../../GPU";
import GlobalIlluminationPass from "../GlobalIlluminationPass";
import UBO from "../../instances/UBO";
import DiffuseProbePass from "./DiffuseProbePass";
import COMPONENTS from "../../static/COMPONENTS";
import SpecularProbePass from "./SpecularProbePass";
import AmbientOcclusion from "../occlusion/AmbientOcclusion";
import DirectionalShadows from "../occlusion/DirectionalShadows";
import OmnidirectionalShadows from "../occlusion/OmnidirectionalShadows";


let shader, uniforms
export default class GBuffer {
    static gBuffer
    static deferredShader
    static compositeFBO
    static toScreenShader
    static positionSampler
    static normalSampler
    static albedoSampler
    static behaviourSampler
    static velocityMapSampler
    static depthUVSampler
    static IDSampler
    static baseNormalSampler

    static forwardDepthShader
    static ready = false
    static toScreenUniforms = {}
    static deferredUniforms = {}
    static UBO


    static initialize() {
        if (GBuffer.ready)
            return
        shader = GBuffer.deferredShader
        uniforms = shader.uniformMap
        GBuffer.UBO = new UBO(
            "DeferredSettings",
            4,
            [
                {name: "shadowMapsQuantity", type: "float"},
                {name: "shadowMapResolution", type: "float"},
                {name: "ambientLODSamples", type: "float"},
                {name: "hasAO", type: "bool"},
                {name: "hasDiffuseProbe", type: "bool"},
                {name: "hasSpecularProbe", type: "bool"},

            ]
        )
        GBuffer.UBO.updateData("hasSpecularProbe", new Uint8Array([0]))
        GBuffer.UBO.updateData("hasDiffuseProbe", new Uint8Array([0]))
        GBuffer.UBO.bindWithShader(shader.program)

        GBuffer.positionSampler = GBuffer.gBuffer.colors[0]
        GBuffer.normalSampler = GBuffer.gBuffer.colors[1]
        GBuffer.albedoSampler = GBuffer.gBuffer.colors[2]
        GBuffer.behaviourSampler = GBuffer.gBuffer.colors[3]
        GBuffer.depthUVSampler = GBuffer.gBuffer.colors[4]
        GBuffer.IDSampler = GBuffer.gBuffer.colors[5]
        GBuffer.baseNormalSampler = GBuffer.gBuffer.colors[6]
        GBuffer.velocityMapSampler = GBuffer.gBuffer.colors[7]

        GBuffer.toScreenUniforms.uSampler = GBuffer.compositeFBO.colors[0]
        GBuffer.ready = true

        GBuffer.uniforms = {
            cameraPosition: CameraAPI.position,
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix
        }


    }

    // TODO - SORT BY DISTANCE FROM CAMERA
    static updateUBOProbe(dE, sE) {
        const diffuse = dE.components.get(COMPONENTS.PROBE), specular = sE.components.get(COMPONENTS.PROBE)
        if (diffuse)
            DiffuseProbePass.sampler = DiffuseProbePass.diffuseProbes[dE.id]?.prefiltered
        if (specular)
            SpecularProbePass.sampler = SpecularProbePass.specularProbes[sE.id]?.irradianceTexture

        GBuffer.UBO.bind()
        GBuffer.UBO.updateData("hasDiffuseProbe", new Uint8Array([diffuse ? 1 : 0]))
        if (specular)
            GBuffer.UBO.updateData("ambientLODSamples", new Float32Array([specular.mipmaps]))
        GBuffer.UBO.updateData("hasSpecularProbe", new Uint8Array([specular ? 1 : 0]))
        GBuffer.UBO.unbind()
    }

    static drawFrame() {
        GBuffer.toScreenShader.bindForUse(GBuffer.toScreenUniforms)
        GPU.quad.draw()
    }

    static drawBuffer(entities, onWrap) {
        onWrap(false)
        GBuffer.compositeFBO.startMapping()
        onWrap(true)

        shader.bind()

        gpu.uniform3fv(uniforms.cameraPosition, CameraAPI.position)

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.albedoSampler)
        gpu.uniform1i(uniforms.albedoSampler, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, AmbientOcclusion.filteredSampler)
        gpu.uniform1i(uniforms.aoSampler, 1)

        gpu.activeTexture(gpu.TEXTURE2)
        gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.behaviourSampler)
        gpu.uniform1i(uniforms.behaviourSampler, 2)

        gpu.activeTexture(gpu.TEXTURE3)
        gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.normalSampler)
        gpu.uniform1i(uniforms.normalSampler, 3)

        gpu.activeTexture(gpu.TEXTURE4)
        gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.positionSampler)
        gpu.uniform1i(uniforms.positionSampler, 4)

        gpu.activeTexture(gpu.TEXTURE5)
        gpu.bindTexture(gpu.TEXTURE_2D, GlobalIlluminationPass.SSGISampler)
        gpu.uniform1i(uniforms.screenSpaceGI, 5)

        gpu.activeTexture(gpu.TEXTURE6)
        gpu.bindTexture(gpu.TEXTURE_2D, GlobalIlluminationPass.SSRSampler)
        gpu.uniform1i(uniforms.screenSpaceReflections, 6)

        gpu.activeTexture(gpu.TEXTURE7)
        gpu.bindTexture(gpu.TEXTURE_2D, DirectionalShadows.sampler)
        gpu.uniform1i(uniforms.shadowMapTexture, 7)

        gpu.activeTexture(gpu.TEXTURE8)
        gpu.bindTexture(gpu.TEXTURE_2D, GPU.BRDF)
        gpu.uniform1i(uniforms.brdfSampler, 8)

        gpu.activeTexture(gpu.TEXTURE9)
        gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, OmnidirectionalShadows.sampler)
        gpu.uniform1i(uniforms.shadowCube, 9)

        if (SpecularProbePass.sampler) {
            gpu.activeTexture(gpu.TEXTURE10)
            gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, SpecularProbePass.sampler)
            gpu.uniform1i(uniforms.prefilteredMap, 10)
        }

        if (DiffuseProbePass.sampler) {
            const index = SpecularProbePass.sampler ? 11 : 10
            gpu.activeTexture(gpu.TEXTURE0 + index)
            gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, DiffuseProbePass.sampler)
            gpu.uniform1i(uniforms.irradianceMap, index)
        }

        GPU.quad.draw()
        GBuffer.compositeFBO.stopMapping()
    }
}