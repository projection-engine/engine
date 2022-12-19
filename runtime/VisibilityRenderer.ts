import GPU from "../GPU";
import Mesh from "../instances/Mesh";
import CameraAPI from "../lib/utils/CameraAPI";
import EntityWorkerAPI from "../lib/utils/EntityWorkerAPI";
import SSAO from "./SSAO";
import {mat4} from "gl-matrix";
import DynamicMap from "../templates/DynamicMap";
import StaticShadersController from "../lib/StaticShadersController";
import StaticFBOsController from "../lib/StaticFBOsController";


export default class VisibilityRenderer {
    static meshesToDraw = new DynamicMap()
    static needsUpdate = true
    static needsSSAOUpdate = false

    static execute() {
        if (!VisibilityRenderer.needsUpdate && !EntityWorkerAPI.hasChangeBuffer[0])
            return

        VisibilityRenderer.needsSSAOUpdate = true
        const toRender = VisibilityRenderer.meshesToDraw.array
        const size = toRender.length
        const uniforms = StaticShadersController.visibilityUniforms
        StaticShadersController.visibility.bind()
        const VP = CameraAPI.metadata.cameraMotionBlur ? CameraAPI.previousViewProjectionMatrix : CameraAPI.viewProjectionMatrix
        GPU.context.uniformMatrix4fv(uniforms.viewProjection, false, CameraAPI.viewProjectionMatrix)
        GPU.context.uniformMatrix4fv(uniforms.previousViewProjection, false, VP)

        mat4.copy(CameraAPI.previousViewProjectionMatrix, CameraAPI.viewProjectionMatrix)

        StaticFBOsController.visibility.startMapping()
        Mesh.finishIfUsed()

        let isAlphaTested = 0, isDoubleSided = false, stateWasCleared = false

        GPU.context.enable(GPU.context.CULL_FACE)
        GPU.context.depthMask(true)

        for (let i = 0; i < size; i++) {
            isAlphaTested = 0
            const entity = toRender[i]
            const mesh = entity.__meshRef
            const material = entity.__materialRef
            if (!entity.active || !mesh || entity.isCulled)
                continue

            if (material) {
                if (material.isSky)
                    continue
                isAlphaTested = material.isAlphaTested ? 1 : 0
                if (material.doubleSided) {
                    GPU.context.disable(GPU.context.CULL_FACE)
                    isDoubleSided = true
                } else if (isDoubleSided) {
                    GPU.context.enable(GPU.context.CULL_FACE)
                    isDoubleSided = false
                }
                stateWasCleared = false
            } else if (!stateWasCleared) {
                stateWasCleared = true
                if (isDoubleSided) {
                    GPU.context.enable(GPU.context.CULL_FACE)
                    isDoubleSided = false
                }
            }

            GPU.context.uniform1i(uniforms.isAlphaTested, isAlphaTested)
            GPU.context.uniform3fv(uniforms.entityID, entity.pickID)
            GPU.context.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            GPU.context.uniformMatrix4fv(uniforms.previousModelMatrix, false, entity.previousModelMatrix)


            mesh.simplifiedDraw()
        }
        StaticFBOsController.visibility.stopMapping()

        SSAO.execute()
    }
}