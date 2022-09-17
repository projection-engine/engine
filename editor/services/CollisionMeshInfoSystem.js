import STATIC_MESHES from "../../static/resources/STATIC_MESHES";
import GPU from "../../production/GPU";
import COMPONENTS from "../../static/COMPONENTS.json";
import COLLISION_TYPES from "../../static/COLLISION_TYPES";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import WIREFRAMEGlsl from "../templates/WIREFRAME.glsl";
import CameraAPI from "../../production/apis/camera/CameraAPI";
import Engine from "../../production/Engine";
import {mat4, vec3} from "gl-matrix";

const EMPTY_MATRIX = mat4.create()



export default class CollisionMeshInfoSystem {
    static cube
    static sphere
    static shader

    static initialize() {
        CollisionMeshInfoSystem.shader = GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.WIREFRAME, WIREFRAMEGlsl.vertex, WIREFRAMEGlsl.fragment)
        CollisionMeshInfoSystem.cube = GPU.meshes.get(STATIC_MESHES.PRODUCTION.CUBE)
        CollisionMeshInfoSystem.sphere = GPU.meshes.get(STATIC_MESHES.PRODUCTION.SPHERE)

    }

    static execute(selected) {
        const size = selected.length

        if(size === 0 )
            return
        const entities = Engine.entitiesMap
        const obj = {
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix
        }

        for (let i = 0; i < size; i++) {
            const entity = entities.get(selected[i])

            if (!entity?.active || !entity.collisionTransformationMatrix)
                continue
            const collision = entity.components.get(COMPONENTS.PHYSICS_COLLIDER)
            if (!collision)
                continue
            if (entity.changesApplied || !entity.collisionUpdated) {
                entity.collisionUpdated = true
                const m = mat4.copy(entity.collisionTransformationMatrix, EMPTY_MATRIX)
                const translation = vec3.add([], collision.center, entity.absoluteTranslation)
                mat4.translate(m, m, translation)
                if (collision.collisionType === COLLISION_TYPES.BOX)
                    mat4.scale(m, m, collision.size)
                else {
                    const r = collision.radius
                    mat4.scale(m, m, [r, r, r])
                }
            }
            obj.transformMatrix = entity.collisionTransformationMatrix
            CollisionMeshInfoSystem.shader.bindForUse(obj)
            switch (collision.collisionType) {
                case COLLISION_TYPES.SPHERE:
                    CollisionMeshInfoSystem.sphere.draw()
                    break
                case COLLISION_TYPES.BOX:
                    CollisionMeshInfoSystem.cube.draw()
                    break
            }
        }
    }
}