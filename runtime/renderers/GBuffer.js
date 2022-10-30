import MaterialAPI from "../../api/rendering/MaterialAPI";
import Engine from "../../Engine";
import CameraAPI from "../../api/CameraAPI";
import GPUResources from "../../GPUResources";
import GlobalIlluminationPass from "../GlobalIlluminationPass";
import MATERIAL_RENDERING_TYPES from "../../static/MATERIAL_RENDERING_TYPES";


/**
 * "settings" uniform decomposition (vec4):
 * dirLightQuantity,   shadowMapResolution, shadowMapsQuantity, pointLightQuantity
 */

const SKYBOX_TYPE = MATERIAL_RENDERING_TYPES.SKYBOX
export default class GBuffer {
    static gBuffer
    static deferredShader
    static compositeFBO
    static toScreenShader
    static positionSampler
    static normalSampler
    static albedoSampler
    static behaviourSampler
    static ambientSampler

    static depthUVSampler
    static IDSampler
    static baseNormalSampler

    static forwardDepthShader
    static ready = false
    static toScreenUniforms = {}
    static deferredUniforms = {}

    static initialize() {
        if (GBuffer.ready)
            return
        GBuffer.positionSampler = GBuffer.gBuffer.colors[0]
        GBuffer.normalSampler = GBuffer.gBuffer.colors[1]
        GBuffer.albedoSampler = GBuffer.gBuffer.colors[2]
        GBuffer.behaviourSampler = GBuffer.gBuffer.colors[3]
        GBuffer.ambientSampler = GBuffer.gBuffer.colors[4]
        GBuffer.depthUVSampler = GBuffer.gBuffer.colors[5]
        GBuffer.IDSampler = GBuffer.gBuffer.colors[6]
        GBuffer.baseNormalSampler = GBuffer.gBuffer.colors[7]

        GBuffer.toScreenUniforms.uSampler = GBuffer.compositeFBO.colors[0]

        Object.assign(GBuffer.deferredUniforms, {
            positionSampler: GBuffer.positionSampler,
            normalSampler: GBuffer.normalSampler,
            albedoSampler: GBuffer.albedoSampler,
            behaviourSampler: GBuffer.behaviourSampler,
            ambientSampler: GBuffer.ambientSampler,
            cameraVec: CameraAPI.position,
            brdfSampler: GPUResources.BRDF,
            settings: new Float32Array(4),
        })

        GlobalIlluminationPass.normalUniforms.gNormal = GBuffer.baseNormalSampler
        GlobalIlluminationPass.uniforms.previousFrame = GBuffer.compositeFBO.colors[0]
        GlobalIlluminationPass.uniforms.gPosition = GBuffer.positionSampler
        GlobalIlluminationPass.uniforms.gNormal = GBuffer.normalSampler
        GlobalIlluminationPass.uniforms.gBehaviour = GBuffer.behaviourSampler

        GBuffer.ready = true

        GBuffer.uniforms = {
            cameraVec: CameraAPI.position,
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix
        }
    }

    static drawFrame() {
        GBuffer.toScreenShader.bindForUse(GBuffer.toScreenUniforms)
        GPUResources.quad.draw()
    }

    static execute() {
        const {meshes, terrain} = Engine.data
        const u = GBuffer.uniforms

        GBuffer.gBuffer.startMapping()
        MaterialAPI.loopMeshes(
            meshes,
            (mat, mesh, meshComponent, current) => {
                if (!mat.isDeferredShaded) {
                    if (mat.shadingType === SKYBOX_TYPE)
                        return
                    GBuffer.forwardDepthShader.bindForUse(u)
                    mesh.draw()
                    return;
                }
                u.transformMatrix = current.matrix
                u.normalMatrix = current.normalMatrix
                u.meshID = current.pickID
                MaterialAPI.drawMesh(
                    current.id,
                    mesh,
                    mat,
                    meshComponent,
                    u)
            }
        )

        MaterialAPI.loopTerrain(
            terrain,
            (mat, mesh, meshComponent, current) => {
                u.transformMatrix = current.matrix
                MaterialAPI.drawMesh(current.id, mesh, mat, meshComponent, u)
            }
        )

        GBuffer.gBuffer.stopMapping()
    }

    static drawBuffer(entities, onWrap) {
        onWrap(false)
        GBuffer.compositeFBO.startMapping()
        onWrap(true)

        GBuffer.deferredShader.bindForUse(GBuffer.deferredUniforms)
        GPUResources.quad.draw()
        GBuffer.compositeFBO.stopMapping()
    }
}