import STATIC_MESHES from "../../static/resources/STATIC_MESHES";
import GPU from "../../GPU";
import COMPONENTS from "../../static/COMPONENTS.js";
import COLLISION_TYPES from "../../static/COLLISION_TYPES";
import CameraAPI from "../../lib/utils/CameraAPI";
import Engine from "../../Engine";
import {mat4, vec3} from "gl-matrix";

const EMPTY_MATRIX = mat4.create()

let shader, uniforms
export default class CollisionVisualizationSystem {
    static cube
    static sphere
    static shader

    static initialize() {
        shader = CollisionVisualizationSystem.shader
        uniforms = shader.uniformMap
        CollisionVisualizationSystem.cube = GPU.meshes.get(STATIC_MESHES.PRODUCTION.CUBE)
        CollisionVisualizationSystem.sphere = GPU.meshes.get(STATIC_MESHES.PRODUCTION.SPHERE)

    }

    static execute(selected) {
        const size = selected.length
        if (size === 0)
            return
        shader.bind()
        for (let i = 0; i < size; i++) {
            const entity = selected[i]
            if (!entity.active)
                continue
            const collision = entity.components.get(COMPONENTS.PHYSICS_COLLIDER)

            if (!collision)
                continue
            if (entity.changesApplied || !entity.__collisionTransformationMatrix) {
                entity.collisionUpdated = true
                const m = entity.__collisionTransformationMatrix || mat4.clone(EMPTY_MATRIX)
                const translation = vec3.add([], collision.center, entity.absoluteTranslation)
                let scale
                const rotation = entity._rotationQuat
                if (collision.collisionType === COLLISION_TYPES.BOX)
                    scale = collision.size
                else {
                    const r = collision.radius
                    scale = [r, r, r]
                }
                mat4.fromRotationTranslationScale(m, rotation, translation, scale)
                entity.__collisionTransformationMatrix = m
            }

            gpu.uniformMatrix4fv(uniforms.transformMatrix, false, entity.__collisionTransformationMatrix)
            switch (collision.collisionType) {
                case COLLISION_TYPES.SPHERE:
                    CollisionVisualizationSystem.sphere.draw()
                    break
                case COLLISION_TYPES.BOX:
                    CollisionVisualizationSystem.cube.drawLines()
                    break
            }
        }
    }
}