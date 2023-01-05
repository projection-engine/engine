import GPU from "../GPU";
import Mesh from "../instances/Mesh";
import CameraAPI from "../lib/utils/CameraAPI";
import EntityWorkerAPI from "../lib/utils/EntityWorkerAPI";
import SSAO from "./SSAO";
import {mat4} from "gl-matrix";
import DynamicMap from "../templates/DynamicMap";
import StaticShaders from "../lib/StaticShaders";
import StaticFBO from "../lib/StaticFBO";
import type Entity from "../instances/Entity";


export default class VisibilityRenderer {
    static meshesToDraw = new DynamicMap<Entity>()
    static needsUpdate = true

    static execute() {
        if (!VisibilityRenderer.needsUpdate && !EntityWorkerAPI.hasChangeBuffer[0])
            return

        const context = GPU.context
        const toRender = VisibilityRenderer.meshesToDraw.array
        const size = toRender.length
        const uniforms = StaticShaders.visibilityUniforms
        StaticShaders.visibility.bind()
        const VP = CameraAPI.metadata.cameraMotionBlur ? CameraAPI.previousViewProjectionMatrix : CameraAPI.viewProjectionMatrix
        context.uniformMatrix4fv(uniforms.viewProjection, false, CameraAPI.viewProjectionMatrix)
        context.uniformMatrix4fv(uniforms.previousViewProjection, false, VP)

        mat4.copy(CameraAPI.previousViewProjectionMatrix, CameraAPI.viewProjectionMatrix)

        StaticFBO.visibility.startMapping()
        Mesh.finishIfUsed()

        let isAlphaTested = 0, isDoubleSided = false, stateWasCleared = false

        context.enable(context.CULL_FACE)
        context.depthMask(true)

        for (let i = 0; i < size; i++) {
            isAlphaTested = 0
            const entity = toRender[i]
            const mesh = entity.meshRef
            const material = entity.materialRef
            const culling = entity.cullingComponent
            if (entity.isCulled || !entity.active || !mesh  || culling && culling.screenDoorEnabled && culling.screenDoorEffect)
                continue

            if (material) {
                if (material.isSky)
                    continue
                isAlphaTested = material.isAlphaTested ? 1 : 0
                if (material.doubleSided) {
                    context.disable(context.CULL_FACE)
                    isDoubleSided = true
                } else if (isDoubleSided) {
                    context.enable(context.CULL_FACE)
                    isDoubleSided = false
                }
                stateWasCleared = false
            } else if (!stateWasCleared) {
                stateWasCleared = true
                if (isDoubleSided) {
                    context.enable(context.CULL_FACE)
                    isDoubleSided = false
                }
            }

            context.uniform1i(uniforms.isAlphaTested, isAlphaTested)
            context.uniform3fv(uniforms.entityID, entity.pickID)
            context.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            context.uniformMatrix4fv(uniforms.previousModelMatrix, false, entity.previousModelMatrix)


            mesh.simplifiedDraw()
        }
        StaticFBO.visibility.stopMapping()

        SSAO.execute()
    }
}