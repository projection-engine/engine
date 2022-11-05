import CameraAPI from "../../api/CameraAPI";
import GPU from "../../GPU";
import GlobalIlluminationPass from "../GlobalIlluminationPass";
import UBO from "../../instances/UBO";
import DiffuseProbePass from "./DiffuseProbePass";
import COMPONENTS from "../../static/COMPONENTS";
import SpecularProbePass from "./SpecularProbePass";


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
        GBuffer.UBO.bindWithShader(GBuffer.deferredShader.program)

        GBuffer.positionSampler = GBuffer.gBuffer.colors[0]
        GBuffer.normalSampler = GBuffer.gBuffer.colors[1]
        GBuffer.albedoSampler = GBuffer.gBuffer.colors[2]
        GBuffer.behaviourSampler = GBuffer.gBuffer.colors[3]
        GBuffer.depthUVSampler = GBuffer.gBuffer.colors[4]
        GBuffer.IDSampler = GBuffer.gBuffer.colors[5]
        GBuffer.baseNormalSampler = GBuffer.gBuffer.colors[6]
        GBuffer.velocityMapSampler = GBuffer.gBuffer.colors[7]

        GBuffer.toScreenUniforms.uSampler = GBuffer.compositeFBO.colors[0]

        Object.assign(GBuffer.deferredUniforms, {
            positionSampler: GBuffer.positionSampler,
            normalSampler: GBuffer.normalSampler,
            albedoSampler: GBuffer.albedoSampler,
            behaviourSampler: GBuffer.behaviourSampler,
            cameraPosition: CameraAPI.position,
            brdfSampler: GPU.BRDF,
        })

        GlobalIlluminationPass.normalUniforms.gNormal = GBuffer.baseNormalSampler
        GlobalIlluminationPass.uniforms.previousFrame = GBuffer.compositeFBO.colors[0]
        GlobalIlluminationPass.uniforms.gPosition = GBuffer.positionSampler
        GlobalIlluminationPass.uniforms.gNormal = GBuffer.normalSampler
        GlobalIlluminationPass.uniforms.gBehaviour = GBuffer.behaviourSampler

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
            GBuffer.deferredUniforms.prefilteredMap = DiffuseProbePass.diffuseProbes[dE.id]?.prefiltered
        if (specular)
            GBuffer.deferredUniforms.irradiance = SpecularProbePass.specularProbes[sE.id]?.irradianceTexture

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

        GBuffer.deferredShader.bindForUse(GBuffer.deferredUniforms)
        GPU.quad.draw()
        GBuffer.compositeFBO.stopMapping()
    }
}