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
import EntityComponentMapping from "../lib/EntityComponentMapping";
import StaticMeshes from "../lib/StaticMeshes";

const entityMetadata = new Float32Array(16)
let  context, toRender:Entity[], size, uniforms, VP
export default class VisibilityRenderer {
    static needsUpdate = true

    static execute() {
        if (!VisibilityRenderer.needsUpdate && !EntityWorkerAPI.hasChangeBuffer[0])
            return

        StaticShaders.visibility.bind()
        context = GPU.context
        toRender = EntityComponentMapping.meshesToDraw.array
        size = toRender.length
        uniforms = StaticShaders.visibilityUniforms
        VP = CameraAPI.metadata.cameraMotionBlur ? CameraAPI.previousViewProjectionMatrix : CameraAPI.viewProjectionMatrix

        context.uniformMatrix4fv(uniforms.viewProjection, false, CameraAPI.viewProjectionMatrix)
        context.uniformMatrix4fv(uniforms.previousViewProjection, false, VP)

        context.uniformMatrix4fv(uniforms.viewMatrix, false, VP)
        context.uniformMatrix4fv(uniforms.projectionMatrix, false, VP)

        context.uniformMatrix4fv(uniforms.viewMatrix, false, CameraAPI.viewMatrix)
        context.uniformMatrix4fv(uniforms.projectionMatrix, false, CameraAPI.projectionMatrix)
        context.uniform3fv(uniforms.cameraPlacement, CameraAPI.position)

        mat4.copy(CameraAPI.previousViewProjectionMatrix, CameraAPI.viewProjectionMatrix)
        StaticFBO.visibility.startMapping()
        Mesh.finishIfUsed()

        context.disable(GPU.context.CULL_FACE)

        entityMetadata[5] = 0 // IS NOT SPRITE

        for (let i = 0; i < size; i++) {

            const entity = toRender[i]
            const mesh = entity.meshRef
            const material = entity.materialRef
            const culling = entity.cullingComponent
            const hasScreenDoor = culling && culling.screenDoorEnabled && culling.screenDoorEffect
            if (entity.isCulled || !entity.active || !mesh || material?.isSky)
                continue

            entityMetadata[0] = entity.pickID[0]
            entityMetadata[1] = entity.pickID[1]
            entityMetadata[2] = entity.pickID[2]

            entityMetadata[4] = hasScreenDoor || material?.isAlphaTested ? 1 : 0

            context.uniformMatrix4fv(uniforms.metadata, false, entityMetadata)
            context.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            context.uniformMatrix4fv(uniforms.previousModelMatrix, false, entity.previousModelMatrix)

            mesh.simplifiedDraw()
        }

        toRender = EntityComponentMapping.sprites.array
        size = toRender.length

        entityMetadata[5] = 1 // IS SPRITE

        for (let i = 0; i < size; i++) {
            const entity = toRender[i]
            const culling = entity.cullingComponent
            const sprite = entity.spriteComponent
            const hasScreenDoor = culling && culling.screenDoorEnabled && culling.screenDoorEffect
            if (entity.isCulled || !entity.active || hasScreenDoor)
                continue

            entityMetadata[0] = entity.pickID[0]
            entityMetadata[1] = entity.pickID[1]
            entityMetadata[2] = entity.pickID[2]

            entityMetadata[4] = hasScreenDoor ? 1 : 0

            entityMetadata[8] = sprite.attributes[0]
            entityMetadata[9] = sprite.attributes[1]

            entityMetadata[12] = entity.scaling[0]
            entityMetadata[13] = entity.scaling[1]
            entityMetadata[14] = entity.scaling[2]

            context.uniformMatrix3fv(uniforms.metadata, false, entityMetadata)
            context.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            context.uniformMatrix4fv(uniforms.previousModelMatrix, false, entity.previousModelMatrix)

            StaticMeshes.drawQuad()
        }

        StaticFBO.visibility.stopMapping()
        context.enable(GPU.context.CULL_FACE)

        SSAO.execute()
    }
}