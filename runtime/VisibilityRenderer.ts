import GPU from "../GPU";
import CameraAPI from "../lib/utils/CameraAPI";
import EntityWorkerAPI from "../lib/utils/EntityWorkerAPI";
import SSAO from "./SSAO";
import {mat4} from "gl-matrix";
import StaticShaders from "../lib/StaticShaders";
import StaticFBO from "../lib/StaticFBO";
import ResourceEntityMapper from "../resource-libs/ResourceEntityMapper";
import StaticMeshes from "../lib/StaticMeshes";
import MATERIAL_RENDERING_TYPES from "../static/MATERIAL_RENDERING_TYPES";
import MetricsController from "../lib/utils/MetricsController";
import METRICS_FLAGS from "../static/METRICS_FLAGS";
import MotionBlur from "./MotionBlur";
import loopMeshes from "./loop-meshes";
import Entity from "../instances/Entity";
import Mesh from "../instances/Mesh";

const entityMetadata = new Float32Array(16)
let context: WebGL2RenderingContext, uniforms, VP
export default class VisibilityRenderer {
    static needsUpdate = true
    static #isSecondPass = false

    static #bindUniforms() {
        uniforms = StaticShaders.visibilityUniforms
        VP = CameraAPI.cameraMotionBlur ? CameraAPI.previousViewProjectionMatrix : CameraAPI.viewProjectionMatrix
        context.uniformMatrix4fv(uniforms.viewProjection, false, CameraAPI.viewProjectionMatrix)
        context.uniformMatrix4fv(uniforms.previousViewProjection, false, VP)
        context.uniformMatrix4fv(uniforms.viewMatrix, false, CameraAPI.viewMatrix)
        context.uniform3fv(uniforms.cameraPlacement, CameraAPI.position)
        mat4.copy(CameraAPI.previousViewProjectionMatrix, CameraAPI.viewProjectionMatrix)
    }

    static #drawSprites() {
        const toRender = ResourceEntityMapper.sprites.array
        const size = toRender.length
        if (size === 0)
            return
        entityMetadata[5] = 1 // IS SPRITE

        context.disable(context.CULL_FACE)
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

            context.uniformMatrix4fv(uniforms.metadata, false, entityMetadata)
            context.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            context.uniformMatrix4fv(uniforms.previousModelMatrix, false, entity.previousModelMatrix)

            StaticMeshes.drawQuad()
        }
        context.enable(context.CULL_FACE)
    }

    static #drawMesh(entity: Entity, mesh: Mesh) {

        const culling = entity.cullingComponent
        const hasScreenDoor = culling && culling.screenDoorEnabled && culling.screenDoorEffect

        entityMetadata[0] = entity.pickID[0]
        entityMetadata[1] = entity.pickID[1]
        entityMetadata[2] = entity.pickID[2]
        entityMetadata[4] = hasScreenDoor || entity.materialRef?.renderingMode === MATERIAL_RENDERING_TYPES.TRANSPARENCY ? 1 : 0

        context.uniformMatrix4fv(uniforms.metadata, false, entityMetadata)
        context.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
        if (MotionBlur.enabled)
            context.uniformMatrix4fv(uniforms.previousModelMatrix, false, entity.previousModelMatrix)

        mesh.simplifiedDraw()
    }

    static execute() {
        if (!VisibilityRenderer.needsUpdate && !EntityWorkerAPI.hasChangeBuffer[0])
            return

        context = GPU.context
        if (!VisibilityRenderer.#isSecondPass) {
            VisibilityRenderer.#isSecondPass = true
            VisibilityRenderer.needsUpdate = true
        } else {
            VisibilityRenderer.needsUpdate = false
            VisibilityRenderer.#isSecondPass = false
        }

        StaticShaders.visibility.bind()
        StaticFBO.visibility.startMapping()
        VisibilityRenderer.#bindUniforms()
        entityMetadata[5] = 0
        loopMeshes(VisibilityRenderer.#drawMesh)

        VisibilityRenderer.#drawSprites()
        StaticFBO.visibility.stopMapping()
        MetricsController.currentState = METRICS_FLAGS.VISIBILITY


        SSAO.execute()
    }
}